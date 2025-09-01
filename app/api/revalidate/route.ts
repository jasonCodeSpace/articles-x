import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const secret = searchParams.get('secret')
  const path = searchParams.get('path')

  // Check for secret to confirm this is a valid request
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
  }

  if (!path) {
    return NextResponse.json({ message: 'Path parameter is required' }, { status: 400 })
  }

  try {
    // Revalidate the specific path
    revalidatePath(path)
    
    console.log(`Revalidated path: ${path}`)
    
    return NextResponse.json({ 
      message: `Path ${path} revalidated successfully`,
      revalidated: true,
      now: Date.now()
    })
  } catch (error) {
    console.error('Error revalidating path:', error)
    return NextResponse.json(
      { message: 'Error revalidating path', error: String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Revalidate API endpoint',
    usage: 'POST /api/revalidate?secret=YOUR_SECRET&path=/your/path'
  })
}