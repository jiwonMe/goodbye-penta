import { nanoid } from 'nanoid';
import { Report, CreateReportInput } from '@/types/report';
import { Comment, CreateCommentInput } from '@/types/comment';
import { put } from '@vercel/blob';
import { Category } from '@/types/report';

// Blob 스토리지 설정
const BLOB_ENABLED = !!process.env.BLOB_READ_WRITE_TOKEN || !!process.env.PENTA_READ_WRITE_TOKEN;
const REPORTS_BLOB_KEY = 'reports-data.json';

if (BLOB_ENABLED) {
  console.log('✅ Vercel Blob storage enabled');
} else {
  console.log('📝 Using memory storage (Blob token not found)');
}

// 메모리 스토리지 (개발용/폴백용)
const reportsStore = new Map<string, Report>();
const reportsList: string[] = [];
const commentsStore = new Map<string, Comment>();
const reportComments = new Map<string, string[]>(); // reportId -> commentIds[]

// 더미 데이터 초기화 (메모리 스토리지용)
function initializeDummyData() {
  if (reportsStore.size === 0) {
    console.log('🔄 더미 데이터 초기화 중...');
    
    const dummyReports = [
      {
        id: 'sample-1',
        title: '입장 대기 시간 3시간 지연',
        category: Category.OPERATION_FAILURE,
        content: '오후 1시부터 입장 예정이었으나 실제 입장은 오후 4시에 시작되었습니다. 더위 속에서 대기하는 동안 충분한 안내나 생수 제공이 없었습니다.',
        occurredAt: new Date('2025-08-01T13:00:00'),
        createdAt: new Date('2025-08-01T16:30:00'),
        updatedAt: new Date('2025-08-01T16:30:00'),
        supportCount: 12,
        viewCount: 45,
        upvotes: 8,
        downvotes: 1,
        reporter: { nickname: '음악팬123' }
      },
      {
        id: 'sample-2', 
        title: '화장실 부족 및 위생 상태 불량',
        category: Category.FACILITY,
        content: '행사장 내 화장실이 턱없이 부족했고, 기존 화장실도 청소가 제대로 되지 않아 이용하기 어려운 상태였습니다.',
        occurredAt: new Date('2025-08-02T14:00:00'),
        createdAt: new Date('2025-08-02T18:00:00'),
        updatedAt: new Date('2025-08-02T18:00:00'),
        supportCount: 23,
        viewCount: 67,
        upvotes: 19,
        downvotes: 2,
        reporter: { nickname: '페스티벌러버' }
      },
      {
        id: 'sample-3',
        title: '셔틀버스 운행 중단',
        category: Category.TRANSPORTATION,
        content: '마지막 날 새벽 2시경 갑작스럽게 셔틀버스 운행이 중단되어 많은 관객들이 발을 걸이게 되었습니다. 사전 공지도 없었습니다.',
        occurredAt: new Date('2025-08-03T02:00:00'),
        createdAt: new Date('2025-08-03T09:00:00'),
        updatedAt: new Date('2025-08-03T09:00:00'),
        supportCount: 34,
        viewCount: 89,
        upvotes: 28,
        downvotes: 3,
        reporter: { nickname: '심야관객' }
      }
    ];

    dummyReports.forEach(report => {
      reportsStore.set(report.id, report);
      reportsList.unshift(report.id);
    });
    
    console.log('✅ 더미 데이터 초기화 완료:', reportsStore.size, '개 제보');
  }
}

// Blob 스토리지 헬퍼 함수들
async function loadReportsFromBlob(): Promise<{ reports: Map<string, Report>; reportsList: string[] }> {
  if (!BLOB_ENABLED) {
    return { reports: new Map(), reportsList: [] };
  }

  try {
    const response = await fetch(`https://blob.vercel-storage.com/${REPORTS_BLOB_KEY}`, {
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN || process.env.PENTA_READ_WRITE_TOKEN}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      const reports = new Map<string, Report>();
      
      // Date 객체 복원
      data.reports.forEach((report: Report) => {
        reports.set(report.id, {
          ...report,
          createdAt: new Date(report.createdAt),
          updatedAt: new Date(report.updatedAt),
          occurredAt: new Date(report.occurredAt)
        });
      });
      
      console.log('✅ Blob에서 제보 데이터 로드 완료:', data.reports.length, '개');
      return { reports, reportsList: data.reportsList || [] };
    }
  } catch (error) {
    console.warn('⚠️ Blob에서 데이터 로드 실패:', error);
  }
  
  return { reports: new Map(), reportsList: [] };
}

async function saveReportsToBlob(reports: Map<string, Report>, reportsList: string[]): Promise<void> {
  if (!BLOB_ENABLED) return;

  try {
    const data = {
      reports: Array.from(reports.values()),
      reportsList: reportsList,
      lastUpdated: new Date().toISOString()
    };

    await put(REPORTS_BLOB_KEY, JSON.stringify(data), {
      access: 'public',
    });
    
    console.log('✅ Blob에 제보 데이터 저장 완료');
  } catch (error) {
    console.warn('⚠️ Blob 저장 실패:', error);
  }
}

