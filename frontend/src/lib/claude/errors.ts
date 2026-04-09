// AKBai Build 0 — conversational Filipino error messages with trust recovery pattern

export const KA_ERROR_MESSAGES = {
  global_cap:
    'Marami nang na-process natin today — bukas ulit tayo, okay? Puwede mo pa ring i-check ang records mo.',
  user_cap:
    'Naka-max ka na for today — bukas ulit! I-check mo muna ang dashboard mo habang naghihintay.',
  free_tier_limit:
    'Naka-10 queries ka na for today — bukas ulit tayo! Kung gusto mo ng unlimited, i-check mo ang Pro plan natin.',
  api_error:
    'Pasensya na po, may konting problema. Subukan mo ulit in a few seconds.',
  api_key_missing:
    'Sandali lang po — may configuration issue. Inaayos na namin.',
  trust_recovery:
    'Ay, mukhang may mali sa sagot ko. Pasensya na — puwede mo i-flag para ma-review namin. Anong specific na mali?',
  circuit_breaker_unavailable:
    'Pasensya na, may maintenance kami ngayon. Subukan mo ulit in a few minutes.',
} as const;

export type KAErrorCode = keyof typeof KA_ERROR_MESSAGES;
