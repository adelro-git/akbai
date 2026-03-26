'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Camera, User, Wallet } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: typeof Home;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Saan Napunta?', href: '/expenses', icon: Wallet },
  { label: 'Chat with Kai', href: '/chat', icon: MessageCircle },
  { label: 'Resibo', href: '/scan', icon: Camera },
  { label: 'Profile', href: '/profile', icon: User },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col w-56 h-dvh fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant/15 z-40"
      aria-label="Main navigation"
      data-testid="sidebar-nav"
    >
      {/* Logo / Brand */}
      <div className="px-5 pt-6 pb-5">
        <p className="text-on-surface text-lg font-extrabold tracking-tight">AKBai</p>
        <p className="text-on-surface-variant text-[10px] mt-0.5">Katuwang ng Negosyo Mo</p>
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-primary-container/15 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high/50'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
