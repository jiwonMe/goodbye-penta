import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "펜타포트 락 페스티벌 2025 제보 플랫폼",
  description: "인천펜타포트락페스티벌 2025에서 발생한 운영 실패와 관객 불편 사례를 수집합니다",
  keywords: ["펜타포트", "락페스티벌", "인천", "2025", "제보", "불편사례"],
  openGraph: {
    title: "펜타포트 락 페스티벌 2025 제보 플랫폼",
    description: "인천펜타포트락페스티벌 2025에서 발생한 운영 실패와 관객 불편 사례를 수집합니다",
    type: "website",
  },
};

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen bg-background">
        <header className="border-b">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="text-xl font-bold text-foreground">
                  IPRF 2025 제보
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <Button asChild variant="ghost">
                  <Link href="/timeline">
                    타임라인
                  </Link>
                </Button>
                <Button asChild className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  <Link href="/report">
                    제보하기
                  </Link>
                </Button>
              </div>
            </div>
          </nav>
        </header>
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t mt-auto">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-muted-foreground text-sm">
              © 2025 IPRF 2025 제보 플랫폼. 본 사이트는 공익 제보를 위한 비영리 목적으로 운영됩니다.
            </p>
            {/* 관리자 페이지 숨겨진 링크 */}
            <div className="text-center mt-4">
              <Link href="/admin" className="text-xs text-muted-foreground/50 hover:text-muted-foreground">
                .
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
