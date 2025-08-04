import { NextRequest, NextResponse } from 'next/server';
import { upvoteReport, downvoteReport, removeReportUpvote, removeReportDownvote } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;
    const { action } = await request.json();
    
    let result;
    
    switch (action) {
      case 'upvote':
        result = await upvoteReport(reportId);
        break;
      case 'downvote':
        result = await downvoteReport(reportId);
        break;
      case 'removeUpvote':
        result = await removeReportUpvote(reportId);
        break;
      case 'removeDownvote':
        result = await removeReportDownvote(reportId);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vote' },
      { status: 500 }
    );
  }
}