'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Report } from '@/types/report';
import { Comment } from '@/types/comment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, Trash2, Eye, MessageCircle, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function AdminReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    // 인증 체크
    const auth = sessionStorage.getItem('admin_auth');
    if (auth !== 'true') {
      router.push('/admin');
      return;
    }

    fetchReportAndComments();
  }, [params.id]);

  const fetchReportAndComments = async () => {
    try {
      // 제보 가져오기
      const reportResponse = await fetch(`/api/reports/${params.id}`);
      const reportResult = await reportResponse.json();
      
      if (reportResult.success) {
        setReport(reportResult.data);
      }

      // 댓글 가져오기
      const commentsResponse = await fetch(`/api/reports/${params.id}/comments`);
      const commentsResult = await commentsResponse.json();
      
      if (commentsResult.success) {
        setComments(commentsResult.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!confirm('정말로 이 제보를 삭제하시겠습니까? 관련된 모든 댓글도 함께 삭제됩니다.')) {
      return;
    }

    setDeleteLoading('report');
    try {
      const response = await fetch(`/api/reports/${params.id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      if (result.success) {
        alert('제보가 삭제되었습니다.');
        router.push('/admin');
      } else {
        alert('삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    setDeleteLoading(commentId);
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      if (result.success) {
        setComments(comments.filter(comment => comment.id !== commentId));
        alert('댓글이 삭제되었습니다.');
      } else {
        alert('삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleString('ko-KR');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">제보를 찾을 수 없습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/admin')}
        className="mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        관리자 페이지로 돌아가기
      </Button>

      <Alert className="mb-6">
        <AlertDescription>
          관리자 모드입니다. 삭제 작업은 되돌릴 수 없으니 신중하게 진행해주세요.
        </AlertDescription>
      </Alert>

      {/* 제보 상세 */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Badge variant="secondary" className="mb-2">{report.category}</Badge>
              <CardTitle className="text-2xl">{report.title}</CardTitle>
              <CardDescription className="mt-2">
                작성자: {report.reporter?.nickname || '익명'} | 작성일: {formatDate(report.createdAt)}
              </CardDescription>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteReport}
              disabled={deleteLoading === 'report'}
            >
              {deleteLoading === 'report' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  제보 삭제
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{report.content}</p>
          <div className="flex items-center gap-4 mt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              조회수: {report.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              댓글: {comments.length}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 댓글 관리 */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">댓글 관리 ({comments.length})</h2>
        
        {comments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">댓글이 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-medium text-sm">
                        {comment.nickname || '익명'}
                      </span>
                      <CardDescription className="text-xs mt-1">
                        {formatDate(comment.createdAt)}
                      </CardDescription>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deleteLoading === comment.id}
                    >
                      {deleteLoading === comment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {comment.upvotes}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsDown className="h-3 w-3" />
                      {comment.downvotes}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}