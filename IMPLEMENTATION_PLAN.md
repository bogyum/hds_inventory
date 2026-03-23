# bk.inventory 프로젝트 구현 단계

**작성일:** 2026-02-24
**참조 문서:** PRD.bk.inventory.md

---

## 📁 권장 폴더 구조

```
/home/bogyum/Projects/Inventory/
├── frontend/                    # Next.js 프론트엔드
│   ├── app/
│   │   ├── (auth)/             # 인증 관련 페이지
│   │   │   └── login/
│   │   ├── user/               # 일반 교사용 페이지
│   │   │   ├── dashboard/
│   │   │   ├── request/
│   │   │   └── history/
│   │   ├── admin/              # 관리자용 페이지
│   │   │   ├── dashboard/
│   │   │   └── analytics/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 컴포넌트
│   │   ├── common/             # 공통 컴포넌트
│   │   ├── user/               # 사용자 전용 컴포넌트
│   │   └── admin/              # 관리자 전용 컴포넌트
│   ├── lib/
│   │   ├── firebase.ts         # Firebase 클라이언트 초기화
│   │   ├── hooks/              # Custom React Hooks
│   │   └── utils.ts
│   └── public/
│
└── backend/                     # Firebase 설정 및 서버사이드
    ├── firestore.rules          # Firestore 보안 규칙
    ├── firestore.indexes.json   # 인덱스 설정
    ├── firebase.json            # Firebase 프로젝트 설정
    └── functions/               # Cloud Functions (필요시)
```

---

## 🔄 구현 단계 (총 20단계)

### **Phase 1: 프로젝트 기반 구축 (1-6단계)**

#### 1. 프로젝트 폴더 구조 생성 및 초기화
**작업 내용:**
- `frontend/`, `backend/` 폴더 생성
- 기본 디렉토리 구조 설정
- README.md 및 .gitignore 작성

**산출물:**
- 폴더 구조
- 기본 문서 파일

---

#### 2. Frontend - Next.js 프로젝트 초기화 및 기본 패키지 설치
**작업 내용:**
- `npx create-next-app@latest frontend` 실행
  - App Router 사용
  - TypeScript 활성화
  - ESLint 설정
- 필수 패키지 설치:
  - `firebase` (Firebase SDK)
  - `lucide-react` (아이콘)
  - `date-fns` (날짜 포맷팅)
  - `clsx`, `tailwind-merge` (유틸리티)

**산출물:**
- `frontend/package.json`
- Next.js 기본 구조

---

#### 3. Frontend - Tailwind CSS 및 shadcn/ui 설정
**작업 내용:**
- Tailwind CSS 설치 및 구성
- `tailwind.config.ts`에 PRD 컬러 시스템 적용:
  - Background: `#FAFAFA`
  - Primary: Indigo-600 (`#4F46E5`)
  - 상태 컬러 (Green, Blue, Amber)
- shadcn/ui 초기화: `npx shadcn-ui@latest init`
- 필수 컴포넌트 설치:
  - Button, Input, Card, Badge, Table, Select, Checkbox, Toast

**산출물:**
- `tailwind.config.ts`
- `components/ui/` 폴더

---

#### 4. Backend - Firebase 프로젝트 설정 파일 및 초기화 코드 작성
**작업 내용:**
- Firebase 콘솔에서 프로젝트 생성 (bk-inventory)
- Authentication 활성화 (Email/Password, Google)
- Firestore Database 생성 (프로덕션 모드)
- Firebase 설정 정보를 `.env.local`에 저장:
  ```
  NEXT_PUBLIC_FIREBASE_API_KEY=
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
  NEXT_PUBLIC_FIREBASE_APP_ID=
  ```
- `backend/firebase.json` 작성

**산출물:**
- `.env.local`
- `backend/firebase.json`

---

#### 5. Backend - Firestore 데이터베이스 스키마 설계 및 보안 규칙 작성
**작업 내용:**
- `backend/firestore.rules` 작성:
  - `bk.inventory` 컬렉션 규칙:
    - 읽기: 본인 데이터 또는 관리자만
    - 쓰기: 본인만 (관리자는 모든 데이터)
    - `isDistributed`는 `isPurchased: true`일 때만 `true` 가능
  - `users` 컬렉션 규칙:
    - 읽기: 본인 데이터만
    - 쓰기: 관리자만
- `backend/firestore.indexes.json` 작성 (복합 쿼리용)

**산출물:**
- `backend/firestore.rules`
- `backend/firestore.indexes.json`

---

#### 6. Frontend - 공통 컴포넌트 작성 (Layout, Sidebar, Navigation)
**작업 내용:**
- `components/common/Sidebar.tsx`: 좌측 네비게이션 (220px 고정)
- `components/common/Header.tsx`: 상단 헤더
- `components/common/StatusBadge.tsx`: 상태 배지 컴포넌트
- `components/common/SummaryCard.tsx`: 요약 카드 컴포넌트
- `app/layout.tsx`: 전역 레이아웃 적용

