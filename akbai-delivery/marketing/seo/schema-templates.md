# JSON-LD Schema Templates
> Ready-to-use structured data templates for AKBai pages
> Last updated: 2026-04-03 | Reference: https://schema.org

---

## Usage

Add these JSON-LD blocks inside `<script type="application/ld+json">` tags in the `<head>` of each page. Adjust values for each specific page. These templates power rich search results and Answer Engine Optimization (AEO).

---

## 1. Organization Schema

**Use on:** Every page (via layout component)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "AKBai",
  "alternateName": "Katuwang ng Negosyo Mo",
  "url": "https://akbai.vercel.app",
  "logo": "https://akbai.vercel.app/icons/icon-512.png",
  "description": "AI-powered business partner for Filipino MSMEs. Receipt scanning, BIR compliance, expense tracking, and daily operations — lahat in conversational Filipino.",
  "foundingDate": "2026",
  "founder": {
    "@type": "Person",
    "name": "Anton del Rosario"
  },
  "areaServed": {
    "@type": "Country",
    "name": "Philippines"
  },
  "knowsLanguage": ["en", "tl"],
  "sameAs": []
}
```

**Notes:**
- Update `sameAs` array once social profiles exist (Facebook, TikTok, Instagram, LinkedIn)
- `url` will change when we move to a custom domain

---

## 2. Article Schema

**Use on:** Every blog article

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[ARTICLE TITLE — under 110 characters]",
  "description": "[META DESCRIPTION — under 155 characters]",
  "image": "[OG IMAGE URL]",
  "author": {
    "@type": "Person",
    "name": "Anton del Rosario",
    "url": "https://akbai.vercel.app"
  },
  "publisher": {
    "@type": "Organization",
    "name": "AKBai",
    "logo": {
      "@type": "ImageObject",
      "url": "https://akbai.vercel.app/icons/icon-512.png"
    }
  },
  "datePublished": "[YYYY-MM-DD]",
  "dateModified": "[YYYY-MM-DD]",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "[ARTICLE URL]"
  },
  "inLanguage": "tl",
  "keywords": "[comma-separated keywords]"
}
```

**Notes:**
- `inLanguage`: Use "tl" (Tagalog) for conversational Filipino articles — Google treats Filipino-English code-switching as Filipino
- Always set `dateModified` when updating an article
- `headline` must match the H1 tag on the page

---

## 3. FAQPage Schema

**Use on:** Every blog article that has an FAQ section (which should be all of them)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[QUESTION TEXT — exactly as it appears in the article]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[ANSWER TEXT — concise, 1-3 sentences. Include key facts and numbers.]"
      }
    },
    {
      "@type": "Question",
      "name": "[QUESTION 2]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[ANSWER 2]"
      }
    },
    {
      "@type": "Question",
      "name": "[QUESTION 3]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[ANSWER 3]"
      }
    }
  ]
}
```

**Example (for BIR Deadline article):**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "When is the next BIR deadline in 2026?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The next major BIR deadline depends on your business type. For self-employed individuals and professionals, quarterly income tax (Form 1701Q) is due on May 15, August 15, and November 15. Quarterly percentage tax (Form 2551Q) is due on April 25, July 25, and October 25."
      }
    },
    {
      "@type": "Question",
      "name": "What happens if I miss a BIR filing deadline?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Missing a BIR deadline results in a 25% surcharge on the tax due, plus 12% annual interest (previously 20%, reduced under EOPT Act). There is also a compromise penalty that varies by form and amount. These penalties apply immediately — there is no grace period."
      }
    },
    {
      "@type": "Question",
      "name": "How many BIR deadlines are there per year?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "There are approximately 8-20 BIR deadlines per year depending on your business type and registration. Self-employed professionals typically have 8 major deadlines: quarterly income tax (3x), quarterly percentage/VAT tax (4x), and annual income tax return (1x)."
      }
    }
  ]
}
```

