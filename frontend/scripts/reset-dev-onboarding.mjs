// One-shot dev script: reset DEV_USER (00000000-0000-0000-0000-000000000000)
// onboarding state so the redesigned wizard can be walked end-to-end.
// Run from frontend/: node --env-file=.env.local scripts/reset-dev-onboarding.mjs
import { createClient } from '@supabase/supabase-js';

const DEV_USER_ID = '00000000-0000-0000-0000-000000000000';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(url, key);

const userReset = await supabase
  .from('users')
  .update({
    display_name: null,
    primary_pain: null,
    bir_consent: null,
    onboarding_step: 0,
    onboarding_completed: false,
  })
  .eq('id', DEV_USER_ID)
  .select('id, onboarding_step, onboarding_completed');

console.log('users reset →', userReset.error ?? userReset.data);

const profileSoftDelete = await supabase
  .from('business_profiles')
  .update({ deleted_at: new Date().toISOString() })
  .eq('user_id', DEV_USER_ID)
  .is('deleted_at', null)
  .select('id, business_type');

console.log('business_profiles soft-deleted →', profileSoftDelete.error ?? profileSoftDelete.data);

const conversationsClear = await supabase
  .from('ka_conversations')
  .delete()
  .eq('user_id', DEV_USER_ID)
  .eq('domain', 'onboarding')
  .select('id');

console.log('ka_conversations onboarding rows deleted →', conversationsClear.error ?? conversationsClear.data?.length ?? 0);

const auth = await supabase.auth.admin
  .updateUserById(DEV_USER_ID, { user_metadata: { welcome_tour_completed: false } })
  .catch((err) => ({ error: err }));
console.log('user_metadata.welcome_tour_completed reset →', auth?.error ?? 'ok (or skipped — not a real auth user)');

console.log('\nDone. Reload /onboarding to walk Phase 6.');
