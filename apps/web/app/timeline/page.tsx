'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Report, Category } from '@/types/report';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Heart, Eye, Loader2, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function TimelinePage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('/api/reports?page=1&pageSize=20');
        const result = await response.json();
        
        if (result.success) {
          setReports(result.data.items);
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const filteredReports = reports.filter(report => {
    const categoryMatch = selectedCategory === 'all' || report.category === selectedCategory;
    const keywordMatch = !searchKeyword || 
      report.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      report.content.toLowerCase().includes(searchKeyword.toLowerCase());
    
    return categoryMatch && keywordMatch;
  });

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">
        제보 타임라인
      </h1>

      {/* 필터 및 검색 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="검색어를 입력하세요"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <div className="w-full md:w-auto">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 카테고리</SelectItem>
                  <SelectItem value={Category.OPERATION_FAILURE}>운영 실패</SelectItem>
                  <SelectItem value={Category.SAFETY_ISSUE}>안전 문제</SelectItem>
                  <SelectItem value={Category.FACILITY}>편의시설</SelectItem>
                  <SelectItem value={Category.TRANSPORTATION}>교통</SelectItem>
                  <SelectItem value={Category.OTHER}>기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 제보 목록 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredReports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">제보가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <Card key={report.id} className="hover:bg-accent/50 transition-colors">
              <Link href={`/report/${report.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={getCategoryVariant(report.category)}>
                      {report.category}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(report.occurredAt)}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{report.title}</CardTitle>
                </CardHeader>
                
                <CardContent>
                  <CardDescription className="line-clamp-3">
                    {report.content}
                  </CardDescription>
                </CardContent>
                
                <CardFooter className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {report.reporter?.nickname && (
                      <span>작성자: {report.reporter.nickname}</span>
                    )}
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{report.viewCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{report.commentCount || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{report.upvotes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsDown className="h-4 w-4" />
                      <span>{report.downvotes || 0}</span>
                    </div>
                  </div>
                </CardFooter>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {/* 더 보기 버튼 (추후 무한 스크롤로 변경) */}
      {!loading && filteredReports.length > 0 && (
        <div className="text-center mt-8">
          <Button variant="outline">
            더 보기
          </Button>
        </div>
      )}
    </div>
  );
}