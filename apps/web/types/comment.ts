export interface Comment {
  id: string;
  reportId: string;
  content: string;
  nickname?: string;
  createdAt: Date;
  updatedAt: Date;
  upvotes: number;
  downvotes: number;
}

export interface CreateCommentInput {
  reportId: string;
  content: string;
  nickname?: string;
}