// 데이터 초기화
let dataInitialized = false;
async function initializeData() {
  if (dataInitialized) return;
  
  if (BLOB_ENABLED) {
    console.log('🔄 Blob에서 데이터 로드 중...');
    const { reports, reportsList: loadedList } = await loadReportsFromBlob();
    
    if (reports.size > 0) {
      // Blob에서 로드한 데이터로 메모리 스토리지 초기화
      reports.forEach((report, id) => {
        reportsStore.set(id, report);
      });
      reportsList.splice(0, reportsList.length, ...loadedList);
      console.log('✅ Blob 데이터로 초기화 완료:', reports.size, '개 제보');
    } else {
      // Blob에 데이터가 없으면 더미 데이터로 초기화
      console.log('🔄 더미 데이터로 초기화 중...');
      initializeDummyData();
      await saveReportsToBlob(reportsStore, reportsList);
    }
  } else {
    // Blob을 사용할 수 없으면 더미 데이터만 사용
    initializeDummyData();
  }
  
  dataInitialized = true;
}

export async function createReport(input: CreateReportInput): Promise<Report> {
  try {
    // 데이터 초기화
    await initializeData();
    
    console.log('🔄 Creating report with input:', { ...input, images: input.images ? `${input.images.length} images` : 'no images' });
    
    const id = nanoid();
    const now = new Date();
    
    const report: Report = {
      id,
      ...input,
      createdAt: now,
      updatedAt: now,
      supportCount: 0,
      viewCount: 0,
      upvotes: 0,
      downvotes: 0,
    };

    // 메모리 스토리지에 저장
    reportsStore.set(id, report);
    reportsList.unshift(id);
    
    // Blob에 저장 (비동기)
    if (BLOB_ENABLED) {
      console.log('💾 Saving to Vercel Blob...');
      try {
        await saveReportsToBlob(reportsStore, reportsList);
        console.log('✅ Saved to Vercel Blob successfully');
      } catch (blobError) {
        console.warn('⚠️ Blob 저장 실패:', blobError);
      }
    } else {
      console.log('💾 Saved to memory storage only');
    }
    
    console.log('🎉 Report created successfully:', id);
    return report;
  } catch (error) {
    console.error('❌ Error in createReport:', error);
    throw error;
  }
}

export async function getReport(id: string): Promise<Report | null> {
  // 데이터 초기화
  await initializeData();
  
  const report = reportsStore.get(id) || null;
  if (report) {
    report.viewCount++;
    reportsStore.set(id, report);
    
    // Blob에 업데이트된 데이터 저장 (비동기, 오류 무시)
    if (BLOB_ENABLED) {
      saveReportsToBlob(reportsStore, reportsList).catch(error => {
        console.warn('⚠️ 조회수 업데이트 Blob 저장 실패:', error);
      });
    }
  }
  
  return report;
}

export async function getReports(page: number = 1, pageSize: number = 10): Promise<{
  reports: Report[];
  total: number;
}> {
  // 데이터 초기화
  await initializeData();
  
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  // 메모리 스토리지에서 가져오기
  const total = reportsList.length;
  const pageReportIds = reportsList.slice(start, end);
  
  // 각 제보 데이터 가져오기 (댓글 수 포함)
  const reportPromises = pageReportIds.map(async (id) => {
    const report = reportsStore.get(id);
    if (!report) return null;
    
    const commentCount = await getCommentCount(id);
    return { ...report, commentCount };
  });
  
  const allReports = await Promise.all(reportPromises);
  const validReports = allReports.filter((report): report is Report & { commentCount: number } => report !== null);
  
  return {
    reports: validReports,
    total,
  };
}

export async function supportReport(id: string): Promise<number> {
  const report = reportsStore.get(id);
  if (!report) {
    throw new Error('Report not found');
  }
  
  report.supportCount++;
  reportsStore.set(id, report);
  
  return report.supportCount;
}

export async function unsupportReport(id: string): Promise<number> {
  const report = reportsStore.get(id);
  if (!report) {
    throw new Error('Report not found');
  }
  
  if (report.supportCount > 0) {
    report.supportCount--;
    reportsStore.set(id, report);
  }
  
  return report.supportCount;
}

// 댓글 관련 함수들
export async function createComment(input: CreateCommentInput): Promise<Comment> {
  const id = nanoid();
  const now = new Date();
  
  const comment: Comment = {
    id,
    ...input,
    createdAt: now,
    updatedAt: now,
    upvotes: 0,
    downvotes: 0,
  };

  // 댓글 저장
  commentsStore.set(id, comment);
  
  // 제보별 댓글 목록에 추가
  const reportCommentIds = reportComments.get(input.reportId) || [];
  reportCommentIds.push(id);
  reportComments.set(input.reportId, reportCommentIds);
  
  return comment;
}

