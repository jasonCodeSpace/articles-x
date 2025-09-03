import { NextRequest, NextResponse } from 'next/server';
import { generateCategories } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json();
    
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }
    
    const categories = await generateCategories(title, content);
    
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error generating categories:', error);
    return NextResponse.json(
      { error: 'Failed to generate categories' },
      { status: 500 }
    );
  }
}