**Notes:**
- FAQPage schema generates rich results (expandable Q&A in Google Search)
- Questions should match the exact H3 or list text in the article
- Answers should be self-contained — make sense without reading the full article
- Include specific numbers (dates, amounts, percentages) in answers for AEO
- 3-5 questions per article is ideal
- BIR disclaimer is NOT needed in schema answers (it's in the article body)

---

## 4. HowTo Schema

**Use on:** Step-by-step guide articles (e.g., "Paano Mag-File ng 1701Q")

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "[GUIDE TITLE]",
  "description": "[1-2 sentence description of what this guide teaches]",
  "totalTime": "PT[X]M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "PHP",
    "value": "0"
  },
  "step": [
    {
      "@type": "HowToStep",
      "name": "[STEP 1 TITLE]",
      "text": "[STEP 1 DETAILED INSTRUCTIONS]",
      "url": "[ARTICLE URL]#step-1"
    },
    {
      "@type": "HowToStep",
      "name": "[STEP 2 TITLE]",
      "text": "[STEP 2 DETAILED INSTRUCTIONS]",
      "url": "[ARTICLE URL]#step-2"
    },
    {
      "@type": "HowToStep",
      "name": "[STEP 3 TITLE]",
      "text": "[STEP 3 DETAILED INSTRUCTIONS]",
      "url": "[ARTICLE URL]#step-3"
    }
  ]
}
```

**Example (for 1701Q Filing Guide):**
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Paano Mag-File ng 1701Q Online",
  "description": "Step-by-step guide para sa freelancers at online sellers kung paano mag-file ng quarterly income tax (Form 1701Q) sa BIR eFPS o eBIRForms.",
  "totalTime": "PT30M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "PHP",
    "value": "0"
  },
  "step": [
    {
      "@type": "HowToStep",
      "name": "Prepare Your Documents",
      "text": "Gather your quarterly income records, expense receipts, and previous quarter's 1701Q (if applicable). Compute your total gross income and allowable deductions for the quarter."
    },
    {
      "@type": "HowToStep",
      "name": "Download or Access the Form",
      "text": "Download BIR Form 1701Q from the BIR website (bir.gov.ph), or access it through the eBIRForms software. If you're enrolled in eFPS, log in to your eFPS account."
    },
    {
      "@type": "HowToStep",
      "name": "Fill Out the Form",
      "text": "Enter your TIN, registered name, and address. Fill in your gross income for the quarter in the applicable schedule. If using 8% flat tax rate, enter your gross sales/receipts and compute 8% of the amount exceeding P250,000."
    },
    {
      "@type": "HowToStep",
      "name": "Submit and Pay",
      "text": "Submit the form through eFPS or eBIRForms. Pay any tax due through authorized agent banks, GCash, or other BIR-accredited payment channels. Keep the confirmation receipt."
    }
  ]
}
```

**Notes:**
- `totalTime` uses ISO 8601 duration format (PT30M = 30 minutes)
- HowTo schema generates rich results with step-by-step display in Google
- Each step should be actionable and self-contained
- Include `url` with anchor links for each step

---

## 5. BreadcrumbList Schema

**Use on:** All pages for navigation context

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "AKBai",
      "item": "https://akbai.vercel.app"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://akbai.vercel.app/blog"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "[ARTICLE TITLE]",
      "item": "[ARTICLE URL]"
    }
  ]
}
```

---

## 6. SoftwareApplication Schema

**Use on:** Landing page / product page

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AKBai",
  "alternateName": "Katuwang ng Negosyo Mo",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web, Android, iOS (PWA)",
  "description": "AI-powered business partner for Filipino MSMEs. Receipt scanning, BIR compliance, expense tracking, customer communications, and daily operations — lahat in conversational Filipino.",
  "offers": [
    {
      "@type": "Offer",
      "name": "Free",
      "price": "0",
      "priceCurrency": "PHP",
      "description": "10 text queries/day, basic BIR deadlines"
    },
    {
      "@type": "Offer",
      "name": "Pro",
      "price": "399",
      "priceCurrency": "PHP",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "billingDuration": "P1M"
      },
      "description": "50 receipt scans/month, full AI features, morning briefing, BIR reminders"
    },
    {
      "@type": "Offer",
      "name": "Business",
      "price": "899",
      "priceCurrency": "PHP",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "billingDuration": "P1M"
      },
      "description": "80 receipt scans/month, multi-seat (up to 5), GSheets OAuth, priority support"
    }
  ],
  "author": {
    "@type": "Organization",
    "name": "AKBai"
  },
  "inLanguage": ["en", "tl"]
}
```

---

## Implementation Checklist

When adding schema to a page:

- [ ] Validate with Google Rich Results Test (search.google.com/test/rich-results)
- [ ] Validate with Schema.org Validator (validator.schema.org)
- [ ] Ensure all URLs use the correct domain (akbai.vercel.app)
- [ ] Ensure dates are in ISO 8601 format (YYYY-MM-DD)
- [ ] Ensure prices use "PHP" currency code and integer amounts
- [ ] Test that FAQ questions exactly match the on-page content
- [ ] Check for no trailing commas in JSON (causes parse errors)

---

*Update these templates when the domain changes from akbai.vercel.app to a custom domain. Global find-replace on the URL will be needed.*
