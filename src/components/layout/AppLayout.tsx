import { MotionConfig } from 'motion/react'
import { Outlet } from 'react-router'
import {
  usePageMeta,
} from '../../hooks/usePageMeta'

import Header from './Header'

export default function AppLayout() {
  
  usePageMeta()
  
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[var(--background)]">
        <Header />
        <Outlet />
      </div>
    </MotionConfig>
  )
}