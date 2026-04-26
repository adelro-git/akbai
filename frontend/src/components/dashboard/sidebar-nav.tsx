'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  IconHomeNav,
  IconChatNav,
  IconScanNav,
  IconMoneyNav,
  IconMoreNav,
  type NavIconProps,
} from '@/components/illustrations/icons';
import { KaiSitting } from '@/components/illustrations/kai';
import LanguageToggle from './language-toggle';
import MoreDrawer from './more-drawer';
import { cn } from '@/lib/utils';

// ============================================================
// Phase 5 — Sidebar (≥ 860px breakpoint, per C1/C3).
// Re-skin in place — preserves the default-export API. Optional
// persona prop is hydrated by `(app)/layout.tsx`'s server fetch.
// Layout: brand lockup → persona pill → 5 nav items (5th is the
// Vaul "Higit pa…" trigger) → language toggle pinned to bottom.
// ============================================================

interface PersonaInfo {
  /** Business name (or display name fallback) — first line of the pill. */
  name: string | null;
  /** Localized business-type label or generic fallback — second line. */
  tagline: string | null;
}

interface SidebarNavProps {
  persona?: PersonaInfo;
}

interface NavItem {
  key: 'home' | 'chat' | 'scan' | 'money';
  href: string;
  icon: React.ComponentType<NavIconProps>;
  testId: string;
  i18nKey: 'home' | 'chat' | 'scan' | 'money';
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', href: '/dashboard', icon: IconHomeNav, testId: 'sidebar-nav-home', i18nKey: 'home' },
  { key: 'chat', href: '/chat', icon: IconChatNav, testId: 'sidebar-nav-chat', i18nKey: 'chat' },
  { key: 'scan', href: '/scan', icon: IconScanNav, testId: 'sidebar-nav-scan', i18nKey: 'scan' },
  { key: 'money', href: '/expenses', icon: IconMoneyNav, testId: 'sidebar-nav-money', i18nKey: 'money' },
];

function isRouteActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
}

export default function SidebarNav({ persona }: SidebarNavProps = {}) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const personaName = persona?.name ?? null;
  const personaTagline = persona?.tagline ?? t('personaFallbackTagline');
  const personaInitial = personaName ? personaName.trim().charAt(0).toUpperCase() : 'K';

  return (
    <aside
      className="hidden tablet:flex flex-col w-60 h-dvh fixed left-0 top-0 bg-surface-container-lowest border-r border-outline-soft/30 z-40"
      aria-label="Main navigation"
      data-testid="sidebar-nav"
    >
      {/* Brand lockup */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <div className="flex-shrink-0">
          <KaiSitting size={40} />
        </div>
        <div className="min-w-0">
          <p className="text-on-surface text-xl font-extrabold tracking-tight leading-none">
            AKB<span className="font-serif italic font-medium text-honey-deep">ai</span>
          </p>
          <p className="text-on-surface-variant text-[11px] mt-1 truncate">
            {t('brandTagline')}
          </p>
        </div>
      </div>

      {/* Persona pill — taps to /profile (single-user, no multi-account switcher). */}
      <Link
        href="/profile"
        aria-label={t('personaAria')}
        data-testid="sidebar-persona-pill"
        className="mx-3 mb-3 flex items-center gap-3 rounded-2xl bg-surface-container-lowest border border-outline-soft/30 p-3 transition-colors hover:border-honey/40 hover:bg-honey-pale/30 shadow-ambient"
      >
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-honey-deep text-white font-semibold text-sm">
          {personaInitial}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-on-surface truncate">
            {personaName ?? 'AKBai'}
          </span>
          <span className="block text-[11px] text-on-surface-variant truncate">
            {personaTagline}
          </span>
        </span>
      </Link>

      {/* Primary nav items (4 routes + 5th drawer trigger). */}
      <nav className="flex-1 px-3 space-y-1" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const active = isRouteActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              data-testid={item.testId}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-semibold transition-colors min-h-[44px]',
                active
                  ? 'bg-gradient-to-r from-honey to-honey-deep text-white shadow-ambient'
                  : 'text-on-surface-variant hover:bg-surface-container-high/50 hover:text-on-surface',
              )}
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center">
                <Icon size={26} active={active} />
              </span>
              <span>{t(item.i18nKey)}</span>
            </Link>
          );
        })}
        <MoreDrawer
          trigger={
            <button
              type="button"
              data-testid="sidebar-nav-more"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-semibold transition-colors min-h-[44px] text-on-surface-variant hover:bg-surface-container-high/50 hover:text-on-surface"
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center">
                <IconMoreNav size={26} active={false} />
              </span>
              <span>{t('more')}</span>
            </button>
          }
        />
      </nav>

      {/* Language toggle pinned to the bottom of the sidebar (per C5). */}
      <div className="px-4 pb-5 pt-3 border-t border-outline-soft/20">
        <LanguageToggle />
      </div>
    </aside>
  );
}

export type { PersonaInfo, SidebarNavProps };
