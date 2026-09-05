import { MotionConfig } from 'motion/react'
import { Outlet } from 'react-router'

import Header from './Header'

export default function AppLayout() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[var(--background)]">
        <Header />
        <Outlet />
      </div>
    </MotionConfig>
  )
}