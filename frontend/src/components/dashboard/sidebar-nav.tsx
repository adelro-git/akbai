'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { MorningBriefing, CashFlow, CustomerMessages, ResiboScanner, ProfileUser } from '@/components/illustrations/svg';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: MorningBriefing },
  { label: 'Saan Napunta?', href: '/expenses', icon: CashFlow },
  { label: 'Chat with Kai', href: '/chat', icon: CustomerMessages },
  { label: 'Resibo', href: '/scan', icon: ResiboScanner },
  { label: 'Profile', href: '/profile', icon: ProfileUser },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col w-64 h-dvh fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant/15 z-40"
      aria-label="Main navigation"
      data-testid="sidebar-nav"
    >
      {/* Logo / Brand */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-3">
        <div className="relative w-10 h-10 flex-shrink-0">
          <Image
            src="/icons/mark-on-light.png"
            alt=""
            fill
            className="object-contain"
            aria-hidden="true"
          />
        </div>
        <div>
          <p className="text-on-surface text-xl font-extrabold tracking-tight">
            AKB<span className="text-primary-container">ai</span>
          </p>
          <p className="text-on-surface-variant text-xs mt-0.5">Katuwang mo sa Negosyo</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-base font-semibold transition-colors ${
                isActive
                  ? 'bg-primary-container/15 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high/50'
              }`}
            >
              <div className={`flex-shrink-0 rounded-lg p-0.5 ${isActive ? 'bg-primary-container/15' : 'opacity-60'}`}>
                <Icon size={26} />
              </div>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
