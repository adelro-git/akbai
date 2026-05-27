/**
 * Chat — Shared types
 * Feature: Phase 8c — offline composer queue + chat surface types
 * Role: Single source of truth for `ChatMessage` so the server page, client
 *       interface, message list, and offline-queue lib all agree on shape.
 *
 * Why here (vs co-located on chat-interface.tsx): the offline-queue feature
 * needs `queued?: boolean` on the message bubble AND the server page needs
 * to type `initialMessages`. Duplicating the type in two `'use client'`
 * files (chat-interface.tsx + page.tsx) made a drift hazard — one place
 * could add `queued` and the other could miss it. Centralized here per
 * conventions in lib/chat/* and lib/expenses/categories.ts.
 */

// ============================================================
// ChatMessage — the bubble unit rendered by MessageList
// ============================================================

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  /**
   * Phase 8c — offline queue indicator. Set to `true` on the user bubble
   * appended while `navigator.onLine === false` so MessageList can render
   * a small clock affordance ("Naka-queue — i-send pag may connection").
   * Optional + defaults to falsy so all existing rows render unchanged.
   */
  queued?: boolean;
};
