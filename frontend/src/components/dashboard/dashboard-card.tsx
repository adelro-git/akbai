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
      className="block bg-surface-container rounded-xl p-4 min-h-[88px] transition-colors hover:ring-1 hover:ring-primary-container/40 active:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
      data-testid={`dashboard-card-${icon}`}
      style={{ minHeight: '88px' }} // 2x 44px touch target
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
          {IconComponent ? (
            <IconComponent className="w-5 h-5 text-primary-container" />
          ) : (
            <span className="text-primary-container text-sm">?</span>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3 className="text-on-surface text-sm font-bold truncate">{title}</h3>
          {hasData ? (
            <p className="text-on-surface-variant text-xs mt-0.5 line-clamp-2">
              {description}
            </p>
          ) : (
            <p className="text-outline text-xs mt-0.5 italic line-clamp-2">
              {emptyState ?? description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
