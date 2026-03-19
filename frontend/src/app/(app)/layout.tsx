// (app) layout: auth guard is handled inline in each page for Next.js 16 compatibility
export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
