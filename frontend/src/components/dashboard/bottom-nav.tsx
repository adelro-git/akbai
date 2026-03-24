'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Camera, User } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: typeof Home;
  testId: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/dashboard', icon: Home, testId: 'nav-home' },
  { label: 'Chat', href: '/chat', icon: MessageCircle, testId: 'nav-chat' },
  { label: 'Resibo', href: '/scan', icon: Camera, testId: 'nav-scan' },
  { label: 'Profile', href: '/profile', icon: User, testId: 'nav-profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-kai-card/95 backdrop-blur-sm border-t border-white/5 z-50"
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
              <Icon
                className={`w-6 h-6 ${isActive ? 'text-honey' : 'text-slate-400'}`}
              />
              <span
                className={`text-[11px] font-semibold mt-0.5 ${
                  isActive ? 'text-honey' : 'text-slate-400'
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
