import { NextRequest, NextResponse } from 'next/server';
import { createReport, getReports } from '@/lib/db';
import { CreateReportInput } from '@/types/report';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    
    const { reports, total } = await getReports(page, pageSize);
    
    return NextResponse.json({
      success: true,
      data: {
        items: reports,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 입력 검증
    if (!body.title || !body.category || !body.content || !body.occurredAt) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const input: CreateReportInput = {
      title: body.title,
      category: body.category,
      content: body.content,
      occurredAt: new Date(body.occurredAt),
      images: body.images,
      reporter: body.reporter,
    };
    
    const report = await createReport(input);
    
    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error creating report:', error);
    
    // 더 상세한 오류 정보 제공
    const errorMessage = error instanceof Error ? error.message : 'Failed to create report';
    console.error('Detailed error:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      input: body
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : String(error) : undefined
      },
      { status: 500 }
    );
  }
}