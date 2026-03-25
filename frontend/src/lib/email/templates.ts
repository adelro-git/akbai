/**
 * AKBai custom email templates for Supabase Auth.
 *
 * These are used in two ways:
 * 1. Copy the HTML into Supabase Dashboard > Authentication > Email Templates
 * 2. (Future) Serve from a custom SMTP send route if needed
 *
 * Brand spec: Light-first "Sun-Drenched Atelier" — Surface (#fdf9f2),
 * Honey accent (#F59E0B), Plus Jakarta Sans with Arial/Helvetica fallback.
 */

const BRAND = {
  surface: '#fdf9f2',
  card: '#f1ede7',
  cardAlt: '#f7f3ec',
  honey: '#F59E0B',
  honeyDeep: '#855300',
  teal: '#006b54',
  text: '#1c1c18',
  textSecondary: '#534434',
  textMuted: '#867461',
  fontStack: "'Plus Jakarta Sans', Arial, Helvetica, sans-serif",
} as const;

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>AKBai</title>
  <!--[if mso]>
  <style>
    table { border-collapse: collapse; }
    td { font-family: Arial, Helvetica, sans-serif; }
  </style>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background-color:${BRAND.surface}; font-family:${BRAND.fontStack}; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.surface};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-family:${BRAND.fontStack}; font-size:28px; font-weight:800; color:${BRAND.text}; letter-spacing:-0.5px;">
                AKB<span style="color:${BRAND.honey};">ai</span>
              </span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:${BRAND.card}; border-radius:16px; padding:32px 24px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="font-family:${BRAND.fontStack}; font-size:12px; color:${BRAND.textMuted}; margin:0; line-height:1.5;">
                Katuwang ng Negosyo Mo
              </p>
              <p style="font-family:${BRAND.fontStack}; font-size:11px; color:${BRAND.textMuted}; margin:8px 0 0 0; line-height:1.5;">
                Hindi mo ito na-request? Puwede mo i-ignore ang email na ito.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Magic link / OTP email template.
 * Used when a user signs in via email OTP or magic link.
 */
export function magicLinkTemplate(
  otpLink: string,
  userName?: string
): string {
  const greeting = userName
    ? `Hi ${userName}!`
    : 'Hi!';

  const content = `
              <h1 style="font-family:${BRAND.fontStack}; font-size:22px; font-weight:700; color:${BRAND.text}; margin:0 0 8px 0;">
                ${greeting}
              </h1>
              <p style="font-family:${BRAND.fontStack}; font-size:15px; color:${BRAND.textSecondary}; margin:0 0 24px 0; line-height:1.6;">
                Mag-sign in ka sa AKBai. Click the link below para mag-login:
              </p>
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 24px 0;">
                    <a href="${otpLink}" target="_blank" style="display:inline-block; background-color:${BRAND.honey}; color:#ffffff; font-family:${BRAND.fontStack}; font-size:16px; font-weight:600; text-decoration:none; padding:14px 32px; border-radius:12px; mso-padding-alt:0;">
                      <!--[if mso]><i style="letter-spacing:32px;mso-font-width:-100%;mso-text-raise:21pt">&nbsp;</i><![endif]-->
                      <span style="mso-text-raise:10pt;">Mag-login sa AKBai</span>
                      <!--[if mso]><i style="letter-spacing:32px;mso-font-width:-100%">&nbsp;</i><![endif]-->
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-family:${BRAND.fontStack}; font-size:13px; color:${BRAND.textSecondary}; margin:0 0 8px 0; line-height:1.5;">
                O kaya, i-copy-paste ang link na ito sa browser mo:
              </p>
              <p style="font-family:monospace; font-size:12px; color:${BRAND.honeyDeep}; margin:0 0 24px 0; word-break:break-all; line-height:1.5; background-color:${BRAND.cardAlt}; padding:12px; border-radius:8px;">
                ${otpLink}
              </p>
              <p style="font-family:${BRAND.fontStack}; font-size:12px; color:${BRAND.textMuted}; margin:0; line-height:1.5;">
                Ang link na ito ay valid for 1 hour lang. Kung hindi ikaw ang nag-request nito, puwede mo i-ignore.
              </p>`;

  return baseLayout(content);
}

/**
 * Email confirmation / signup verification template.
 * Used when a new user signs up and needs to confirm their email.
 */
export function confirmationTemplate(
  confirmationLink: string
): string {
  const content = `
              <h1 style="font-family:${BRAND.fontStack}; font-size:22px; font-weight:700; color:${BRAND.text}; margin:0 0 8px 0;">
                Welcome sa AKBai!
              </h1>
              <p style="font-family:${BRAND.fontStack}; font-size:15px; color:${BRAND.textSecondary}; margin:0 0 24px 0; line-height:1.6;">
                Isang step na lang! I-confirm ang email mo para makapagsimula na tayo:
              </p>
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 24px 0;">
                    <a href="${confirmationLink}" target="_blank" style="display:inline-block; background-color:${BRAND.honey}; color:#ffffff; font-family:${BRAND.fontStack}; font-size:16px; font-weight:600; text-decoration:none; padding:14px 32px; border-radius:12px; mso-padding-alt:0;">
                      <!--[if mso]><i style="letter-spacing:32px;mso-font-width:-100%;mso-text-raise:21pt">&nbsp;</i><![endif]-->
                      <span style="mso-text-raise:10pt;">I-confirm ang Email</span>
                      <!--[if mso]><i style="letter-spacing:32px;mso-font-width:-100%">&nbsp;</i><![endif]-->
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-family:${BRAND.fontStack}; font-size:13px; color:${BRAND.textSecondary}; margin:0 0 8px 0; line-height:1.5;">
                O kaya, i-copy-paste ang link na ito sa browser mo:
              </p>
              <p style="font-family:monospace; font-size:12px; color:${BRAND.honeyDeep}; margin:0 0 24px 0; word-break:break-all; line-height:1.5; background-color:${BRAND.cardAlt}; padding:12px; border-radius:8px;">
                ${confirmationLink}
              </p>
              <p style="font-family:${BRAND.fontStack}; font-size:15px; color:${BRAND.textSecondary}; margin:0 0 4px 0; line-height:1.6;">
                Ready na ang AKBai para maging katuwang mo sa negosyo. Tara na!
              </p>
              <p style="font-family:${BRAND.fontStack}; font-size:12px; color:${BRAND.textMuted}; margin:16px 0 0 0; line-height:1.5;">
                Kung hindi ikaw nag-sign up, puwede mo i-ignore ang email na ito.
              </p>`;

  return baseLayout(content);
}
