// ============================================================
// Push Send — platform-branching tests (Sprint 16)
// Feature: lib/push/send.ts.sendPushToUser fanout
//
// Scope: validates the new platform-branching logic added in Sprint 16
//        (architect §3). Web rows continue to flow through web-push; native
//        rows are persisted but delivery is soft-skipped with a TODO log
//        until Sprint 19 wires firebase-admin.
//
// Reference: sprint-16-native-plugin-pattern.md §3.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Mocks — web-push, supabase service client.
// ============================================================

const mockSendNotification = vi.fn();
const mockSetVapidDetails = vi.fn();

vi.mock('web-push', () => ({
  default: {
    sendNotification: (...args: unknown[]) => mockSendNotification(...args),
    setVapidDetails: (...args: unknown[]) => mockSetVapidDetails(...args),
  },
}));

// Per-test seam: the supabase service client returns rows the test plants.
const mockSubscriptions: Array<Record<string, unknown>> = [];
const mockPreference: { enabled: boolean } | null = null;
const mockInsert = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      if (table === 'notification_preferences') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                is: () => ({
                  maybeSingle: async () => ({ data: mockPreference, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'push_subscriptions') {
        return {
          select: () => ({
            eq: () => ({
              is: async () => ({ data: mockSubscriptions, error: null }),
            }),
          }),
          update: (values: unknown) => ({
            in: async (col: string, ids: string[]) => {
              mockUpdate(values, col, ids);
              return { data: null, error: null };
            },
          }),
        };
      }
      if (table === 'notifications') {
        return {
          insert: async (row: unknown) => {
            mockInsert(row);
            return { data: null, error: null };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

// ============================================================
// Helpers
// ============================================================

function seedSubscriptions(rows: Array<Record<string, unknown>>) {
  mockSubscriptions.length = 0;
  mockSubscriptions.push(...rows);
}

beforeEach(() => {
  mockSendNotification.mockReset();
  mockSetVapidDetails.mockReset();
  mockInsert.mockReset();
  mockUpdate.mockReset();
  mockSubscriptions.length = 0;
  // Ensure VAPID env so getVapidConfig() doesn't throw on web-path tests.
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'pub-key';
  process.env.VAPID_PRIVATE_KEY = 'priv-key';
  process.env.VAPID_SUBJECT = 'mailto:test@example.com';
});

// ============================================================
// Subject under test (imported lazily so module mocks apply)
// ============================================================

async function importSend() {
  return import('../send');
}

// ============================================================
// Tests
// ============================================================

describe('sendPushToUser — platform branching', () => {
  it('delivers web rows via web-push.sendNotification', async () => {
    seedSubscriptions([
      {
        id: 'sub-web-1',
        user_id: 'user-1',
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
        p256dh_key: 'p256',
        auth_key: 'auth',
        created_at: '2026-05-01',
        platform: 'web',
        native_token: null,
        device_id: null,
      },
    ]);
    mockSendNotification.mockResolvedValue(undefined);

    const { sendPushToUser } = await importSend();
    const result = await sendPushToUser(
      'user-1',
      { title: 'Test', body: 'Body' },
      'bir_deadline'
    );

    expect(mockSendNotification).toHaveBeenCalledOnce();
    expect(result.sent).toBe(1);
    expect(result.total).toBe(1);
  });

  it('skips native rows with a Sprint-19 TODO log and reports sent=0', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    seedSubscriptions([
      {
        id: 'sub-native-1',
        user_id: 'user-1',
        endpoint: 'fcm-token-xyz', // architect §3: token mirrored into endpoint
        p256dh_key: null,
        auth_key: null,
        created_at: '2026-05-01',
        platform: 'android',
        native_token: 'fcm-token-xyz',
        device_id: null,
      },
    ]);

    const { sendPushToUser } = await importSend();
    const result = await sendPushToUser(
      'user-1',
      { title: 'Test', body: 'Body' },
      'bir_deadline'
    );

    expect(mockSendNotification).not.toHaveBeenCalled();
    expect(result.sent).toBe(0);
    expect(result.total).toBe(1);
    expect(warnSpy).toHaveBeenCalled();
    const warnText = warnSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(warnText).toMatch(/Sprint 19 FCM wiring/i);
    warnSpy.mockRestore();
  });

  it('handles a mixed set of web + native rows (web delivered, native skipped)', async () => {
    seedSubscriptions([
      {
        id: 'sub-web-1',
        user_id: 'user-1',
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
        p256dh_key: 'p256',
        auth_key: 'auth',
        created_at: '2026-05-01',
        platform: 'web',
        native_token: null,
        device_id: null,
      },
      {
        id: 'sub-native-1',
        user_id: 'user-1',
        endpoint: 'fcm-token-xyz',
        p256dh_key: null,
        auth_key: null,
        created_at: '2026-05-01',
        platform: 'android',
        native_token: 'fcm-token-xyz',
        device_id: null,
      },
    ]);
    mockSendNotification.mockResolvedValue(undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { sendPushToUser } = await importSend();
    const result = await sendPushToUser(
      'user-1',
      { title: 'Test', body: 'Body' },
      'bir_deadline'
    );

    expect(mockSendNotification).toHaveBeenCalledOnce();
    expect(result.sent).toBe(1);
    expect(result.total).toBe(2);
    expect(mockInsert).toHaveBeenCalledOnce(); // notifications log row
  });

  it('soft-deletes a web row with malformed VAPID keys (treated as expired)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    seedSubscriptions([
      {
        id: 'sub-web-malformed',
        user_id: 'user-1',
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
        p256dh_key: null, // malformed — should be soft-deleted
        auth_key: null,
        created_at: '2026-05-01',
        platform: 'web',
        native_token: null,
        device_id: null,
      },
    ]);

    const { sendPushToUser } = await importSend();
    const result = await sendPushToUser(
      'user-1',
      { title: 'Test', body: 'Body' },
      'bir_deadline'
    );

    expect(mockSendNotification).not.toHaveBeenCalled();
    expect(result.sent).toBe(0);
    expect(mockUpdate).toHaveBeenCalledOnce();
    const [values, col, ids] = mockUpdate.mock.calls[0];
    expect((values as { deleted_at: string }).deleted_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T/
    );
    expect(col).toBe('id');
    expect(ids).toEqual(['sub-web-malformed']);
    errorSpy.mockRestore();
  });
});
