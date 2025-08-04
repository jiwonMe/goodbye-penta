import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Shield, Building2, Car } from "lucide-react";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          인천펜타포트락페스티벌 2025
          <br />
          <span className="text-destructive">제보 플랫폼</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          IPRF 2025에서 발생한 운영 실패와 관객 불편 사례를 수집합니다
        </p>
        <Button asChild size="lg" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          <Link href="/report">
            제보하기
          </Link>
        </Button>
      </div>

      {/* 주요 카테고리 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader>
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <CardTitle>운영 실패</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              입장 지연, 티켓 오류, 현장 운영 문제
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Shield className="h-8 w-8 text-orange-500 mb-2" />
            <CardTitle>안전 문제</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              안전 관리 미흡, 위험 상황 발생
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Building2 className="h-8 w-8 text-blue-500 mb-2" />
            <CardTitle>편의시설</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              화장실, 식음료, 휴게 공간 문제
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Car className="h-8 w-8 text-green-500 mb-2" />
            <CardTitle>교통</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              셔틀버스, 주차, 대중교통 문제
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* 안내 사항 */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 mb-8">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              본 플랫폼은 공익 제보를 위한 비영리 목적으로 운영됩니다. 
              수집된 정보는 관련 기관에 제출되어 향후 개선을 위한 자료로 활용됩니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          페스티벌에서 불편을 겪으셨나요?
        </h2>
        <p className="text-muted-foreground mb-6">
          여러분의 경험을 공유해주세요. 함께 더 나은 페스티벌을 만들어갑니다.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            <Link href="/report">
              제보하기
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/timeline">
              타임라인 보기
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}