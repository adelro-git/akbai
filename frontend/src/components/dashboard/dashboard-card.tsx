'use client';

import Link from 'next/link';
import {
  Camera,
  Wallet,
  Calendar,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  camera: Camera,
  wallet: Wallet,
  calendar: Calendar,
  'message-circle': MessageCircle,
};

interface DashboardCardProps {
  title: string;
  description: string;
  href: string;
  icon: string;
  emptyState?: string;
  hasData?: boolean;
}

export default function DashboardCard({
  title,
  description,
  href,
  icon,
  emptyState,
  hasData = false,
}: DashboardCardProps) {
  const IconComponent = ICON_MAP[icon];

  return (
    <Link
      href={href}
      className="block bg-kai-card rounded-xl p-4 min-h-[88px] transition-colors hover:ring-1 hover:ring-honey/40 active:bg-kai-card-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey"
      data-testid={`dashboard-card-${icon}`}
      style={{ minHeight: '88px' }} // 2x 44px touch target
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-kai-card-alt flex items-center justify-center flex-shrink-0">
          {IconComponent ? (
            <IconComponent className="w-5 h-5 text-honey" />
          ) : (
            <span className="text-honey text-sm">?</span>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3 className="text-white text-sm font-bold truncate">{title}</h3>
          {hasData ? (
            <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">
              {description}
            </p>
          ) : (
            <p className="text-slate-500 text-xs mt-0.5 italic line-clamp-2">
              {emptyState ?? description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
