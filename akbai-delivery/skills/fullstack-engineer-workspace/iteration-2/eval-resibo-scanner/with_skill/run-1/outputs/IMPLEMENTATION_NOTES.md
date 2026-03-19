# Resibo Scanner — Implementation Notes

## Key Design Decisions & Rationale

### 1. Server Component for Page
**Decision:** `page.tsx` is a server component (no `'use client'`)

**Why:**
- Keeps client bundle small (critical for Philippine LTE users)
- Auth check happens at server boundary (can't be bypassed)
- Supabase data fetching is simpler on server (no auth state management in React)
- Errors thrown from server are caught by error.tsx boundary

**Trade-off:**
- Can't use React hooks in page component
- Must split interactive features (camera, button state) into client components

---

### 2. Client Component for ScanButton
**Decision:** ScanButton is a client component with full state machine

**Why:**
- Camera API requires browser context (`navigator.mediaDevices`)
- Button state (idle → capturing → uploading → processing) is UI state
- Video/canvas refs must be client-side
- Real-time feedback needed for user experience

**State Machine:**
```
idle → capturing → uploading → processing → idle (success)
                                          ↓
                                        error
```

Prevents race conditions and ensures clear UX at each step.

---

### 3. Receipt as Display-Only Component
**Decision:** ReceiptCard accepts fully-loaded Receipt object from server

**Why:**
- Data is already fetched and validated by server
- Component is "dumb" — just formatting and display
- Easier to test (pass in mock receipt data)
- No loading states needed in the card itself

**Future expansion (Phase 2):**
- Add `onClick` handler to expand details
- Add swipe-to-delete gesture
- Add "Flag as Wrong" button

---

### 4. Money Always Stored as Centavos
**Decision:** `total_amount: number` is stored in centavos (₱34.50 = 3450)

**Why:**
- Avoids floating-point precision errors in financial math
- International standard for financial systems
- Matches Supabase/database integer storage
- NPC/BIR compliance requirement

**Display:**
```typescript
function centavosToPeso(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH', {...})}`;
}
```

Always convert at UI layer only. Never do math on peso values.

---

### 5. Confidence Badge Thresholds
**Decision:** 80+, 50-79, <50 with Teal/Yellow/Orange colors

**Why:**
- 80+ is "good enough for import without review"
- 50-79 is "human review recommended"
- <50 is "flag for manual entry"
- Matches brand psychology: Teal = trust/safe, Yellow = caution, Orange = alert

**Alternative considered:** 90+/70-89/50-69/<50
**Why we didn't:** Too many thresholds, harder to explain to users

---

### 6. JPEG Compression at 70% Quality
**Decision:** Canvas `toBlob(..., 'image/jpeg', 0.7)`

**Why:**
- Balances OCR accuracy with upload speed
- 70% quality is visually acceptable for receipt text
- Reduces upload time on LTE (usually 2-3x smaller)
- Can be tuned based on OCR feedback loop

**Tuning path:**
- Baseline: 70% (current)
- If confidence scores < 60 on average: increase to 75%
- If uploads taking > 5s: decrease to 65%

---

### 7. Camera Captures After 1.5 Second Delay
**Decision:** `setTimeout(..., 1500)` before calling `captureFrame()`

**Why:**
- Gives user visual confirmation that camera is working
- Enough time to stabilize hand and frame receipt
- Prevents accidental captures from camera opening
- Feels more intentional than instant capture

**Alternative:** Instant capture (faster but feels rushed)

---

### 8. Storage Path Structure
**Decision:** `{userId}/{year}/{month}/{uuid}.jpg`

**Example:** `550e8400-e29b-41d4-a716-446655440000/2026/03/f47ac10b-58cc-4372-a567-0e02b2c3d479.jpg`

**Why:**
- Scopes storage access by user (RLS policy checks first folder)
- Organizes by date for easy query/audit
- UUID prevents collisions
- Matches Supabase Storage best practices

---

### 9. Error Messages in Taglish
**Examples:**
- "Hindi ma-access ang camera. Check ang permissions."
- "May problema sa pag-upload. Subukan ulit."
- "May problema sa pag-scan. Subukan ulit."

**Why:**
- Target users speak Taglish naturally
- Feels like KA (the AI persona) is speaking
- Non-technical language (no error codes shown)
- Action-oriented ("Subukan ulit" = actionable)

**Console logs remain English** (for developer debugging)

---

### 10. Empty State Message
**Message:** "Wala pang nai-scan na resibo. Simulan natin ngayon!"

**Why:**
- "Wala pang" = "haven't yet" (gentle, no pressure)
- "natin" = "we/us" (partnership tone)
- Second line is instructional: "Tap ang button sa itaas"

---

## Integration Checklist

### Supabase Schema
```sql
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  storage_path TEXT NOT NULL,                    -- path in Storage
  vendor_name TEXT NOT NULL,                     -- e.g., "SM Supermarket"
  transaction_date DATE NOT NULL,                -- date of receipt
  total_amount BIGINT NOT NULL,                  -- centavos (3450 = ₱34.50)
  confidence_score INT CHECK (confidence_score >= 0 AND confidence_score <= 100),
  ocr_raw JSONB,                                 -- raw Claude output
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Indexes
  UNIQUE (storage_path),
  INDEX (user_id, created_at DESC) WHERE deleted_at IS NULL,
  
  -- RLS
  ENABLE ROW LEVEL SECURITY
);
```

### RLS Policies
```sql
-- Users read own receipts
CREATE POLICY "Users read own receipts"
  ON receipts FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Users insert own receipts
