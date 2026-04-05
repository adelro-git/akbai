import BottomNav from '@/components/dashboard/bottom-nav';
import SidebarNav from '@/components/dashboard/sidebar-nav';
import SessionGuard from '@/components/auth/session-guard';

// (app) layout: sidebar on desktop, bottom nav on mobile
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
    </>
  );
}
