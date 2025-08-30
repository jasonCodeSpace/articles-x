import { NextResponse } from 'next/server';
import { testGeminiConnection } from '@/lib/gemini';

export async function GET() {
  try {
    const result = await testGeminiConnection();
    
    return NextResponse.json({
      success: true,
      message: 'Gemini API connection test successful',
      result
    });
  } catch (error) {
    console.error('Gemini API test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Gemini API connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}