export async function getCommentsByReportId(reportId: string): Promise<Comment[]> {
  const commentIds = reportComments.get(reportId) || [];
  
  const comments = commentIds
    .map(id => commentsStore.get(id))
    .filter((comment): comment is Comment => comment !== undefined)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // 최신순
  
  return comments;
}

export async function getCommentCount(reportId: string): Promise<number> {
  const commentIds = reportComments.get(reportId) || [];
  return commentIds.length;
}

export async function upvoteComment(commentId: string): Promise<{ upvotes: number; downvotes: number }> {
  const comment = commentsStore.get(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  
  comment.upvotes++;
  commentsStore.set(commentId, comment);
  
  return { upvotes: comment.upvotes, downvotes: comment.downvotes };
}

export async function downvoteComment(commentId: string): Promise<{ upvotes: number; downvotes: number }> {
  const comment = commentsStore.get(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  
  comment.downvotes++;
  commentsStore.set(commentId, comment);
  
  return { upvotes: comment.upvotes, downvotes: comment.downvotes };
}

export async function removeUpvote(commentId: string): Promise<{ upvotes: number; downvotes: number }> {
  const comment = commentsStore.get(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  
  if (comment.upvotes > 0) {
    comment.upvotes--;
    commentsStore.set(commentId, comment);
  }
  
  return { upvotes: comment.upvotes, downvotes: comment.downvotes };
}

export async function removeDownvote(commentId: string): Promise<{ upvotes: number; downvotes: number }> {
  const comment = commentsStore.get(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  
  if (comment.downvotes > 0) {
    comment.downvotes--;
    commentsStore.set(commentId, comment);
  }
  
  return { upvotes: comment.upvotes, downvotes: comment.downvotes };
}

// 제보 삭제 함수
export async function deleteReport(id: string): Promise<boolean> {
  const report = reportsStore.get(id);
  if (!report) {
    return false;
  }
  
  // 제보 삭제
  reportsStore.delete(id);
  
  // 목록에서 제거
  const index = reportsList.indexOf(id);
  if (index > -1) {
    reportsList.splice(index, 1);
  }
  
  // 해당 제보의 모든 댓글 삭제
  const commentIds = reportComments.get(id) || [];
  commentIds.forEach(commentId => {
    commentsStore.delete(commentId);
  });
  reportComments.delete(id);
  
  return true;
}

// 댓글 삭제 함수
export async function deleteComment(id: string): Promise<boolean> {
  const comment = commentsStore.get(id);
  if (!comment) {
    return false;
  }
  
  // 댓글 삭제
  commentsStore.delete(id);
  
  // 제보의 댓글 목록에서 제거
  const reportCommentIds = reportComments.get(comment.reportId) || [];
  const index = reportCommentIds.indexOf(id);
  if (index > -1) {
    reportCommentIds.splice(index, 1);
    reportComments.set(comment.reportId, reportCommentIds);
  }
  
  return true;
}

// 제보 upvote 함수
export async function upvoteReport(reportId: string): Promise<{ upvotes: number; downvotes: number }> {
  const report = reportsStore.get(reportId);
  if (!report) {
    throw new Error('Report not found');
  }
  
  report.upvotes = (report.upvotes || 0) + 1;
  reportsStore.set(reportId, report);
  
  return { upvotes: report.upvotes, downvotes: report.downvotes || 0 };
}

// 제보 downvote 함수
export async function downvoteReport(reportId: string): Promise<{ upvotes: number; downvotes: number }> {
  const report = reportsStore.get(reportId);
  if (!report) {
    throw new Error('Report not found');
  }
  
  report.downvotes = (report.downvotes || 0) + 1;
  reportsStore.set(reportId, report);
  
  return { upvotes: report.upvotes || 0, downvotes: report.downvotes };
}

// 제보 upvote 취소 함수
export async function removeReportUpvote(reportId: string): Promise<{ upvotes: number; downvotes: number }> {
  const report = reportsStore.get(reportId);
  if (!report) {
    throw new Error('Report not found');
  }
  
  if (report.upvotes && report.upvotes > 0) {
    report.upvotes--;
    reportsStore.set(reportId, report);
  }
  
  return { upvotes: report.upvotes || 0, downvotes: report.downvotes || 0 };
}

// 제보 downvote 취소 함수
export async function removeReportDownvote(reportId: string): Promise<{ upvotes: number; downvotes: number }> {
  const report = reportsStore.get(reportId);
  if (!report) {
    throw new Error('Report not found');
  }
  
  if (report.downvotes && report.downvotes > 0) {
    report.downvotes--;
    reportsStore.set(reportId, report);
  }
  
  return { upvotes: report.upvotes || 0, downvotes: report.downvotes || 0 };
}