import { nanoid } from 'nanoid';
import { Report, CreateReportInput } from '@/types/report';
import { Comment, CreateCommentInput } from '@/types/comment';

// KV 데이터베이스 설정
let redis: any = null;

// Vercel KV (Upstash Redis) 설정 (프로덕션용)
if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
  try {
    const { Redis } = require('@upstash/redis');
    redis = Redis.fromEnv();
  } catch (error) {
    console.warn('Vercel KV not available, using memory storage');
  }
}

// 메모리 스토리지 (개발용/폴백용)
const reportsStore = new Map<string, Report>();
const reportsList: string[] = [];
const commentsStore = new Map<string, Comment>();
const reportComments = new Map<string, string[]>(); // reportId -> commentIds[]

export async function createReport(input: CreateReportInput): Promise<Report> {
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

  if (redis) {
    // Vercel KV에 저장
    await redis.hset(`report:${id}`, report);
    await redis.lpush('reports:list', id);
  } else {
    // 메모리 스토리지에 저장
    reportsStore.set(id, report);
    reportsList.unshift(id);
  }
  
  return report;
}

export async function getReport(id: string): Promise<Report | null> {
  let report: Report | null = null;
  
  if (redis) {
    // Vercel KV에서 가져오기
    report = await redis.hgetall(`report:${id}`);
    if (report && Object.keys(report).length > 0) {
      // 날짜 문자열을 Date 객체로 변환
      report.createdAt = new Date(report.createdAt);
      report.updatedAt = new Date(report.updatedAt);
      report.occurredAt = new Date(report.occurredAt);
      
      // 조회수 증가
      report.viewCount = (report.viewCount || 0) + 1;
      await redis.hset(`report:${id}`, { viewCount: report.viewCount });
    } else {
      report = null;
    }
  } else {
    // 메모리 스토리지에서 가져오기
    report = reportsStore.get(id) || null;
    if (report) {
      report.viewCount++;
      reportsStore.set(id, report);
    }
  }
  
  return report;
}

export async function getReports(page: number = 1, pageSize: number = 10): Promise<{
  reports: Report[];
  total: number;
}> {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  let pageReportIds: string[] = [];
  let total = 0;
  
  if (redis) {
    // Vercel KV에서 가져오기
    const allIds = await redis.lrange('reports:list', 0, -1);
    total = allIds.length;
    pageReportIds = allIds.slice(start, end);
  } else {
    // 메모리 스토리지에서 가져오기
    total = reportsList.length;
    pageReportIds = reportsList.slice(start, end);
  }
  
  // 각 제보 데이터 가져오기 (댓글 수 포함)
  const reportPromises = pageReportIds.map(async (id) => {
    let report: Report | null = null;
    
    if (redis) {
      report = await redis.hgetall(`report:${id}`);
      if (report && Object.keys(report).length > 0) {
        // 날짜 문자열을 Date 객체로 변환
        report.createdAt = new Date(report.createdAt);
        report.updatedAt = new Date(report.updatedAt);
        report.occurredAt = new Date(report.occurredAt);
      } else {
        report = null;
      }
    } else {
      report = reportsStore.get(id) || null;
    }
    
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