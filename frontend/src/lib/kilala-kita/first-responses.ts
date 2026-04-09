import type { PainPoint } from './schemas';

interface FirstResponse {
  message: string;
  featureNudge: string;
}

// 28 templates from kilala-kita-context.md §2
// Key format: {businessType}_{painPoint}
const TEMPLATES: Record<string, FirstResponse> = {
  // ── food_baking ──
  food_baking_receipt_tracking: {
    message:
      '[Name], sisimulan ko nang i-organize ang expenses mo. I-scan mo ang first receipt mo — papakita ko sa\'yo kung saan napupunta ang pera mo.',
    featureNudge: 'resibo_scanner',
  },
  food_baking_bir_compliance: {
    message:
      'Hindi kailangang matakot sa BIR, [Name]. I-set up ko na ang deadline reminders mo — 1701Q at 1701A lang naman usually sa food business.',
    featureNudge: 'deadline_watcher',
  },
  food_baking_customer_messages: {
    message:
      '[Name], alam kong nakakapagod mag-reply sa lahat ng orders. I-draft ko ang replies mo — i-paste mo na lang.',
    featureNudge: 'reply_drafter',
  },
  food_baking_knowing_earnings: {
    message:
      'Kumikita ka ba talaga, [Name]? Tara, alamin natin. I-log ang daily sales at expenses mo — ipapakita ko ang actual profit mo.',
    featureNudge: 'dashboard',
  },

  // ── online_selling ──
  online_selling_receipt_tracking: {
    message:
      '[Name], maraming gastos sa online selling na hindi na-track — platform fees, shipping, packaging. I-scan mo ang receipts mo, I\'ll organize everything.',
    featureNudge: 'resibo_scanner',
  },
  online_selling_bir_compliance: {
    message:
      'BIR deadlines, [Name] — I-track natin. Kailangan mo ng 1701Q quarterly. Kung VAT ka na, 2550Q pa. I-set up ko na?',
    featureNudge: 'deadline_watcher',
  },
  online_selling_customer_messages: {
    message:
      'DM overload, [Name]? I-paste mo ang customer message, I\'ll draft a reply. Copy-paste na lang.',
    featureNudge: 'reply_drafter',
  },
  online_selling_knowing_earnings: {
    message:
      'Tara, [Name] — i-track natin ang actual profit mo. Hindi lang sales ha — kasama na ang platform fees, shipping, at returns.',
    featureNudge: 'dashboard',
  },

  // ── freelance_creative ──
  freelance_creative_receipt_tracking: {
    message:
      '[Name], ang software subscriptions at internet mo — business expense yan. I-log natin para sa tax deductions mo.',
    featureNudge: 'resibo_scanner',
  },
  freelance_creative_bir_compliance: {
    message:
      'Freelancer ka, [Name]? 8% flat tax ang pinaka-simple — quarterly filing lang. I-set up ko ang reminders mo.',
    featureNudge: 'deadline_watcher',
  },
  freelance_creative_customer_messages: {
    message:
      '[Name], I\'ll help you draft client replies — professional pero hindi robotic. I-paste mo lang ang message nila.',
    featureNudge: 'reply_drafter',
  },
  freelance_creative_knowing_earnings: {
    message:
      'Feast or famine ang freelance life, [Name]. I-track natin ang income mo per client — para alam mo kung sino ang worth it.',
    featureNudge: 'dashboard',
  },

  // ── sari_sari_retail ──
  sari_sari_retail_receipt_tracking: {
    message:
      '[Name], alam kong mahirap mag-track ng gastos sa tindahan — palengke, distributors, lahat cash. Simulan natin nang dahan-dahan.',
    featureNudge: 'resibo_scanner',
  },
  sari_sari_retail_bir_compliance: {
    message:
      '[Name], okay lang kung hindi ka pa BIR-registered — marami namang ganyan. Pag ready ka, tutulungan kita sa process.',
    featureNudge: 'deadline_watcher',
  },
  sari_sari_retail_customer_messages: {
    message:
      '[Name], para sa tindahan mo — i-log natin ang daily sales at gastos. Simple lang, 60 seconds every gabi.',
    featureNudge: 'daily_checkin',
  },
  sari_sari_retail_knowing_earnings: {
    message:
      'Kumikita ka ba talaga, [Name]? Hirap malaman kung iisa ang GCash ng personal at negosyo. Tara, i-separate natin.',
    featureNudge: 'dashboard',
  },

  // ── other (Iba Pa) ──
  other_receipt_tracking: {
    message:
      '[Name], kahit anong business mo — ang receipts ang susi sa financial clarity. I-scan mo ang first receipt mo, tara!',
    featureNudge: 'resibo_scanner',
  },
  other_bir_compliance: {
    message:
      '[Name], I-help kita sa BIR deadlines. Sabihin mo lang ang business type mo nang mas detalyado — i-customize ko ang reminders.',
    featureNudge: 'deadline_watcher',
  },
  other_customer_messages: {
    message:
      '[Name], kapag may customer message ka na kailangan i-reply — i-paste mo dito. I\'ll draft it for you.',
    featureNudge: 'reply_drafter',
  },
  other_knowing_earnings: {
    message:
      '[Name], tara — i-track natin ang income at expenses mo. Kahit simple lang muna, makikita mo kung kumikita ka talaga.',
    featureNudge: 'dashboard',
  },

  // ── Phase 2: food_carinderia ──
  food_carinderia_receipt_tracking: {
    message:
      '[Name], sa karinderya alam ko — palengke tuwing umaga, lahat walang resibo. I-log natin kahit estimate lang muna.',
    featureNudge: 'resibo_scanner',
  },
  food_carinderia_bir_compliance: {
    message:
      '[Name], maraming karinderya ang hindi pa registered sa BIR — at okay lang, tutulong ako pag ready ka na. Una, i-track muna natin ang sales mo.',
    featureNudge: 'daily_checkin',
  },
  food_carinderia_customer_messages: {
    message:
      '[Name], para sa karinderya mo — mas importante muna ang i-track ang daily sales at gastos. 60 seconds lang every gabi.',
    featureNudge: 'daily_checkin',
  },
  food_carinderia_knowing_earnings: {
    message:
      '[Name], sa karinderya mahirap malaman kung kumikita ka — ang daming cash na pumapasok at lumalabas. I-log natin araw-araw.',
    featureNudge: 'dashboard',
  },

  // ── Phase 2: service_salon ──
  service_salon_receipt_tracking: {
    message:
      '[Name], sa salon maraming gastos — supplies, renta, commission. I-organize natin para makita mo kung saan napupunta ang pera.',
    featureNudge: 'resibo_scanner',
  },
  service_salon_bir_compliance: {
    message:
      '[Name], I-set up natin ang BIR deadlines mo. Sa salon business, 1701Q quarterly ang need mo usually.',
    featureNudge: 'deadline_watcher',
  },
  service_salon_customer_messages: {
    message:
      '[Name], kapag may nag-message for appointment or inquiry — i-paste mo dito, I\'ll draft a quick reply.',
    featureNudge: 'reply_drafter',
  },
  service_salon_knowing_earnings: {
    message:
      '[Name], alam mo ba kung anong service ang pinaka-profitable sa salon mo? Haircut vs. color vs. treatment — i-track natin.',
    featureNudge: 'dashboard',
  },
};

/**
 * Get the first Kai message after onboarding completes.
 * Static lookup — NOT a Claude API call.
 */
export function getFirstKAMessage(
  businessType: string,
  painPoint: PainPoint,
  firstName: string
): FirstResponse {
  const key = `${businessType}_${painPoint}`;
  const template = TEMPLATES[key] ?? TEMPLATES[`other_${painPoint}`];

  if (!template) {
    // Ultimate fallback — should never happen with valid PainPoint
    return {
      message: `${firstName}, tara — simulan natin! I'm here to help with your business.`,
      featureNudge: 'dashboard',
    };
  }

  return {
    message: template.message.replaceAll('[Name]', firstName),
    featureNudge: template.featureNudge,
  };
}
