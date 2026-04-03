'use client';

interface KaiGreetingProps {
  greeting: string;
  userName: string;
  businessName: string | null;
  businessType: string | null;
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  food_baking: 'Food / Baking',
  online_selling: 'Online Selling',
  freelance_creative: 'Freelance / Creative',
  sari_sari_retail: 'Sari-sari / Retail',
  food_carinderia: 'Karinderya',
  service_salon: 'Salon / Service',
  other: 'Negosyo',
};

export default function KaiGreeting({
  greeting,
  userName,
  businessName,
  businessType,
}: KaiGreetingProps) {
  const typeLabel = businessType
    ? BUSINESS_TYPE_LABELS[businessType] ?? 'Negosyo'
    : null;

  return (
    <section
      className="px-4 pt-6 pb-4"
      data-testid="kai-greeting"
      aria-label="Kai greeting"
    >
      {/* Kai bubble */}
      <div className="bg-surface-container rounded-2xl rounded-tl-sm p-4 mb-3">
        <p className="text-on-surface text-base leading-relaxed" data-testid="kai-greeting-text">
          {greeting}
        </p>
      </div>

      {/* Business info */}
      <div className="flex items-center gap-2 px-1">
        <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center flex-shrink-0">
          <span className="text-primary-container text-sm font-bold">
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-on-surface text-sm font-semibold truncate">
            {businessName ?? userName}
          </p>
          {typeLabel && (
            <p className="text-on-surface-variant text-xs truncate">{typeLabel}</p>
          )}
        </div>
      </div>
    </section>
  );
}
