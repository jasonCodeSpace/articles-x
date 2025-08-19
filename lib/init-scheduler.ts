import { createScheduler } from './scheduler'

// Initialize scheduler on server startup
if (typeof window === 'undefined') {
  // Only run on server side
  console.log('🚀 Initializing Twitter List Scheduler...')
  
  // Create and start the scheduler
  const scheduler = createScheduler()
  
  if (process.env.SCHEDULER_ENABLED === 'true') {
    console.log('📅 Auto-starting scheduler based on environment configuration')
  } else {
    console.log('📅 Scheduler disabled in environment configuration')
  }
}

export {}