import type { Metadata } from 'next';
import BottomNav from '@/components/dashboard/bottom-nav';
import SidebarNav from '@/components/dashboard/sidebar-nav';
import SessionGuard from '@/components/auth/session-guard';

export const metadata: Metadata = {
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AKBai',
  },
};

// (app) layout: sidebar on desktop, bottom nav on mobile, PWA enabled
export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SessionGuard />
      <SidebarNav />
      <div className="md:ml-64">
        {children}
      </div>
      <BottomNav />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `,
        }}
      />
    </>
  );
}
