'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Report, Category } from '@/types/report';
import { Comment } from '@/types/comment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Heart, Share2, Eye, Calendar, User, Loader2, MessageCircle, Send, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [voteStatus, setVoteStatus] = useState<'up' | 'down' | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentNickname, setCommentNickname] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [votedComments, setVotedComments] = useState<{ [key: string]: 'up' | 'down' }>({});

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/reports/${params.id}`);
        const result = await response.json();
        
        if (result.success) {
          setReport(result.data);
          setUpvotes(result.data.upvotes || 0);
          setDownvotes(result.data.downvotes || 0);
        } else {
          setReport(null);
        }
      } catch (error) {
        console.error('Failed to fetch report:', error);
        setReport(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
    fetchComments();
  }, [params.id]);
  
  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/reports/${params.id}/comments`);
      const result = await response.json();
      if (result.success) {
        setComments(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleReportVote = async (voteType: 'up' | 'down') => {
    let action: string;
    
    if (voteStatus === voteType) {
      // 이미 같은 타입으로 투표한 경우 - 취소
      action = voteType === 'up' ? 'removeUpvote' : 'removeDownvote';
    } else if (voteStatus && voteStatus !== voteType) {
      // 다른 타입으로 이미 투표한 경우 - 먼저 취소하고 새로 투표
      const removeAction = voteStatus === 'up' ? 'removeUpvote' : 'removeDownvote';
      await fetch(`/api/reports/${params.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: removeAction }),
      });
      action = voteType === 'up' ? 'upvote' : 'downvote';
    } else {
      // 처음 투표하는 경우
      action = voteType === 'up' ? 'upvote' : 'downvote';
    }
    
    try {
      const response = await fetch(`/api/reports/${params.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      
      const result = await response.json();
      if (result.success) {
        setUpvotes(result.data.upvotes);
        setDownvotes(result.data.downvotes);
        
        // 투표 상태 업데이트
        if (voteStatus === voteType) {
          setVoteStatus(null);
        } else {
          setVoteStatus(voteType);
        }
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      alert('투표 중 오류가 발생했습니다.');
    }
  };
  
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/reports/${params.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          nickname: commentNickname || undefined,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        setComments([result.data, ...comments]);
        setNewComment('');
        setCommentNickname('');
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  const handleCommentVote = async (commentId: string, voteType: 'up' | 'down') => {
    const currentVote = votedComments[commentId];
    let action: string;
    
    if (currentVote === voteType) {
      // 이미 같은 타입으로 투표한 경우 - 취소
      action = voteType === 'up' ? 'removeUpvote' : 'removeDownvote';
    } else if (currentVote && currentVote !== voteType) {
      // 다른 타입으로 이미 투표한 경우 - 먼저 취소하고 새로 투표
      const removeAction = currentVote === 'up' ? 'removeUpvote' : 'removeDownvote';
      await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: removeAction }),
      });
      action = voteType === 'up' ? 'upvote' : 'downvote';
    } else {
      // 처음 투표하는 경우
      action = voteType === 'up' ? 'upvote' : 'downvote';
    }
    
    try {
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      
      const result = await response.json();
      if (result.success) {
        // 댓글 목록 업데이트
        setComments(comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              upvotes: result.data.upvotes,
              downvotes: result.data.downvotes,
            };
          }
          return comment;
        }));
        
        // 투표 상태 업데이트
        if (currentVote === voteType) {
          const newVotedComments = { ...votedComments };
          delete newVotedComments[commentId];
          setVotedComments(newVotedComments);
        } else {
          setVotedComments({ ...votedComments, [commentId]: voteType });
        }
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      alert('투표 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    
    if (month === 8) {
      if (day === 1) return '8월 1일 (금요일)';
      if (day === 2) return '8월 2일 (토요일)';
      if (day === 3) return '8월 3일 (일요일)';
    }
    return '그 외';
  };

  const getCategoryVariant = (category: Category) => {
    switch (category) {
      case Category.OPERATION_FAILURE:
        return 'destructive';
      case Category.SAFETY_ISSUE:
        return 'destructive';
      case Category.FACILITY:
        return 'secondary';
      case Category.TRANSPORTATION:
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">제보를 찾을 수 없습니다.</p>
            <Button asChild variant="outline">
              <Link href="/timeline">타임라인으로 돌아가기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 뒤로가기 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        뒤로가기
      </Button>

      <Card>
        {/* 헤더 */}
        <CardHeader>
          <div className="flex items-start justify-between mb-4">
            <Badge variant={getCategoryVariant(report.category)}>
              {report.category}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{report.viewCount}</span>
            </div>
          </div>
          
          <CardTitle className="text-2xl mb-4">{report.title}</CardTitle>
          
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>발생 날짜: {formatDate(report.occurredAt)}</span>
            </div>
            {report.reporter?.nickname && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>작성자: {report.reporter.nickname}</span>
              </div>
            )}
          </div>
        </CardHeader>

        {/* 본문 */}
        <CardContent>
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-foreground">{report.content}</p>
          </div>

          {/* 이미지 */}
          {report.images && report.images.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.images.map((image, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="aspect-video">
                      <img
                        src={image}
                        alt={`제보 이미지 ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling!.textContent = '이미지를 불러올 수 없습니다';
                        }}
                      />
                      <div className="aspect-video flex items-center justify-center bg-muted text-muted-foreground" style={{display: 'none'}}>
                        이미지 {index + 1}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>

        {/* 액션 버튼 */}
        <CardFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleReportVote('up')}
              variant={voteStatus === 'up' ? 'default' : 'outline'}
              size="sm"
            >
              <ThumbsUp className={`h-4 w-4 mr-1 ${voteStatus === 'up' ? 'fill-current' : ''}`} />
              {upvotes}
            </Button>
            <Button
              onClick={() => handleReportVote('down')}
              variant={voteStatus === 'down' ? 'default' : 'outline'}
              size="sm"
            >
              <ThumbsDown className={`h-4 w-4 mr-1 ${voteStatus === 'down' ? 'fill-current' : ''}`} />
              {downvotes}
            </Button>
          </div>

          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            공유하기
          </Button>
        </CardFooter>
      </Card>

      {/* 댓글 섹션 */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          댓글 ({comments.length})
        </h2>
        
        {/* 댓글 작성 폼 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">닉네임 (선택)</Label>
                <Input
                  id="nickname"
                  placeholder="익명"
                  value={commentNickname}
                  onChange={(e) => setCommentNickname(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">댓글</Label>
                <Textarea
                  id="comment"
                  placeholder="댓글을 작성해주세요"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  required
                />
              </div>
              <Button 
                type="submit" 
                disabled={isSubmittingComment || !newComment.trim()}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmittingComment ? '작성 중...' : '댓글 작성'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* 댓글 목록 */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">첫 댓글을 작성해주세요</p>
              </CardContent>
            </Card>
          ) : (
            comments.map((comment) => (
              <Card key={comment.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {comment.nickname || '익명'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                </CardContent>
                <CardFooter className="pt-3">
                  <div className="flex items-center gap-4">
                    <Button
                      size="sm"
                      variant={votedComments[comment.id] === 'up' ? 'default' : 'outline'}
                      onClick={() => handleCommentVote(comment.id, 'up')}
                      className="h-8"
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {comment.upvotes}
                    </Button>
                    <Button
                      size="sm"
                      variant={votedComments[comment.id] === 'down' ? 'default' : 'outline'}
                      onClick={() => handleCommentVote(comment.id, 'down')}
                      className="h-8"
                    >
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      {comment.downvotes}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* 관련 제보 추천 (추후 구현) */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-foreground mb-4">
          비슷한 제보
        </h2>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              준비 중입니다
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}