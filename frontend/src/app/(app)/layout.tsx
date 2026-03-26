import BottomNav from '@/components/dashboard/bottom-nav';
import SessionGuard from '@/components/auth/session-guard';

// (app) layout: auth guard is handled inline in each page for Next.js 16 compatibility
export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SessionGuard />
      {children}
      <BottomNav />
    </>
  );
}
