/**
 * /lib/supabase/queries/ka-conversations.ts
 * Store and retrieve KA conversation history
 * Implements soft-delete, timezone-aware timestamps, domain tagging
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/types';
import type { ConversationHistoryItem } from '@/lib/utils/zod-schemas/ka-chat-schema';

type KAConversation = Database['public']['Tables']['ka_conversations']['Row'];

const CONVERSATION_HISTORY_LIMIT = 10; // Last N messages for context window

/**
 * Store a message in ka_conversations table
 * Can be user message or assistant message
 */
export async function storeConversationMessage(params: {
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  domain: string;
  tokens_input?: number;
  tokens_output?: number;
  model?: string;
  cost_centavos?: number;
}): Promise<KAConversation> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('ka_conversations')
    .insert({
      user_id: params.user_id,
      role: params.role,
      content: params.content,
      domain: params.domain,
      tokens_input: params.tokens_input,
      tokens_output: params.tokens_output,
      model: params.model,
      cost_centavos: params.cost_centavos,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to store conversation message: ${error.message}`);
  }

  return data;
}

/**
 * Fetch recent conversation history for context window
 * Returns last N messages (user + assistant) in chronological order
 * Excludes soft-deleted messages
 */
export async function getConversationHistory(
  userId: string,
  domain?: string,
  limit = CONVERSATION_HISTORY_LIMIT
): Promise<ConversationHistoryItem[]> {
  const supabase = createClient();

  let query = supabase
    .from('ka_conversations')
    .select('role, content')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  // Optional: filter by domain if specified
  if (domain) {
    query = query.eq('domain', domain);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch conversation history:', error);
    return []; // Degrade gracefully — continue without history
  }

  return (
    data?.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })) ?? []
  );
}

/**
 * Soft-delete a conversation message
 * User can delete their own messages; only service role can delete others
 */
export async function softDeleteConversationMessage(
  userId: string,
  messageId: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('ka_conversations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Failed to delete conversation message: ${error.message}`);
  }
}

/**
 * Get conversation statistics for a user
 * Used for analytics and feature insights
 */
export async function getConversationStats(userId: string): Promise<{
  total_messages: number;
  by_domain: Record<string, number>;
  by_role: Record<'user' | 'assistant', number>;
  total_tokens: number;
  total_cost_centavos: number;
}> {
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from('ka_conversations')
    .select(
      'domain, role, tokens_input, tokens_output, cost_centavos'
    )
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (error) {
    console.error('Failed to get conversation stats:', error);
    return {
      total_messages: 0,
      by_domain: {},
      by_role: { user: 0, assistant: 0 },
      total_tokens: 0,
      total_cost_centavos: 0,
    };
  }

  const stats = {
    total_messages: data?.length ?? 0,
    by_domain: {} as Record<string, number>,
    by_role: { user: 0, assistant: 0 } as Record<'user' | 'assistant', number>,
    total_tokens: 0,
    total_cost_centavos: 0,
  };

  data?.forEach((msg) => {
    // Count by domain
    if (msg.domain) {
      stats.by_domain[msg.domain] = (stats.by_domain[msg.domain] ?? 0) + 1;
    }

    // Count by role
    stats.by_role[msg.role]++;

    // Sum tokens and cost
    stats.total_tokens += (msg.tokens_input ?? 0) + (msg.tokens_output ?? 0);
    stats.total_cost_centavos += msg.cost_centavos ?? 0;
  });

  return stats;
}

/**
 * Prune old conversation history for user
 * Keeps only the most recent N messages per domain
 * Used as cleanup task (not called from API routes)
 */
export async function pruneConversationHistory(
  userId: string,
  keepPerDomain = 50
): Promise<number> {
  const adminSupabase = createAdminClient();

  // Get all message IDs beyond the keep limit, grouped by domain
  const { data: messagesToDelete, error } = await adminSupabase
    .from('ka_conversations')
    .select('id, domain')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get messages for pruning:', error);
    return 0;
  }

  const domainCounts: Record<string, number> = {};
  const idsToDelete: string[] = [];

  messagesToDelete?.forEach((msg) => {
    const domain = msg.domain || 'general';
    domainCounts[domain] = (domainCounts[domain] ?? 0) + 1;

    // Mark for deletion if over limit
    if (domainCounts[domain] > keepPerDomain) {
      idsToDelete.push(msg.id);
    }
  });

  if (idsToDelete.length === 0) {
    return 0;
  }

  // Soft-delete in batches
  const batchSize = 100;
  for (let i = 0; i < idsToDelete.length; i += batchSize) {
    const batch = idsToDelete.slice(i, i + batchSize);
    const { error: deleteError } = await adminSupabase
      .from('ka_conversations')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', batch);

    if (deleteError) {
      console.error('Failed to prune conversation messages:', deleteError);
      return i; // Return count of successfully deleted
    }
  }

  return idsToDelete.length;
}
