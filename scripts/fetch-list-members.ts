/**
 * Fetch all members from Twitter lists and upload to Supabase authors table
 *
 * Usage: npx tsx scripts/fetch-list-members.ts
 */

import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Twitter List IDs
const LIST_IDS = [
  '1961293346099589584',
  '1961296267004502233',
  '1961298657371910342'
]

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'ab9b25a33dmsh9bbd3a16233f27dp1d0125jsn3cc5b2112be6'
const RAPIDAPI_HOST = 'twitter241.p.rapidapi.com'

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface ListMember {
  rest_id: string
  legacy: {
    screen_name: string
    name: string
    verified: boolean
    profile_image_url_https: string
    followers_count: number
  }
}

interface ListMembersResponse {
  result?: {
    timeline?: {
      instructions?: Array<{
        type?: string
        entries?: Array<{
          entryId?: string
          content?: {
            itemContent?: {
              user_results?: {
                result?: ListMember
              }
            }
          }
        }>
      }>
    }
  }
}

/**
 * Fetch all members from a single list
 */
async function fetchListMembers(listId: string): Promise<ListMember[]> {
  const members: ListMember[] = []
  let cursor: string | undefined = ''

  while (cursor !== undefined && cursor !== null) {
    try {
      const url = `https://${RAPIDAPI_HOST}/list-members`
      const params = new URLSearchParams({
        listId,
        count: '100',
        ...(cursor && { cursor })
      })

      const response = await axios.get<ListMembersResponse>(`${url}?${params}`, {
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY
        },
        timeout: 30000
      })

      // Parse members from response
      const instructions = response.data.result?.timeline?.instructions || []
      for (const instruction of instructions) {
        if (instruction.type === 'TimelineAddEntries' && instruction.entries) {
          for (const entry of instruction.entries) {
            if (entry.entryId?.startsWith('user-')) {
              const member = entry.content?.itemContent?.user_results?.result
              if (member && member.legacy) {
                members.push(member)
              }
            }
          }
        }
      }

      // Find next cursor
      cursor = undefined
      for (const instruction of instructions) {
        if (instruction.type === 'TimelineAddEntries' && instruction.entries) {
          const cursorEntry = instruction.entries.find((e: any) =>
            e.entryId?.startsWith('cursor-bottom-') || e.content?.cursorType === 'Bottom'
          )
          if (cursorEntry && (cursorEntry as any).content?.value) {
            cursor = (cursorEntry as any).content.value
            break
          }
        }
      }

      console.log(`  Fetched ${members.length} members so far from list ${listId}`)

      // Rate limiting - sleep between requests
      await sleep(200)
    } catch (error) {
      console.error(`Error fetching list ${listId}:`, error)
      break
    }
  }

  return members
}

/**
 * Upload members to Supabase authors table
 */
async function uploadAuthors(members: ListMember[]): Promise<void> {
  let uploaded = 0
  let skipped = 0
  let errors = 0

  for (const member of members) {
    try {
      const { error } = await supabase
        .from('authors')
        .upsert(
          {
            handle: member.legacy.screen_name,
            display_name: member.legacy.name,
            verified: member.legacy.verified,
            profile_image_url: member.legacy.profile_image_url_https
          },
          { onConflict: 'handle' }
        )

      if (error) {
        console.error(`Error upserting ${member.legacy.screen_name}:`, error.message)
        errors++
      } else {
        uploaded++
        if (uploaded % 50 === 0) {
          console.log(`  Uploaded ${uploaded} authors...`)
        }
      }
    } catch (error) {
      console.error(`Error processing ${member.legacy.screen_name}:`, error)
      errors++
    }
  }

  console.log(`\nUpload complete: ${uploaded} uploaded, ${skipped} skipped, ${errors} errors`)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Main function
 */
async function main() {
  console.log('Fetching members from Twitter lists...\n')

  const allMembers: ListMember[] = []

  for (const listId of LIST_IDS) {
    console.log(`Fetching list ${listId}...`)
    const members = await fetchListMembers(listId)
    allMembers.push(...members)
    console.log(`  Total members from this list: ${members.length}\n`)
  }

  console.log(`\nTotal members fetched: ${allMembers.length}`)

  // Remove duplicates based on screen_name
  const uniqueMembers = Array.from(
    new Map(allMembers.map(m => [m.legacy.screen_name, m])).values()
  )
  console.log(`Unique members: ${uniqueMembers.length}\n`)

  // Sort by follower count
  uniqueMembers.sort((a, b) => b.legacy.followers_count - a.legacy.followers_count)

  // Show top 10
  console.log('Top 10 by followers:')
  uniqueMembers.slice(0, 10).forEach((m, i) => {
    console.log(`  ${i + 1}. @${m.legacy.screen_name} (${m.legacy.followers_count.toLocaleString()} followers) - ${m.legacy.name}`)
  })

  // Upload to Supabase
  console.log('\nUploading to Supabase...')
  await uploadAuthors(uniqueMembers)

  console.log('\nDone!')
}

main().catch(console.error)
