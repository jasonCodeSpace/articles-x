#!/usr/bin/env npx tsx
/**
 * Run cleanup of low-score articles
 * Removes full content from articles with score < 65
 * Run this hourly via cron
 */
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { runCleanupLowScore } from '../lib/workflow/workflows/cleanup-low-score'

runCleanupLowScore(65).catch(console.error)
