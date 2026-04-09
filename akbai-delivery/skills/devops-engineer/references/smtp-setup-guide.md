# AKBai — Custom SMTP + OTP Deliverability Setup Guide

> **Purpose:** Fix Gap D1 — Yahoo Mail PH OTP delivery issues by switching from Supabase default SendGrid to Resend custom SMTP with proper DNS authentication.
> **Last updated:** 2026-03-24
> **Time estimate:** ~30 minutes (once you have domain access)

---

## Table of Contents

1. [Why Custom SMTP](#1-why-custom-smtp)
2. [Resend Account Setup](#2-resend-account-setup)
3. [Domain DNS Configuration](#3-domain-dns-configuration)
4. [Supabase SMTP Configuration](#4-supabase-smtp-configuration)
5. [Custom Email Templates](#5-custom-email-templates)
6. [Environment Variables](#6-environment-variables)
7. [Testing Checklist](#7-testing-checklist)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Why Custom SMTP

Supabase's default email provider (shared SendGrid) has known deliverability issues with Yahoo Mail PH domains (`yahoo.com.ph`, `yahoo.com`, `ymail.com`). Yahoo Mail is widely used among our target MSME users in the Philippines.

**The fix:** Use Resend as a custom SMTP provider with proper SPF, DKIM, and DMARC DNS records. This authenticates our emails and prevents them from landing in spam.

**Why Resend:**
- Free tier: 3,000 emails/month, 100/day (plenty for our auth volume)
- Simple setup, modern dashboard
- Excellent deliverability reputation
- Easy DNS verification flow
- SMTP access included in free tier

---

## 2. Resend Account Setup

### Step 1: Create Account
1. Go to [resend.com](https://resend.com)
2. Sign up with your email (use your personal or AKBai admin email)
3. Verify your email address

### Step 2: Add Your Domain
1. In the Resend dashboard, go to **Domains** (left sidebar)
2. Click **Add Domain**
3. Enter your domain: `akbai.ph` (or whatever domain you're using)
4. Resend will show you DNS records to add — keep this page open for Step 3

### Step 3: Get API Key
1. Go to **API Keys** (left sidebar)
2. Click **Create API Key**
3. Name: `supabase-smtp`
4. Permission: **Sending access**
5. Domain: select your domain (or "All domains" if only one)
6. Copy the key — it starts with `re_` — save it somewhere secure
7. **You will NOT be able to see this key again after closing the dialog**

---

## 3. Domain DNS Configuration

Go to your domain registrar's DNS management panel (e.g., Namecheap, Cloudflare, GoDaddy) and add these records. Resend will show you the exact values in their dashboard.

### SPF Record

| Type | Host/Name | Value | TTL |
|------|-----------|-------|-----|
| TXT | `@` | `v=spf1 include:send.resend.com ~all` | 3600 |

> **Note:** If you already have an SPF record, add `include:send.resend.com` before the `~all` part. Example: `v=spf1 include:_spf.google.com include:send.resend.com ~all`

### DKIM Records

Resend will provide 3 CNAME records for DKIM. They look like:

| Type | Host/Name | Value | TTL |
|------|-----------|-------|-----|
| CNAME | `resend._domainkey` | `resend._domainkey.yourdomain.com.at.resend.com` | 3600 |
| CNAME | `s1._domainkey` | *(Resend provides this value)* | 3600 |
| CNAME | `s2._domainkey` | *(Resend provides this value)* | 3600 |

> **Copy the exact values from Resend's dashboard** — they are specific to your domain.

### DMARC Record

| Type | Host/Name | Value | TTL |
|------|-----------|-------|-----|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@akbai.ph` | 3600 |

> Start with `p=none` (monitor mode). Once deliverability is confirmed, you can upgrade to `p=quarantine` or `p=reject`.

### Verify DNS

1. After adding all DNS records, go back to Resend dashboard
2. Click **Verify** on your domain
3. DNS propagation can take 5 minutes to 48 hours (usually ~10 minutes)
4. Resend will show a green checkmark when verified

### Verify with External Tools (optional)

- [MXToolbox SPF Checker](https://mxtoolbox.com/spf.aspx) — enter `akbai.ph`
- [MXToolbox DKIM Checker](https://mxtoolbox.com/dkim.aspx) — enter `resend._domainkey.akbai.ph`
- [MXToolbox DMARC Checker](https://mxtoolbox.com/dmarc.aspx) — enter `akbai.ph`

---

## 4. Supabase SMTP Configuration

### Step 1: Open SMTP Settings
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your AKBai project
3. Navigate to: **Project Settings** (gear icon) → **Authentication** → scroll down to **SMTP Settings**
4. Toggle **Enable Custom SMTP** to ON

### Step 2: Enter Resend SMTP Credentials

| Field | Value |
|-------|-------|
| **Sender email** | `noreply@akbai.ph` |
| **Sender name** | `AKBai` |
| **Host** | `smtp.resend.com` |
| **Port number** | `465` |
| **Minimum interval** | `60` (seconds between emails to same address) |
| **Username** | `resend` |
| **Password** | Your Resend API key (starts with `re_`) |

> **Port options:** Use `465` for SSL (recommended) or `587` for STARTTLS. Both work with Resend.

### Step 3: Save and Test
1. Click **Save**
2. Supabase will attempt to verify the SMTP connection
3. If it shows an error, double-check your API key and port

---

## 5. Custom Email Templates

The codebase includes branded conversational Filipino email templates in `frontend/src/lib/email/templates.ts`. To use them in Supabase:

### Step 1: Open Email Templates
1. In Supabase Dashboard, go to: **Authentication** → **Email Templates**

### Step 2: Update Magic Link Template
1. Click on **Magic Link**
2. **Subject:** `Mag-login sa AKBai`
3. **Body:** Copy the HTML output from `magicLinkTemplate()`
   - The template uses `{{ .ConfirmationURL }}` as the Supabase variable for the magic link
   - Replace the placeholder link in the template with: `{{ .ConfirmationURL }}`

Here is a minimal Supabase-compatible version you can paste directly:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
</head>
<body style="margin:0; padding:0; background-color:#07101e; font-family:'Plus Jakarta Sans', Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07101e;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:28px; font-weight:800; color:#FFFFFF; letter-spacing:-0.5px;">
                AKB<span style="color:#F59E0B;">ai</span>
              </span>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0d1a2e; border-radius:16px; padding:32px 24px;">
              <h1 style="font-size:22px; font-weight:700; color:#FFFFFF; margin:0 0 8px 0;">Hi!</h1>
              <p style="font-size:15px; color:#cbd5e1; margin:0 0 24px 0; line-height:1.6;">
                Mag-sign in ka sa AKBai. Click the link below para mag-login:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 24px 0;">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block; background-color:#F59E0B; color:#07101e; font-size:16px; font-weight:600; text-decoration:none; padding:14px 32px; border-radius:12px;">
                      Mag-login sa AKBai
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:12px; color:#64748b; margin:0; line-height:1.5;">
                Ang link na ito ay valid for 1 hour lang. Kung hindi ikaw ang nag-request nito, puwede mo i-ignore.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="font-size:12px; color:#64748b; margin:0;">Katuwang ng Negosyo Mo</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Step 3: Update Confirmation Template
1. Click on **Confirm signup**
2. **Subject:** `Welcome sa AKBai — i-confirm ang email mo`
3. **Body:** Same approach — use the template from `confirmationTemplate()` with `{{ .ConfirmationURL }}`

Replace the CTA link with `{{ .ConfirmationURL }}` and the heading with "Welcome sa AKBai!".

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
</head>
<body style="margin:0; padding:0; background-color:#07101e; font-family:'Plus Jakarta Sans', Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07101e;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:28px; font-weight:800; color:#FFFFFF; letter-spacing:-0.5px;">
                AKB<span style="color:#F59E0B;">ai</span>
              </span>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0d1a2e; border-radius:16px; padding:32px 24px;">
              <h1 style="font-size:22px; font-weight:700; color:#FFFFFF; margin:0 0 8px 0;">Welcome sa AKBai!</h1>
              <p style="font-size:15px; color:#cbd5e1; margin:0 0 24px 0; line-height:1.6;">
                Isang step na lang! I-confirm ang email mo para makapagsimula na tayo:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 24px 0;">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block; background-color:#F59E0B; color:#07101e; font-size:16px; font-weight:600; text-decoration:none; padding:14px 32px; border-radius:12px;">
                      I-confirm ang Email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:15px; color:#cbd5e1; margin:0 0 4px 0; line-height:1.6;">
                Ready na ang AKBai para maging katuwang mo sa negosyo. Tara na!
              </p>
              <p style="font-size:12px; color:#64748b; margin:16px 0 0 0; line-height:1.5;">
                Kung hindi ikaw nag-sign up, puwede mo i-ignore ang email na ito.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="font-size:12px; color:#64748b; margin:0;">Katuwang ng Negosyo Mo</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 6. Environment Variables

Add these to your `.env.local` (commented out until ready):

```bash
# ─── Custom SMTP (optional — Supabase default used if not set) ────
# RESEND_API_KEY=re_xxxxx
# SMTP_FROM_EMAIL=noreply@akbai.ph
```

> **Note:** These env vars are for future use if we add server-side email sending. The Supabase SMTP config in the dashboard is the primary mechanism for auth emails.

---

## 7. Testing Checklist

After completing the setup, run through this checklist:

### Pre-flight
- [ ] Resend domain shows "Verified" (green) in dashboard
- [ ] SPF record resolves correctly (check with `dig TXT akbai.ph`)
- [ ] DKIM record resolves correctly
- [ ] DMARC record resolves correctly
- [ ] Supabase SMTP settings saved without error

### Email Delivery Tests
- [ ] **Gmail** — Send test OTP to a Gmail address
  - [ ] Email arrives in inbox (not spam)
  - [ ] Email arrives within 30 seconds
  - [ ] Branded template renders correctly
- [ ] **Yahoo Mail (yahoo.com)** — Send test OTP
  - [ ] Email arrives in inbox (not spam)
  - [ ] Email arrives within 60 seconds
- [ ] **Yahoo Mail PH (yahoo.com.ph)** — Send test OTP
  - [ ] Email arrives in inbox (not spam)
  - [ ] Email arrives within 60 seconds
- [ ] **Outlook/Hotmail** — Send test OTP
  - [ ] Email arrives in inbox (not spam)

### Email Header Verification
For each test email, check the raw headers (Gmail: "Show original", Yahoo: "View raw message"):

- [ ] `spf=pass` in Authentication-Results header
- [ ] `dkim=pass` in Authentication-Results header
- [ ] `dmarc=pass` in Authentication-Results header
- [ ] `From:` header shows `noreply@akbai.ph`
- [ ] `Reply-To:` is not set (or matches From)

### Template Rendering
- [ ] AKBai logo text renders correctly
- [ ] Honey (#F59E0B) accent color shows on CTA button
- [ ] Dark background (#07101e) renders
- [ ] CTA button is clickable and leads to correct URL
- [ ] Template is readable on mobile (iPhone SE width, 375px)
- [ ] Template renders acceptably in Outlook desktop (table layout)

### End-to-End Auth Flow
- [ ] Click magic link from email → lands on app → authenticated
- [ ] OTP code entry works after receiving email
- [ ] "Back to email" flow works after switching providers

---

## 8. Troubleshooting

### Email not arriving at all
1. Check Resend dashboard → **Logs** for delivery status
2. Verify domain is "Verified" (not "Pending")
3. Check Supabase auth logs for SMTP errors
4. Ensure API key is correct and has sending permission

### Email going to spam (Yahoo)
1. Verify all 3 DNS records are correct (SPF, DKIM, DMARC)
2. Use [mail-tester.com](https://www.mail-tester.com/) — send a test email and check your score (aim for 9+/10)
3. Make sure sender domain matches DKIM domain
4. Avoid spam trigger words in subject line

### Email going to spam (Gmail)
1. Check Authentication-Results header for `spf=pass` and `dkim=pass`
2. Gmail usually respects proper DNS auth — if both pass, deliverability is good
3. Send from a real domain (not a free email domain)

### SMTP connection error in Supabase
1. Try port `587` instead of `465` (or vice versa)
2. Confirm API key starts with `re_` and is complete
3. Username must be exactly `resend` (not your email)

### DNS records not propagating
1. Wait up to 48 hours (rare, usually 10 min)
2. Use [dnschecker.org](https://dnschecker.org/) to check global propagation
3. If using Cloudflare, make sure the DNS records are set to "DNS only" (grey cloud), not proxied

### Rate limiting
- Resend free tier: 100 emails/day, 3,000/month
- Supabase minimum interval: 60 seconds between emails to same address
- If hitting limits during testing, wait or increase interval temporarily

---

## Quick Reference

| Item | Value |
|------|-------|
| SMTP Host | `smtp.resend.com` |
| SMTP Port | `465` (SSL) or `587` (TLS) |
| SMTP Username | `resend` |
| SMTP Password | Resend API key (`re_xxxxx`) |
| Sender Email | `noreply@akbai.ph` |
| Sender Name | `AKBai` |
| Resend Dashboard | [resend.com/domains](https://resend.com/domains) |
| Supabase SMTP Settings | Dashboard → Settings → Authentication → SMTP |
| Supabase Email Templates | Dashboard → Authentication → Email Templates |
