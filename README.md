# IPRF 2025 제보 플랫폼

인천펜타포트락페스티벌 2025에서 발생한 운영 실패와 관객 불편 사례를 수집하는 제보 플랫폼입니다.

## 기능

- ✅ 제보 작성 및 관리
- ✅ 타임라인 기반 제보 목록
- ✅ 카테고리별 필터링
- ✅ 댓글 시스템 (upvote/downvote 포함)
- ✅ 이미지 업로드
- ✅ 관리자 페이지
- ✅ 반응형 디자인 (다크 테마)

## 기술 스택

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: Vercel KV with Upstash Redis (프로덕션), 메모리 스토리지 (개발)
- **File Storage**: Vercel Blob (이미지 저장)
- **Deployment**: Vercel
- **Monorepo**: Turborepo

## 개발 환경 설정

### 1. 저장소 클론

```bash
git clone <repository-url>
cd goodbye-penta
```

### 2. 의존성 설치

```bash
pnpm install
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

앱이 http://localhost:3000에서 실행됩니다.

## Vercel 배포

### 1. Vercel 계정 설정

1. [Vercel](https://vercel.com)에 계정 생성
2. GitHub 저장소 연결

### 2. Vercel Storage 설정

1. Vercel 대시보드에서 프로젝트 선택
2. **Storage** 탭으로 이동
3. **Browse Marketplace** 클릭
4. **KV (Redis)** 선택 후 설치 (데이터 저장용)
5. **Blob** 선택 후 설치 (이미지 저장용)
6. 설치 완료 후 환경 변수가 자동으로 추가됨

**참고**: [Vercel Storage 공식 문서](https://vercel.com/docs/storage)

### 3. 추가 환경 변수 설정

Vercel KV 설치 시 KV 환경 변수는 자동으로 추가됩니다. 추가로 다음 환경 변수를 설정하세요:

```
ADMIN_PASSWORD=your_secure_admin_password
NEXT_PUBLIC_APP_URL=https://your-app-domain.vercel.app
```

**주의**: 
- KV 관련: `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_URL`
- Blob 관련: `BLOB_READ_WRITE_TOKEN`
이 환경 변수들은 Vercel Marketplace에서 각각 설치 시 자동으로 추가됩니다.

### 4. 배포 설정

프로젝트 루트에 있는 `vercel.json` 파일이 자동으로 배포를 구성합니다.

### 5. 배포 실행

```bash
# Vercel CLI 설치 (선택사항)
npm i -g vercel

# 배포
vercel --prod
```

**참고**: 프로젝트는 `@upstash/redis`와 `@vercel/blob` SDK를 사용하여 Vercel Storage와 통합됩니다.

또는 GitHub에 푸시하면 자동으로 배포됩니다.

## 프로젝트 구조

```
goodbye-penta/
├── apps/
│   ├── web/                 # Next.js 앱
│   │   ├── app/            # App Router
│   │   ├── components/     # UI 컴포넌트
│   │   ├── lib/           # 유틸리티 및 DB
│   │   └── types/         # TypeScript 타입
│   └── docs/              # 문서 (사용 안 함)
├── packages/              # 공유 패키지
└── vercel.json           # Vercel 배포 설정
```

## 주요 페이지

- `/` - 홈페이지
- `/report` - 제보 작성
- `/timeline` - 제보 타임라인
- `/report/[id]` - 제보 상세
- `/admin` - 관리자 페이지 (비밀번호: 환경변수 설정)

## 관리자 기능

1. 푸터의 점(.) 클릭 또는 `/admin` 직접 접근
2. 관리자 비밀번호 입력
3. 제보 및 댓글 관리, 통계 확인

## 개발 참고사항

### 데이터베이스

- **개발**: 메모리 스토리지 (서버 재시작 시 초기화)
- **프로덕션**: Vercel KV (영구 저장)

### 이미지 처리

- 클라이언트에서 Vercel Blob으로 업로드
- 공개 URL로 저장 및 제공
- 최대 10MB, 5개 파일까지 지원

### 보안

- 관리자 인증은 간단한 비밀번호 방식
- 프로덕션에서는 더 강력한 인증 시스템 권장

## 라이센스

이 프로젝트는 공익 제보를 위한 비영리 목적으로 제작되었습니다.

## 기여

버그 리포트나 기능 제안은 GitHub Issues를 통해 제출해주세요.