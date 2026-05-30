'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  IconHomeNav,
  IconChatNav,
  IconMoneyNav,
  IconMoreNav,
  type NavIconProps,
} from '@/components/illustrations/icons';
import MoreDrawer from './more-drawer';
import { cn } from '@/lib/utils';

// ============================================================
// Bottom nav (< 860px breakpoint, per C2/C3) — Warm Precision (spec §7).
// Restructured 5-tabs → 4 tabs + center Scan FAB:
//   [ Umaga · Kai ]  ( Scan FAB )  [ Pera · Iba pa ]
// Scan left the tab row; it is now the floating honey-gradient FAB
// (sibling positioned over a 64px center spacer). The 4th tab "Iba pa"
// opens the Vaul MoreDrawer.
// Preserved: hide-on-/chat; body[data-scanning] suppression (data-testid
// "bottom-nav" selector in globals.css); glass-nav blur; tablet:hidden;
// safe-area inset; aria-current; honey-gradient active pill (inactive →
// on-faint per spec).
// Copy is LOCKED — labels pull the existing nav.* i18n keys unchanged.
// ============================================================

interface NavItem {
  key: 'home' | 'chat' | 'money';
  href: string;
  icon: React.ComponentType<NavIconProps>;
  testId: string;
  i18nKey: 'home' | 'chat' | 'money';
}

// Left cluster (2) then right cluster (1) + the More drawer trigger (1) = 4
// visible tab slots flanking the center Scan FAB.
const LEFT_ITEMS: NavItem[] = [
  { key: 'home', href: '/dashboard', icon: IconHomeNav, testId: 'nav-home', i18nKey: 'home' },
  { key: 'chat', href: '/chat', icon: IconChatNav, testId: 'nav-chat', i18nKey: 'chat' },
];

const RIGHT_ITEMS: NavItem[] = [
  { key: 'money', href: '/expenses', icon: IconMoneyNav, testId: 'nav-money', i18nKey: 'money' },
];

function isRouteActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
}

export default function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  // Hide bottom nav on chat — chat has its own full-screen layout with input bar.
  if (pathname === '/chat') return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 glass-nav shadow-ambient-nav z-50 tablet:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      data-testid="bottom-nav"
      aria-label="Main navigation"
    >
      <div className="relative flex items-stretch justify-around h-14 max-w-md mx-auto">
        {LEFT_ITEMS.map((item) => (
          <NavTab key={item.key} item={item} pathname={pathname} label={t(item.i18nKey)} />
        ))}

        {/* Center spacer reserves room for the floating Scan FAB. */}
        <div className="w-16 flex-shrink-0" aria-hidden="true" data-testid="nav-fab-spacer" />

        {RIGHT_ITEMS.map((item) => (
          <NavTab key={item.key} item={item} pathname={pathname} label={t(item.i18nKey)} />
        ))}

        <MoreDrawer
          showLanguageToggle
          trigger={
            <button
              type="button"
              data-testid="nav-more"
              className="flex flex-col items-center justify-center w-full min-w-[44px] min-h-[44px] px-1"
            >
              <ActiveTabContent
                icon={<IconMoreNav size={26} active={false} />}
                label={t('more')}
                active={false}
              />
            </button>
          }
        />

        {/* ── Scan FAB: floating honey-gradient circle, centered over the spacer ── */}
        <Link
          href="/scan"
          className="absolute left-1/2 -translate-x-1/2 -top-[22px] flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gradient-to-b from-grad-from to-grad-to shadow-el-3 transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-deep"
          data-testid="nav-scan-fab"
          aria-label={t('scan')}
          aria-current={isRouteActive(pathname, '/scan') ? 'page' : undefined}
        >
          <ScanFabGlyph />
        </Link>
      </div>
    </nav>
  );
}

interface NavTabProps {
  item: NavItem;
  pathname: string;
  label: string;
}

function NavTab({ item, pathname, label }: NavTabProps) {
  const active = isRouteActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="flex flex-col items-center justify-center w-full min-w-[44px] min-h-[44px] px-1"
      data-testid={item.testId}
      aria-current={active ? 'page' : undefined}
    >
      <ActiveTabContent icon={<Icon size={26} active={active} />} label={label} active={active} />
    </Link>
  );
}

// Scan FAB glyph — the receipt mark rendered WHITE on the honey gradient
// (prototype FAB treatment, distinct from IconScanNav's honey-on-cream tab
// glyph). Color comes from `text-on-primary` via fill-current / stroke-current
// so there is no hardcoded hex. Stroke is the darker honey grad-to token.
function ScanFabGlyph() {
  return (
    <svg
      width={28}
      height={28}
      viewBox="0 0 28 28"
      fill="none"
      role="img"
      aria-hidden="true"
      className="text-on-primary"
    >
      <path
        d="M8 5 Q8 4 9 4 L19 4 Q20 4 20 5 L20 22 L18.5 21 L17 22 L15.5 21 L14 22 L12.5 21 L11 22 L9.5 21 L8 22 Z"
        className="fill-current stroke-grad-to"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <line x1="11" y1="11" x2="17" y2="11" className="stroke-grad-to" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="11" y1="14" x2="15" y2="14" className="stroke-grad-to" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

interface ActiveTabContentProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function ActiveTabContent({ icon, label, active }: ActiveTabContentProps) {
  return (
    <>
      <span
        className={cn(
          'flex h-8 w-12 items-center justify-center rounded-full transition-colors',
          active && 'bg-gradient-to-r from-honey to-honey-deep shadow-ambient',
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          'text-[11px] font-semibold mt-0.5 transition-colors',
          active ? 'text-honey-deep' : 'text-on-faint',
        )}
      >
        {label}
      </span>
    </>
  );
}
