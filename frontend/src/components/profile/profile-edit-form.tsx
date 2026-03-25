'use client';

import { useRef, useState } from 'react';
import { BUSINESS_TYPES, INCOME_RANGES } from '@/lib/constants/business-options';
import { trackProfileUpdated } from '@/lib/posthog/events';

interface ProfileEditFormProps {
  displayName: string | null;
  businessName: string | null;
  businessType: string | null;
  incomeRange: string | null;
  birRegistered: boolean;
  onSave: (updated: {
    display_name: string | null;
    business_name: string | null;
    business_type: string | null;
    income_range: string | null;
    bir_registered: boolean;
    profile_version: number;
  }) => void;
  onCancel: () => void;
}

export default function ProfileEditForm({
  displayName,
  businessName,
  businessType,
  incomeRange,
  birRegistered,
  onSave,
  onCancel,
}: ProfileEditFormProps) {
  const businessNameRef = useRef<HTMLInputElement>(null);
  const displayNameRef = useRef<HTMLInputElement>(null);

  const [selectedType, setSelectedType] = useState(businessType ?? '');
  const [selectedRange, setSelectedRange] = useState(incomeRange ?? '');
  const [birToggle, setBirToggle] = useState(birRegistered);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const newDisplayName = displayNameRef.current?.value.trim() || null;
    const newBusinessName = businessNameRef.current?.value.trim() || null;

    const payload: Record<string, string | boolean> = {};

    if (newDisplayName !== displayName) {
      if (!newDisplayName) {
        setError('Kailangan ng pangalan.');
        setSaving(false);
        return;
      }
      payload.display_name = newDisplayName;
    }
    if (newBusinessName !== businessName) {
      payload.business_name = newBusinessName ?? '';
    }
    if (selectedType && selectedType !== businessType) {
      payload.business_type = selectedType;
    }
    if (selectedRange && selectedRange !== incomeRange) {
      payload.income_range = selectedRange;
    }
    if (birToggle !== birRegistered) {
      payload.bir_registered = birToggle;
    }

    // Nothing changed
    if (Object.keys(payload).length === 0) {
      onCancel();
      return;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message_tl ?? 'May error. Subukan muli.');
        setSaving(false);
        return;
      }

      trackProfileUpdated();

      onSave({
        display_name: json.data.display_name,
        business_name: json.data.business_name,
        business_type: json.data.business_type,
        income_range: json.data.income_range,
        bir_registered: json.data.bir_registered,
        profile_version: json.data.profile_version,
      });
    } catch {
      setError('Network error. Check ang connection mo.');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="profile-edit-form">
      {error && (
        <div
          className="bg-error-container/20 text-on-error-container text-xs p-2 rounded-lg"
          data-testid="edit-error"
        >
          {error}
        </div>
      )}

      {/* Display name */}
      <div>
        <label htmlFor="edit-display-name" className="text-xs text-on-surface-variant block mb-1">
          Pangalan
        </label>
        <input
          ref={displayNameRef}
          id="edit-display-name"
          type="text"
          defaultValue={displayName ?? ''}
          className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors"
          data-testid="edit-display-name"
        />
      </div>

      {/* Business name */}
      <div>
        <label htmlFor="edit-business-name" className="text-xs text-on-surface-variant block mb-1">
          Business name
        </label>
        <input
          ref={businessNameRef}
          id="edit-business-name"
          type="text"
          defaultValue={businessName ?? ''}
          className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors"
          data-testid="edit-business-name"
        />
      </div>

      {/* Business type selector */}
      <div>
        <p className="text-xs text-on-surface-variant mb-2">Type ng negosyo</p>
        <div className="grid gap-2">
          {BUSINESS_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setSelectedType(type.value)}
              className={`flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-xl border transition-all text-sm ${
                selectedType === type.value
                  ? 'border-primary-container bg-primary-container/10 ring-1 ring-primary-container'
                  : 'border-outline-variant/30 bg-surface-container-high hover:border-outline-variant/50'
              }`}
              data-testid={`type-${type.value}`}
            >
              <span>{type.icon}</span>
              <span className="text-on-surface font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Income range selector */}
      <div>
        <p className="text-xs text-on-surface-variant mb-2">Monthly income range</p>
        <div className="grid grid-cols-2 gap-2">
          {INCOME_RANGES.map((range) => (
            <button
              key={range.value}
              type="button"
              onClick={() => setSelectedRange(range.value)}
              className={`flex flex-col items-center gap-0.5 p-3 rounded-xl border text-center transition-all ${
                selectedRange === range.value
                  ? 'border-primary-container bg-primary-container/10 ring-1 ring-primary-container'
                  : 'border-outline-variant/30 bg-surface-container-high hover:border-outline-variant/50'
              }`}
              data-testid={`range-${range.value}`}
            >
              <span className="text-on-surface font-medium text-xs">{range.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* BIR registered toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-on-surface">BIR Registered</p>
        <button
          type="button"
          onClick={() => setBirToggle(!birToggle)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            birToggle ? 'bg-primary-container' : 'bg-surface-container-high border border-outline-variant/30'
          }`}
          role="switch"
          aria-checked={birToggle}
          data-testid="bir-toggle"
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-surface-container-lowest shadow transition-transform ${
              birToggle ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 min-h-[44px] border border-outline-variant/30 text-on-surface font-semibold rounded-xl transition-colors hover:bg-surface-container-high disabled:opacity-50"
          data-testid="cancel-btn"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 min-h-[44px] bg-primary-container text-on-primary-container font-semibold rounded-xl transition-colors hover:bg-primary disabled:opacity-40"
          data-testid="save-btn"
        >
          {saving ? 'Sine-save...' : 'I-save'}
        </button>
      </div>
    </div>
  );
}