**산출물:**
- 공통 컴포넌트 4개
- 레이아웃 구조

---

### **Phase 2: 인증 및 권한 시스템 (7-8단계)**

#### 7. Frontend - 인증 시스템 구현 (Firebase Auth 통합, 로그인 페이지)
**작업 내용:**
- `lib/firebase.ts`: Firebase 클라이언트 초기화
- `lib/hooks/useAuth.ts`: 인증 상태 관리 Hook
- `app/(auth)/login/page.tsx`: 로그인 페이지
  - 이메일/비밀번호 로그인 폼
  - Google 소셜 로그인 버튼
  - 중앙 정렬 카드 레이아웃 (최대 400px)
- Context API로 전역 인증 상태 관리

**산출물:**
- `lib/firebase.ts`
- `lib/hooks/useAuth.ts`
- 로그인 페이지

---

#### 8. Frontend - 역할 기반 라우팅 및 권한 체크 미들웨어 구현
**작업 내용:**
- `middleware.ts`: 인증 및 역할 체크
  - 비로그인 → `/login` 리다이렉트
  - `role: "user"` → `/user` 접근 허용
  - `role: "admin"` → `/admin` 접근 허용
- `lib/hooks/useRole.ts`: 역할 확인 Hook
- Protected Route 컴포넌트 작성

**산출물:**
- `middleware.ts`
- 역할 기반 라우팅 로직

---

### **Phase 3: 일반 교사 기능 (9-11단계)**

#### 9. Frontend/User - 일반 교사 대시보드 페이지 구현
**작업 내용:**
- `app/user/dashboard/page.tsx`:
  - 상단 요약 카드 3개 (총 신청/구매 완료/배부 완료)
  - 본인 신청 목록 테이블 (물품명, 브랜드, 단가, 수량, 총액, 상태, 신청일)
  - 키워드 검색 기능 (물품명, 브랜드)
  - 우측 상단 `+ 신청하기` 버튼
- Firestore에서 본인 데이터만 조회 (`userEmail` 필터)

**산출물:**
- `app/user/dashboard/page.tsx`
- 사용자 대시보드 UI

---

#### 10. Frontend/User - 물품 신청 폼 페이지 구현
**작업 내용:**
- `app/user/request/page.tsx`:
  - 입력 필드: 물품명(*), 선호 브랜드, 물품 링크, 단가(*), 수량(*)
  - URL 유효성 검증
  - 총액 자동 계산 미리보기 (단가 × 수량)
  - 제출 시 Firestore에 저장:
    - 자동 필드: `userEmail`, `userName`, `createdAt`, `isPurchased: false`, `isDistributed: false`
  - 제출 완료 후 대시보드로 이동 + Toast 알림

**산출물:**
- `app/user/request/page.tsx`
- 신청 폼 로직

---

#### 11. Frontend/User - 신청 내역 수정 및 취소 기능 구현
**작업 내용:**
- 대시보드 테이블에 수정/삭제 버튼 추가
- 조건부 활성화: `isPurchased: false`인 항목만 가능
- `isPurchased: true`인 항목:
  - 버튼 비활성화 (`cursor: not-allowed`)
  - 안내 문구 표시 ("구매 완료된 항목은 수정할 수 없습니다")
- 수정 모달 또는 페이지 구현
- 삭제 시 확인 다이얼로그

**산출물:**
- 수정/삭제 기능
- 조건부 UI

---

### **Phase 4: 관리자 기능 (12-15단계)**

#### 12. Frontend/Admin - 관리자 전체 현황판 페이지 구현
**작업 내용:**
- `app/admin/dashboard/page.tsx`:
  - 상단 요약 카드 4개:
    - 전체 신청 건수
    - 구매 완료 건수
    - 배부 완료 건수
    - 총 예상 지출 금액 (단가 × 수량 합산)
  - 전체 신청 목록 테이블:
    - 컬럼: 신청자, 물품명, 브랜드, 단가, 수량, 총액, 신청일, 구매완료, 배부완료
- Firestore에서 전체 데이터 조회

**산출물:**
- `app/admin/dashboard/page.tsx`
- 관리자 대시보드 UI

---

#### 13. Frontend/Admin - 구매/배부 상태 관리 기능 구현
**작업 내용:**
- 테이블 각 행에 체크박스 2개:
  - `isPurchased` 체크박스 (항상 활성화)
  - `isDistributed` 체크박스 (`isPurchased: true`일 때만 활성화)
- 체크박스 변경 시 Firestore 실시간 업데이트
- 낙관적 UI 업데이트 (Optimistic Update)
- 에러 시 롤백 처리

**산출물:**
- 상태 관리 로직
- 체크박스 UI

---

#### 14. Frontend/Admin - 필터링 및 검색 기능 구현 (기간별, 신청자별, 키워드)
**작업 내용:**
- 필터 바 구현:
  - 기간 필터 탭 (일/주/월) - 기본값: 이번 주
  - 신청자 드롭다운 (전체 신청자 목록)
  - 키워드 검색창 (물품명 또는 신청자 이름)
