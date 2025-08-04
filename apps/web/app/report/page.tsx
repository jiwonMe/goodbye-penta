'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Category } from '@/types/report';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X } from 'lucide-react';

export default function ReportPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    category: Category.OPERATION_FAILURE,
    content: '',
    occurredAt: '2025-08-01',
    nickname: '',
    contact: '',
  });
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // 최대 5개 파일로 제한
    if (selectedFiles.length + files.length > 5) {
      alert('최대 5개까지만 업로드 가능합니다.');
      return;
    }
    
    // 파일 크기 검증 (10MB)
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name}: 파일 크기는 10MB 이하여야 합니다.`);
        return false;
      }
      return true;
    });
    
    // 미리보기 URL 생성
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    
    setSelectedFiles([...selectedFiles, ...validFiles]);
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
  };
  
  const handleRemoveFile = (index: number) => {
    // 미리보기 URL 정리
    URL.revokeObjectURL(previewUrls[index]);
    
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 이미지를 Vercel Blob에 업로드
      const imageUrls: string[] = [];
      
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const uploadResult = await uploadResponse.json();
        
        if (uploadResult.success) {
          imageUrls.push(uploadResult.data.url);
        } else {
          throw new Error(uploadResult.error || '이미지 업로드 실패');
        }
      }
      
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          content: formData.content,
          occurredAt: formData.occurredAt === 'other' ? new Date('2025-08-04') : new Date(formData.occurredAt),
          images: imageUrls,
          reporter: formData.nickname || formData.contact ? {
            nickname: formData.nickname || undefined,
            contact: formData.contact || undefined,
          } : undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('제보가 성공적으로 접수되었습니다.');
        router.push('/timeline');
      } else {
        throw new Error(result.error || '제보 제출 실패');
      }
    } catch (error) {
      console.error('제보 제출 오류:', error);
      alert('제보 제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">제보하기</CardTitle>
          <CardDescription>
            인천펜타포트락페스티벌 2025에서 발생한 문제를 신고해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="제보 제목을 입력하세요"
              />
            </div>

            {/* 카테고리 */}
            <div className="space-y-2">
              <Label htmlFor="category">카테고리 *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as Category })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Category.OPERATION_FAILURE}>운영 실패</SelectItem>
                  <SelectItem value={Category.SAFETY_ISSUE}>안전 문제</SelectItem>
                  <SelectItem value={Category.FACILITY}>편의시설</SelectItem>
                  <SelectItem value={Category.TRANSPORTATION}>교통</SelectItem>
                  <SelectItem value={Category.OTHER}>기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 발생 날짜 */}
            <div className="space-y-2">
              <Label htmlFor="occurredAt">발생 날짜 *</Label>
              <Select
                value={formData.occurredAt}
                onValueChange={(value) => setFormData({ ...formData, occurredAt: value })}
              >
                <SelectTrigger id="occurredAt">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-08-01">8월 1일 (금요일)</SelectItem>
                  <SelectItem value="2025-08-02">8월 2일 (토요일)</SelectItem>
                  <SelectItem value="2025-08-03">8월 3일 (일요일)</SelectItem>
                  <SelectItem value="other">그 외 (준비/철수 기간 등)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 내용 */}
            <div className="space-y-2">
              <Label htmlFor="content">상세 내용 *</Label>
              <Textarea
                id="content"
                required
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="발생한 문제에 대해 자세히 설명해주세요. 시간, 장소, 상황 등을 구체적으로 작성하면 도움이 됩니다."
              />
            </div>
            
            {/* 이미지 업로드 */}
            <div className="space-y-2">
              <Label htmlFor="images">이미지 첨부 (최대 5개)</Label>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-accent/50 border-muted-foreground/25"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">클릭하여 업로드</span> 또는 드래그 앤 드롭
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF (10MB 이하)</p>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
                
                {/* 미리보기 */}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                          <img
                            src={url}
                            alt={`미리보기 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="absolute top-2 right-2 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="mt-1 text-xs text-muted-foreground truncate">
                          {selectedFiles[index].name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 제보자 정보 (선택사항) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">제보자 정보 (선택사항)</CardTitle>
                <CardDescription>
                  익명으로 제보 가능합니다. 추가 확인이 필요한 경우 연락처를 남겨주시면 도움이 됩니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nickname">닉네임</Label>
                    <Input
                      id="nickname"
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      placeholder="닉네임 (선택)"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact">연락처</Label>
                    <Input
                      id="contact"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="이메일 또는 전화번호 (선택)"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 제출 버튼 */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/')}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isSubmitting ? '제출 중...' : '제보하기'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}