import { NextRequest, NextResponse } from 'next/server';
import { upvoteComment, downvoteComment, removeUpvote, removeDownvote } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;
    const { action } = await request.json();
    
    let result;
    
    switch (action) {
      case 'upvote':
        result = await upvoteComment(commentId);
        break;
      case 'downvote':
        result = await downvoteComment(commentId);
        break;
      case 'removeUpvote':
        result = await removeUpvote(commentId);
        break;
      case 'removeDownvote':
        result = await removeDownvote(commentId);
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