- Firestore 쿼리 최적화:
  - 기간 필터: `createdAt` 범위 쿼리
  - 클라이언트 사이드 필터링 (신청자, 키워드)
- 정렬 기능: 신청일, 신청자명, 상태별

**산출물:**
- 필터링 UI
- 검색 로직

---

#### 15. Frontend/Admin - 통계 및 요약 카드 구현 (총 예상 지출 포함)
**작업 내용:**
- 요약 카드 데이터 집계:
  - 필터 적용된 데이터 기준
  - 총 예상 지출 계산: `Σ(단가 × 수량)`
  - 구매 완료율, 배부 완료율 계산
- 실시간 업데이트 (Firestore 리스너)
- 숫자 포맷팅 (천 단위 쉼표)

**산출물:**
- 통계 집계 로직
- 요약 카드 컴포넌트

---

### **Phase 5: 마무리 및 배포 (16-20단계)**

#### 16. Frontend - 반응형 디자인 적용 (모바일 대응)
**작업 내용:**
- 모바일 브레이크포인트 (<768px) 처리:
  - Sidebar → 하단 탭 네비게이션으로 전환
  - 테이블 → 카드 리스트 형태로 전환
  - 폼 요소 전체 너비(full-width) 확장
- Tailwind의 `sm:`, `md:`, `lg:` 반응형 클래스 활용
- 모바일 터치 제스처 최적화

**산출물:**
- 반응형 컴포넌트
- 모바일 최적화

---

#### 17. Frontend - 에러 핸들링 및 로딩 상태 UI 구현
**작업 내용:**
- Toast 알림 시스템 (shadcn/ui Toast)
  - 성공 메시지 (녹색)
  - 에러 메시지 (빨간색)
  - 정보 메시지 (파란색)
- Skeleton 로딩 컴포넌트:
  - 테이블 로딩 스켈레톤
  - 카드 로딩 스켈레톤
- 폼 유효성 검증:
  - 필수 항목 체크
  - URL 형식 검증
  - 숫자 범위 검증
  - 인라인 에러 표시 (필드 하단 빨간 텍스트)

**산출물:**
- 에러 핸들링 로직
- 로딩 UI 컴포넌트

---

#### 18. 테스트 및 버그 수정 (전체 기능 테스트)
**작업 내용:**
- 기능 테스트 체크리스트:
  - [ ] 로그인/로그아웃
  - [ ] 역할 기반 접근 제어
  - [ ] 일반 교사: 신청/수정/취소
  - [ ] 관리자: 상태 업데이트
  - [ ] 필터링 및 검색
  - [ ] 반응형 디자인
- 크로스 브라우저 테스트 (Chrome, Safari, Firefox)
- 모바일 실기기 테스트
- 발견된 버그 수정

**산출물:**
- 테스트 리포트
- 버그 수정 커밋

---

#### 19. 환경 변수 설정 및 배포 준비 (Vercel)
**작업 내용:**
- Vercel 프로젝트 생성 및 연결
- 환경 변수 등록:
  - Firebase 설정 (NEXT_PUBLIC_*)
- 빌드 테스트: `npm run build`
- 배포 스크립트 확인
- Firebase Firestore 인덱스 배포:
  ```bash
  firebase deploy --only firestore:rules
  firebase deploy --only firestore:indexes
  ```

**산출물:**
- Vercel 프로젝트 설정
- 환경 변수 등록

---

#### 20. 프로덕션 배포 및 초기 관리자 계정 설정
**작업 내용:**
- Vercel 프로덕션 배포: `vercel --prod`
- Firebase 콘솔에서 초기 관리자 계정 생성:
  1. Authentication에서 이메일/비밀번호 계정 생성
  2. Firestore `users` 컬렉션에 문서 추가:
     ```json
     {
       "uid": "<Firebase Auth UID>",
       "email": "admin@example.com",
       "name": "관리자",
       "role": "admin"
     }
     ```
- 배포된 앱 접속 및 최종 확인
- 사용자 매뉴얼 작성 (선택 사항)

**산출물:**
- 프로덕션 배포 완료
- 관리자 계정 설정
- 배포 URL

---

## 📊 진행 상황 체크리스트

- [ ] Phase 1: 프로젝트 기반 구축 (1-6단계)
- [ ] Phase 2: 인증 및 권한 시스템 (7-8단계)
- [ ] Phase 3: 일반 교사 기능 (9-11단계)
- [ ] Phase 4: 관리자 기능 (12-15단계)
- [ ] Phase 5: 마무리 및 배포 (16-20단계)

---

## 🚀 다음 단계

현재 단계: **1단계 - 프로젝트 폴더 구조 생성 및 초기화**

진행을 시작하려면 다음 명령을 실행하세요:
```bash
cd /home/bogyum/Projects/Inventory
mkdir -p frontend backend
```
