'use client';

import { useRef, useState } from 'react';
import { BUSINESS_TYPES, INCOME_RANGES } from '@/lib/constants/business-options';
import { BIR_TAX_TYPES, BIR_TAX_TYPE_LABELS, BIR_TAX_TYPE_DESCRIPTIONS, type BirTaxType } from '@/lib/deadlines/types';
import { trackProfileUpdated } from '@/lib/posthog/events';

interface ProfileEditFormProps {
  displayName: string | null;
  businessName: string | null;
  businessType: string | null;
  incomeRange: string | null;
  birRegistered: boolean;
  birTaxType: string | null;
  onSave: (updated: {
    display_name: string | null;
    business_name: string | null;
    business_type: string | null;
    income_range: string | null;
    bir_registered: boolean;
    bir_tax_type: string | null;
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
  birTaxType,
  onSave,
  onCancel,
}: ProfileEditFormProps) {
  const businessNameRef = useRef<HTMLInputElement>(null);
  const displayNameRef = useRef<HTMLInputElement>(null);

  const [selectedType, setSelectedType] = useState(businessType ?? '');
  const [selectedRange, setSelectedRange] = useState(incomeRange ?? '');
  const [birToggle, setBirToggle] = useState(birRegistered);
  const [selectedTaxType, setSelectedTaxType] = useState(birTaxType ?? '');
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
    if (selectedTaxType && (selectedTaxType !== birTaxType || birToggle !== birRegistered)) {
      payload.bir_tax_type = selectedTaxType;
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

      // Generate deadlines when BIR is enabled with a tax type selected
      // Triggers on: first-time setup, tax type change, or re-enabling BIR toggle
      if (birToggle && selectedTaxType) {
        try {
          await fetch('/api/deadlines', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tax_type: selectedTaxType }),
          });
        } catch {
          // Non-blocking — deadlines can be generated later
        }
      }

      onSave({
        display_name: json.data.display_name,
        business_name: json.data.business_name,
        business_type: json.data.business_type,
        income_range: json.data.income_range,
        bir_registered: json.data.bir_registered,
        bir_tax_type: json.data.bir_tax_type ?? (selectedTaxType || null),
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
          Pangalan ng negosyo
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
        <p className="text-xs text-on-surface-variant mb-2">Monthly income mo</p>
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

      {/* BIR Section — highlighted card for discoverability */}
      <div className="rounded-xl border border-primary-container/40 bg-primary-container/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <p className="text-sm font-semibold text-on-surface">BIR Registered ka ba?</p>
          </div>
          <button
            type="button"
            onClick={() => setBirToggle(!birToggle)}
            className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
              birToggle ? 'bg-primary-container' : 'bg-surface-container-high border border-outline-variant/30'
            }`}
            role="switch"
            aria-checked={birToggle}
            data-testid="bir-toggle"
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-surface-container-lowest shadow transition-transform ${
                birToggle ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        {!birToggle && (
          <p className="text-xs text-on-surface-variant">
            I-on ito para ma-track ni Kai ang BIR deadlines mo.
          </p>
        )}

        {/* BIR Tax Type selector — shown after toggle is enabled */}
        {birToggle && (
          <div data-testid="bir-tax-type-section">
            <p className="text-xs text-on-surface-variant mb-2">Anong tax type mo sa BIR?</p>
            <div className="grid gap-2">
              {BIR_TAX_TYPES.map((taxType) => (
                <button
                  key={taxType}
                  type="button"
                  onClick={() => setSelectedTaxType(taxType)}
                  className={`flex w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
                    selectedTaxType === taxType
                      ? 'border-primary-container bg-primary-container/10 ring-1 ring-primary-container'
                      : 'border-outline-variant/30 bg-surface-container-high hover:border-outline-variant/50'
                  }`}
                  data-testid={`tax-type-${taxType}`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-on-surface font-medium text-sm">
                      {BIR_TAX_TYPE_LABELS[taxType as BirTaxType]}
                    </span>
                    <span className="text-on-surface-variant text-xs">
                      {BIR_TAX_TYPE_DESCRIPTIONS[taxType as BirTaxType]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
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
          I-cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 min-h-[44px] bg-primary-container text-on-primary font-semibold rounded-xl transition-colors hover:bg-primary disabled:opacity-40"
          data-testid="save-btn"
        >
          {saving ? 'Sine-save...' : 'I-save'}
        </button>
      </div>
    </div>
  );
}
