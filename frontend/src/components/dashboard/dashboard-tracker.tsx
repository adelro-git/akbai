'use client'

import { useEffect, useRef } from 'react'
import { trackDashboardViewed } from '@/lib/posthog/events'

/**
 * Invisible client component that fires the dashboard_viewed event once on mount.
 * Placed inside the server-rendered DashboardPage.
 */
export default function DashboardTracker() {
  const tracked = useRef(false)

  useEffect(() => {
    if (!tracked.current) {
      trackDashboardViewed()
      tracked.current = true
    }
  }, [])

  return null
}
