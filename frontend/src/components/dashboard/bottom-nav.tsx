'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MorningBriefing, CustomerMessages, ResiboScanner, CashFlow, ProfileUser } from '@/components/illustrations/svg';

// ============================================================
// Nav Items — 5-item mobile bottom nav (max for mobile UX).
// Home, Chat, Resibo, Gastos, Profile. Secondary features
// (Costing, Invoices, Deadlines) accessible from dashboard cards.
// ============================================================

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  testId: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/dashboard', icon: MorningBriefing, testId: 'nav-home' },
  { label: 'Chat', href: '/chat', icon: CustomerMessages, testId: 'nav-chat' },
  { label: 'Resibo', href: '/scan', icon: ResiboScanner, testId: 'nav-scan' },
  { label: 'Gastos', href: '/expenses', icon: CashFlow, testId: 'nav-expenses' },
  { label: 'Profile', href: '/profile', icon: ProfileUser, testId: 'nav-profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide bottom nav on chat page — chat has its own full-screen layout with input bar
  if (pathname === '/chat') return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest/80 backdrop-blur-[20px] shadow-ambient-nav border-t border-outline-variant/20 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      data-testid="bottom-nav"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-14 max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full min-w-[44px] min-h-[44px]"
              data-testid={item.testId}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={`rounded-lg p-1 ${isActive ? 'bg-primary-container/15' : 'opacity-60'}`}>
                <Icon size={28} />
              </div>
              <span
                className={`text-[11px] font-semibold mt-0.5 ${
                  isActive ? 'text-primary-container' : 'text-on-surface-variant'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
