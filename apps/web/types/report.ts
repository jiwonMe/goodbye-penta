export enum Category {
  OPERATION_FAILURE = '운영실패',
  SAFETY_ISSUE = '안전문제',
  FACILITY = '편의시설',
  TRANSPORTATION = '교통',
  OTHER = '기타'
}

export interface Reporter {
  nickname?: string;
  contact?: string;
}

export interface Report {
  id: string;
  title: string;
  category: Category;
  content: string;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
  images?: string[];
  reporter?: Reporter;
  supportCount: number;
  viewCount: number;
  commentCount?: number;
  upvotes?: number;
  downvotes?: number;
}

export interface CreateReportInput {
  title: string;
  category: Category;
  content: string;
  occurredAt: Date;
  images?: string[];
  reporter?: Reporter;
}

export interface UpdateReportInput {
  title?: string;
  category?: Category;
  content?: string;
  occurredAt?: Date;
  images?: string[];
}

export interface ReportFilter {
  category?: Category;
  startDate?: Date;
  endDate?: Date;
  keyword?: string;
}