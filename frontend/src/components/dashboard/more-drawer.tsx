'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Drawer as DrawerPrimitive } from 'vaul';
import {
  IconKalendaryo,
  IconPrecio,
  IconInvoice,
  IconDrafts,
  IconCheckin,
  IconSundayStory,
} from '@/components/illustrations/icons';
import LanguageToggle from './language-toggle';
import { cn } from '@/lib/utils';

// ============================================================
// Phase 5 — "Higit pa…" / "More" Vaul drawer (per C7 verdict).
// 6 long-tail routes from the synthesis spec. Routes that don't
// exist yet (Mga Draft, Linggong Kuwento) render disabled with
// a "coming soon" subtitle until Phase 10 ships.
// Trigger is rendered by the consumer (sidebar 5th item OR bottom-nav More tab).
// ============================================================

interface DrawerItem {
  key: string;
  href: string | null;
  icon: ReactNode;
  i18nKey: 'deadlines' | 'costing' | 'invoices' | 'drafts' | 'checkin' | 'kuwento';
  comingSoon: boolean;
}

const ITEMS: DrawerItem[] = [
  {
    key: 'deadlines',
    href: '/deadlines',
    icon: <IconKalendaryo size={28} />,
    i18nKey: 'deadlines',
    comingSoon: false,
  },
  {
    key: 'costing',
    href: '/costing',
    icon: <IconPrecio size={28} />,
    i18nKey: 'costing',
    comingSoon: false,
  },
  {
    key: 'invoices',
    href: '/invoices',
    icon: <IconInvoice size={28} />,
    i18nKey: 'invoices',
    comingSoon: false,
  },
  {
    key: 'drafts',
    href: null,
    icon: <IconDrafts size={28} />,
    i18nKey: 'drafts',
    comingSoon: true,
  },
  {
    key: 'checkin',
    href: '/dashboard',
    icon: <IconCheckin size={28} />,
    i18nKey: 'checkin',
    comingSoon: false,
  },
  {
    key: 'kuwento',
    href: null,
    icon: <IconSundayStory size={28} />,
    i18nKey: 'kuwento',
    comingSoon: true,
  },
];

interface MoreDrawerProps {
  trigger: ReactNode;
  /** Show the language toggle compact pill at the bottom of the drawer (mobile-only). */
  showLanguageToggle?: boolean;
}

export default function MoreDrawer({ trigger, showLanguageToggle = false }: MoreDrawerProps) {
  const t = useTranslations('more');
  const tCommon = useTranslations('common');
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleItemClick(item: DrawerItem) {
    if (item.comingSoon || !item.href) return;
    setOpen(false);
    router.push(item.href);
  }

  return (
    <DrawerPrimitive.Root open={open} onOpenChange={setOpen} shouldScaleBackground>
      <DrawerPrimitive.Trigger asChild>{trigger}</DrawerPrimitive.Trigger>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
        <DrawerPrimitive.Content
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-2xl bg-surface shadow-ambient-lg outline-none"
          data-testid="more-drawer-content"
        >
          <div className="mx-auto mt-3 mb-2 h-1 w-8 rounded-full bg-outline-variant/60" />
          <header className="px-5 pt-1 pb-3">
            <DrawerPrimitive.Title className="wp-h1 leading-tight text-on-surface">
              {t('title')}
            </DrawerPrimitive.Title>
            <DrawerPrimitive.Description className="mt-1 wp-body text-on-surface-variant">
              {t('subtitle')}
            </DrawerPrimitive.Description>
          </header>
          <ul
            className="grid gap-2 overflow-y-auto px-5 pb-5"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.25rem)' }}
            role="list"
          >
            {ITEMS.map((item) => {
              const title = t(`items.${item.i18nKey}.title`);
              const subtitle = t(`items.${item.i18nKey}.subtitle`);
              const disabled = item.comingSoon || !item.href;
              // Warm Precision (spec §7): Level-3 solid sheet items — tonal
              // surface-container-low fill, No-Line Rule (no hairline border),
              // tone step to surface-container-high on press.
              const sharedClass = cn(
                'flex w-full items-center gap-3 rounded-2xl bg-surface-container-low p-4 text-left transition-colors',
                disabled
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:bg-surface-container active:bg-surface-container-high',
              );
              const inner = (
                <>
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-secondary-container">
                    {item.icon}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block wp-body-strong text-on-surface">{title}</span>
                    <span className="block text-xs text-on-surface-variant truncate">
                      {disabled ? t('comingSoon') : subtitle}
                    </span>
                  </span>
                </>
              );
              return (
                <li key={item.key}>
                  {disabled ? (
                    <button
                      type="button"
                      disabled
                      data-testid={`more-item-${item.key}`}
                      className={sharedClass}
                      aria-disabled="true"
                    >
                      {inner}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleItemClick(item)}
                      data-testid={`more-item-${item.key}`}
                      className={sharedClass}
                    >
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
            {showLanguageToggle && (
              <li className="pt-2">
                <LanguageToggle compact />
              </li>
            )}
            <li className="pt-1">
              <DrawerPrimitive.Close asChild>
                <button
                  type="button"
                  className="w-full rounded-full bg-surface-container-high px-4 py-3 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-highest"
                  data-testid="more-drawer-close"
                >
                  {tCommon('close')}
                </button>
              </DrawerPrimitive.Close>
            </li>
          </ul>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}

export { ITEMS as MORE_DRAWER_ITEMS };
export type { DrawerItem as MoreDrawerItem };
