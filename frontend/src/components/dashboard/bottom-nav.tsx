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
import MoreDrawer from './more-drawer';
import { cn } from '@/lib/utils';

// ============================================================
// Phase 5 — Bottom nav (< 860px breakpoint, per C2/C3).
// 5 tabs preserved (Home / Chat / Scan / Pera / More) — Sprint 5
// reuse rule: re-skin in place, no parallel component. The 5th
// "More" tab opens the Vaul drawer with long-tail routes.
// Glass blur preserved (C6); honey-gradient active state (C2).
// ============================================================

interface NavItem {
  key: 'home' | 'chat' | 'scan' | 'money';
  href: string;
  icon: React.ComponentType<NavIconProps>;
  testId: string;
  i18nKey: 'home' | 'chat' | 'scan' | 'money';
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', href: '/dashboard', icon: IconHomeNav, testId: 'nav-home', i18nKey: 'home' },
  { key: 'chat', href: '/chat', icon: IconChatNav, testId: 'nav-chat', i18nKey: 'chat' },
  { key: 'scan', href: '/scan', icon: IconScanNav, testId: 'nav-scan', i18nKey: 'scan' },
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
      className="fixed bottom-0 left-0 right-0 glass-nav shadow-ambient-nav border-t border-outline-soft/30 z-50 tablet:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      data-testid="bottom-nav"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around h-14 max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const active = isRouteActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex flex-col items-center justify-center w-full min-w-[44px] min-h-[44px] px-1"
              data-testid={item.testId}
              aria-current={active ? 'page' : undefined}
            >
              <ActiveTabContent
                icon={<Icon size={26} active={active} />}
                label={t(item.i18nKey)}
                active={active}
              />
            </Link>
          );
        })}
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
      </div>
    </nav>
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
          active ? 'text-honey-deep' : 'text-on-surface-variant',
        )}
      >
        {label}
      </span>
    </>
  );
}
