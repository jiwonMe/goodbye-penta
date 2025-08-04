import { NextRequest, NextResponse } from 'next/server';
import { supportReport, unsupportReport } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { support } = await request.json();
    
    const newCount = support 
      ? await supportReport(params.id)
      : await unsupportReport(params.id);
    
    return NextResponse.json({
      success: true,
      data: { supportCount: newCount },
    });
  } catch (error) {
    console.error('Error updating support:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update support' },
      { status: 500 }
    );
  }
}