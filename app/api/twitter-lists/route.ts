export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getTwitterLists, updateTwitterList, getTwitterListStats } from '@/lib/twitter-lists'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('includeStats') === 'true'
    
    // Get all Twitter lists
    const lists = await getTwitterLists()
    
    // Add statistics if requested
    if (includeStats) {
      const stats = await getTwitterListStats()
        const listsWithStats = lists.map(list => ({
          ...list,
          globalStats: stats
        }))
      
      return NextResponse.json({
        success: true,
        lists: listsWithStats
      })
    }
    
    return NextResponse.json({
      success: true,
      lists
    })
    
  } catch (error) {
    console.error('Error fetching Twitter lists:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Twitter lists'
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { listId, isActive } = body
    
    if (!listId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: listId and isActive'
        },
        { status: 400 }
      )
    }
    
    await updateTwitterList(listId, { is_active: isActive })
    
    return NextResponse.json({
      success: true,
      message: `Twitter list ${listId} ${isActive ? 'activated' : 'deactivated'} successfully`
    })
    
  } catch (error) {
    console.error('Error updating Twitter list status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update Twitter list status'
      },
      { status: 500 }
    )
  }
}