CREATE POLICY "Users insert own receipts"
  ON receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users update own receipts (e.g., edit vendor name)
CREATE POLICY "Users update own receipts"
  ON receipts FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);
```

### Storage Setup
```
Bucket: receipts
Privacy: Private (requires RLS check)

RLS Policy:
CREATE POLICY "Users access own receipts"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1]::uuid = auth.uid()
  );
```

### API Route (POST /api/resibo/scan)
Expected request:
```json
{
  "storagePath": "550e8400-e29b-41d4-a716-446655440000/2026/03/abc-def.jpg"
}
```

Expected response (success):
```json
{
  "success": true,
  "data": {
    "id": "uuid...",
    "vendor_name": "SM Supermarket",
    "transaction_date": "2026-03-15",
    "total_amount": 345000,
    "confidence_score": 87,
    ...
  }
}
```

Expected response (error):
```json
{
  "success": false,
  "error": {
    "code": "AI_PARSE_ERROR",
    "message": "Claude output didn't match expected schema",
    "message_tl": "May problema sa pag-extract ng data. Subukan ulit."
  }
}
```

---

## Testing Scenarios

### Happy Path
1. User navigates to /resibo → page loads with existing receipts
2. User taps "I-scan ang Resibo"
3. Camera opens, user frames receipt
4. After 1.5s, frame captured, uploaded to Storage
5. API call returns OCR results
6. New receipt card appears in list
7. Confidence badge shows color-coded accuracy

### Camera Permission Denied
1. User taps scan button
2. Browser permission denied
3. Error message: "Hindi ma-access ang camera. Check ang permissions."
4. Button resets to idle
5. User can tap again and approve permission

### Network Upload Failure
1. User captures and tries to upload
2. Network error during Storage upload
3. Error message: "May problema sa pag-upload. Subukan ulit."
4. No receipt created
5. User can tap button again to retry

### API Parse Error
1. Storage upload succeeds
2. Claude returns output that doesn't match schema
3. API returns 422 error with message_tl
4. ScanButton displays error message
5. User can retry

### Empty State
1. New user navigates to /resibo
2. No receipts in database
3. Page shows empty state with scan button
4. Message: "Wala pang nai-scan na resibo. Simulan natin ngayon!"

---

## Performance Notes

### Client-Side
- Video stream: 1280x960 (configurable)
- JPEG compression: 70% quality (~80-150KB typical receipt photo)
- Canvas drawing: synchronous, fast (<50ms)
- State updates: minimal, only state machine changes

### Network
- Upload: 80-150KB JPEG → Supabase Storage
- API call: ~2-3s for Claude Haiku Vision (including network RTT)
- Expected total time: 3-5s on good LTE, up to 10s on poor signal

### Optimization Opportunities
1. Parallel: while uploading, start preloading receipt details
2. Progressive upload: show user % progress
3. Fallback: queue scan if offline, retry on reconnect
4. Caching: cache receipt cards with SWR or stale-while-revalidate

---

## Brand Voice Calibration

### Button States
- `idle`: "I-scan ang Resibo" (action-oriented)
- `capturing`: "Kumukuha ng screenshot..." (process ongoing)
- `uploading`: "Nag-uupload..." (process ongoing)
- `processing`: "Nag-a-analyze..." (AI reasoning)
- `error`: "May Problema" (sympathetic, not alarming)

### Error Messages
All follow pattern: **[Problem statement in Taglish]**
- No error codes
- No "Error:" prefix
- Action-oriented when possible ("Subukan ulit")
- Blame-free (no "You failed..." messages)

### Empty State
- Positive: "Simulan natin ngayon!" (partnership, encouragement)
- Instructional: "Tap ang button sa itaas" (clear next step)
- Warmth: "Wala pang" not "Walang" (softer phrasing)

---

## Known Limitations & Phase 2 Enhancements

### Phase 1 (Current)
- Display-only receipt cards
- Manual soft-delete (no UI button yet)
- No drag-to-delete
- No receipt detail modal
- No "Flag as Wrong" feature

### Phase 2 Roadmap
- Tap to expand receipt details
- Swipe left to delete
- "Flag as Wrong" button → sends to review queue
- Edit vendor name / date / total
- Manual receipt entry fallback
- Receipt-to-transaction linking
- Receipt attachment to invoices

### Phase 3+
- Handwriting OCR (not just printed receipts)
- Multi-page receipt support
- Receipt deduplication detection
- Barcode scanning
- Voice input for vendor name
- WhatsApp receipt forwarding

---

## Maintenance & Monitoring

### Metrics to Track
- Avg confidence score (target: 80+)
- % scans requiring manual review
- Camera permission denial rate
- API error rate (should be <1%)
- Upload failure rate
- Time from capture to completion

### Alert Thresholds
- Avg confidence < 70% → may need JPEG quality tuning
- API errors > 5% → check Claude API availability
- Upload failures > 3% → check Storage connectivity
- Camera denials > 20% → consider permissions UX redesign

---

## Code Review Checklist for QA

- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No console warnings or logs in production build
- [ ] All imports resolve (`npm run build`)
- [ ] Loading states display correctly on slow network
- [ ] Error states display correctly
- [ ] Retry logic works end-to-end
- [ ] Taglish text is spelled correctly and grammatically sound
- [ ] Money displays with ₱ sign and proper formatting
- [ ] Confidence badges show correct colors
- [ ] Camera permissions flow works on mobile browsers
- [ ] No layout shift from loading skeleton to content
- [ ] Touch targets are minimum 44px
- [ ] No infinite loops or memory leaks
