import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // 파일 형식 검증 - 더 관대하게 처리
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const isValidImageType = allowedTypes.includes(file.type) || file.type.startsWith('image/');
    
    if (!isValidImageType) {
      console.log('Invalid file type:', file.type, 'File name:', file.name);
      return NextResponse.json(
        { success: false, error: `Unsupported file type: ${file.type}. Supported types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (10MB 제한)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Vercel Blob에 업로드
    const filename = `report-images/${Date.now()}-${file.name}`;
    const blob = await put(filename, file, {
      access: 'public',
    });

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url,
        filename: blob.pathname,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // 더 상세한 오류 정보 제공
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    console.error('Detailed upload error:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      env: {
        PENTA_READ_WRITE_TOKEN: process.env.PENTA_READ_WRITE_TOKEN ? 'Present' : 'Missing'
      }
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