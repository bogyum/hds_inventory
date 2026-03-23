# [PRD] 교내 물품 구매 신청 및 관리 시스템 (bk.inventory)
**버전:** v2.0 | **최종 수정일:** 2026-02-24

---

## 1. 프로젝트 개요

| 항목 | 내용 |
| :--- | :--- |
| **프로젝트명** | bk.inventory |
| **목표** | 교내 교사들이 필요한 소모품을 간편하게 신청하고, 관리자가 이를 실시간으로 확인·관리(구매/배부)할 수 있는 웹 기반 시스템 구축 |
| **핵심 가치** | 수기/엑셀 신청의 번거로움 해소, 신청 상태 투명화, 데이터 기반의 효율적인 물품 관리 |

---

## 2. 사용자 역할 (User Roles)

| 역할 | 설명 |
| :--- | :--- |
| **일반 교사 (User)** | 물품 신청, 본인 신청 내역 조회 및 지급 상태 확인, 신청 수정/취소 |
| **관리자 (Admin)** | 전체 신청 목록 관리, 구매 및 배부 상태 업데이트, 기간별 데이터 조회 및 통계 확인 |

> **역할 부여 방식:** Firebase Auth 계정 생성 후, Firestore의 `users` 컬렉션에서 `role` 필드를 `admin` 또는 `user`로 수동 지정. 초기 관리자 계정은 프로젝트 배포 시 직접 설정.

---

## 3. 핵심 기능 요구사항 (Functional Requirements)

### 3.1. 공통 기능

#### 사용자 인증 (Authentication)
- Firebase Authentication을 통한 로그인 (이메일/비밀번호 또는 Google 소셜 로그인)
- 로그인 상태에 따라 일반 교사 페이지 / 관리자 페이지로 자동 분기
- 비로그인 사용자는 모든 페이지에 접근 불가 (로그인 페이지로 리다이렉트)

---

### 3.2. 일반 교사용 기능

#### 물품 신청 (신청 폼)
사용자가 직접 입력하는 항목:

| 필드 | 필수 여부 | 비고 |
| :--- | :---: | :--- |
| 물품명 | ✅ | |
| 선호 브랜드 | ❌ | 없을 경우 '무관' 처리 |
| 물품 링크 (URL) | ❌ | 유효한 URL 형식 검증 |
| 단가 (원) | ✅ | 숫자만 입력, 자동으로 총액 계산 표시 |
| 수량 | ✅ | 최소 1 이상 정수 |

자동 생성되는 항목: `신청자 이메일`, `신청자 이름`, `신청 일시(서버 타임스탬프)`, `isPurchased: false`, `isDistributed: false`

#### 대시보드
- 상단에 로그인한 사용자 이름 및 요약 카드 표시:
  - 총 신청 건수
  - 지급 완료 건수
  - 미지급 건수
- 본인이 신청한 목록 전체 리스트 (최신순 기본 정렬)
- 각 항목의 상태를 배지(badge)로 시각적 구분:
  - `구매 전` / `구매 완료` / `배부 완료`
- 키워드 검색: 물품명, 브랜드 기준 필터링

#### 신청 수정 및 취소
- `isPurchased: false` 상태인 항목에 한해 수정 및 취소(삭제) 가능
- `isPurchased: true` 상태인 항목은 수정/취소 불가 (UI 상 비활성화 처리 및 안내 문구 표시)

---

### 3.3. 관리자용 기능

#### 전체 현황판
- 모든 교사의 신청 목록을 테이블 형태의 통합 뷰로 제공
- 상단 요약 정보 표시: 전체 신청 건수, 구매 완료 건수, 배부 완료 건수, **해당 기간 총 예상 지출 금액**

#### 상태 관리
- 각 항목별로 `구매 완료(isPurchased)` 체크박스 제공
- **`isDistributed`(배부 완료)는 `isPurchased: true`인 항목에 한해서만 활성화** (구매 전 배부는 논리적으로 불가)
- 상태 변경 시 Firestore 실시간 업데이트

#### 조회 필터링 및 검색
- 기간 필터: 일별, 주별, 월별 선택 (기본값: 이번 주)
- 신청자별 필터 드롭다운
- 물품명 또는 신청자 이름 키워드 검색
- 정렬: 신청일, 신청자명, 상태별 정렬 가능

#### 통계 (기본)
- 현황판 상단의 요약 카드에 해당 필터 기간의 **총 예상 지출 금액**(단가 × 수량 합산) 표시
- 향후 고도화 시 차트 시각화로 확장 (7번 항목 참조)

---

## 4. 기술 스택 (Tech Stack)

### 4.1. Frontend
| 항목 | 선택 |
| :--- | :--- |
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS |
| 컴포넌트 라이브러리 | shadcn/ui (Radix UI 기반) |
| 아이콘 | Lucide React |
| 폰트 | Geist (Next.js 기본) 또는 Inter |

### 4.2. Backend (Firebase)
| 항목 | 선택 |
| :--- | :--- |
| Database | Firebase Cloud Firestore |
| Authentication | Firebase Auth |
| Hosting | Vercel (권장) 또는 Firebase Hosting |

---

## 5. 데이터베이스 구조 (Firestore Schema)

### Collection: `bk.inventory` (물품 신청 데이터)

| 필드명 | 타입 | 설명 |
| :--- | :--- | :--- |
| `id` | string | 고유 문서 ID (Firestore 자동 생성) |
| `userEmail` | string | 신청자 이메일 |
| `userName` | string | 신청자 이름 |
| `itemName` | string | 물품명 |
| `brand` | string | 선호 브랜드 (없을 경우 `"무관"`) |
| `itemUrl` | string | 구매 참조 링크 (없을 경우 `""`) |
| `price` | number | 개별 단가 (원) |
| `quantity` | number | 신청 수량 |
| `isPurchased` | boolean | 구매 완료 여부 (기본값: `false`) |
| `isDistributed` | boolean | 배부 완료 여부 (기본값: `false`, `isPurchased: true`일 때만 활성화) |
| `createdAt` | timestamp | 신청 일시 (Firebase 서버 타임스탬프) |
| `updatedAt` | timestamp | 최종 수정 일시 |

> **상태 전이 규칙:** `isDistributed`는 반드시 `isPurchased: true` 상태에서만 `true`로 변경 가능. 서버 보안 규칙(Firestore Security Rules)으로도 강제 적용.

### Collection: `users` (사용자 권한 관리)

| 필드명 | 타입 | 설명 |
| :--- | :--- | :--- |
| `uid` | string | Firebase Auth UID |
| `email` | string | 사용자 이메일 |
| `name` | string | 사용자 이름 |
| `role` | string | `"admin"` 또는 `"user"` |

---

## 6. UI/UX 디자인 명세

### 6.1. 디자인 방향: Linear-inspired Modern Dashboard

SaaS 및 개발 도구에서 영감을 받은 세련되고 효율적인 인터페이스. 불필요한 장식을 제거하고, 정보 위계와 기능성에 집중하는 스타일.

**키워드:** `Clean`, `Focused`, `Professional`, `High-contrast`, `Minimal-but-sharp`

---

### 6.2. 컬러 시스템

#### 기본 팔레트

| 역할 | 색상 코드 | 용도 |
| :--- | :--- | :--- |
| **Background** | `#FAFAFA` | 전체 페이지 배경 |
| **Surface** | `#FFFFFF` | 카드, 모달, 사이드바 배경 |
| **Border** | `#E5E7EB` | 구분선, 카드 테두리 |
| **Text Primary** | `#0F172A` | 제목, 핵심 텍스트 (Slate-950) |
| **Text Secondary** | `#64748B` | 서브 텍스트, 레이블 (Slate-500) |
| **Text Muted** | `#94A3B8` | 플레이스홀더, 비활성 텍스트 |

#### 포인트 컬러 (Indigo)

| 역할 | 색상 코드 | 용도 |
| :--- | :--- | :--- |
| **Primary** | `#4F46E5` | 주요 버튼, 링크, 활성 탭 (Indigo-600) |
| **Primary Hover** | `#4338CA` | 버튼 호버 상태 (Indigo-700) |
| **Primary Subtle** | `#EEF2FF` | 배지 배경, 선택된 행 하이라이트 (Indigo-50) |
| **Primary Border** | `#C7D2FE` | 인디고 계열 구분선 (Indigo-200) |

#### 상태 컬러

| 상태 | 텍스트 | 배경 | 의미 |
| :--- | :--- | :--- | :--- |
| **배부 완료** | `#15803D` | `#F0FDF4` | Green-700 / Green-50 |
| **구매 완료** | `#1D4ED8` | `#EFF6FF` | Blue-700 / Blue-50 |
| **구매 전 (미지급)** | `#B45309` | `#FFFBEB` | Amber-700 / Amber-50 |

---

### 6.3. 타이포그래피

| 요소 | 크기 | 굵기 | 색상 |
| :--- | :--- | :--- | :--- |
| 페이지 제목 (H1) | 24px / 1.5rem | 700 (Bold) | `#0F172A` |
| 섹션 제목 (H2) | 18px / 1.125rem | 600 (Semibold) | `#0F172A` |
| 카드 제목 | 14px / 0.875rem | 600 (Semibold) | `#0F172A` |
| 본문 | 14px / 0.875rem | 400 (Regular) | `#0F172A` |
| 보조 텍스트 | 13px / 0.8125rem | 400 (Regular) | `#64748B` |
| 레이블 | 12px / 0.75rem | 500 (Medium) | `#64748B` |

폰트 패밀리: `Inter, -apple-system, BlinkMacSystemFont, sans-serif`

---

### 6.4. 컴포넌트 스타일 가이드

#### 버튼

```
[Primary Button]
bg: #4F46E5 | text: white | hover: #4338CA
border-radius: 6px | padding: 8px 16px | font-size: 14px | font-weight: 500
transition: background 150ms ease

[Secondary Button]
bg: white | text: #0F172A | border: 1px solid #E5E7EB | hover: bg #F8FAFC
border-radius: 6px | padding: 8px 16px

[Destructive Button]
bg: white | text: #DC2626 | border: 1px solid #FCA5A5 | hover: bg #FEF2F2
```

#### 입력 필드 (Input)
```
bg: white | border: 1px solid #E5E7EB | border-radius: 6px
padding: 8px 12px | font-size: 14px | color: #0F172A
focus: border #4F46E5, box-shadow: 0 0 0 3px #EEF2FF
placeholder: #94A3B8
```

#### 카드 (Card)
```
bg: white | border: 1px solid #E5E7EB | border-radius: 8px
padding: 20px 24px | box-shadow: 0 1px 3px rgba(0,0,0,0.06)
```

#### 상태 배지 (Status Badge)
```
border-radius: 4px | padding: 2px 8px | font-size: 12px | font-weight: 500
인라인 표시 (display: inline-flex)
```

#### 테이블 (관리자 페이지)
```
헤더: bg #F8FAFC | font-weight: 600 | font-size: 12px | color: #64748B | uppercase
행: border-bottom: 1px solid #F1F5F9 | hover: bg #F8FAFC
선택된 행: bg #EEF2FF
```

---

### 6.5. 레이아웃 구조

#### 공통 레이아웃
```
[Sidebar Navigation] (너비: 220px, 고정)
  - 서비스 로고/이름
  - 메뉴 항목 (아이콘 + 텍스트)
  - 하단: 사용자 프로필 + 로그아웃

[Main Content Area]
  - 상단 헤더: 페이지 제목 + 우측 액션 버튼
  - 콘텐츠 영역
```

#### 모바일 (< 768px)
- Sidebar → 하단 탭 내비게이션으로 전환
- 관리자 테이블 → 카드 리스트 형태로 전환
- 폼 요소 전체 너비(full-width)로 확장

---

### 6.6. 페이지별 UI 상세

#### 로그인 페이지
- 화면 중앙 정렬, 단일 카드 레이아웃 (너비 최대 400px)
- 서비스명 + 이메일/비밀번호 입력 + Google 로그인 버튼
- 배경: `#FAFAFA`

#### 일반 교사 - 대시보드
- 상단: 요약 카드 3개 (총 신청 / 구매 완료 / 배부 완료) — 가로 배치
- 중간: 신청 목록 테이블 (물품명, 브랜드, 단가, 수량, 총액, 상태, 신청일)
- 우측 상단: `+ 신청하기` Primary 버튼

#### 일반 교사 - 신청 폼
- 단일 카드 내 폼 레이아웃
- 필수 항목에 `*` 표시
- 제출 시 총액 미리보기 표시 (단가 × 수량 자동 계산)
- 제출 완료 후 대시보드로 이동 + 성공 토스트 알림

#### 관리자 - 현황판
- 상단: 요약 카드 4개 (전체 / 구매 완료 / 배부 완료 / 총 예상 지출)
- 필터 바: 기간 탭(일/주/월) + 신청자 필터 드롭다운 + 검색창
- 테이블: 신청자, 물품명, 단가, 수량, 총액, 신청일, 구매완료(체크박스), 배부완료(체크박스)

---

### 6.7. 인터랙션 원칙

- **피드백 즉시성:** 체크박스 상태 변경, 폼 제출 등 모든 사용자 액션에 즉각적인 시각 피드백 제공 (로딩 스피너 또는 토스트)
- **에러 처리:** 폼 유효성 오류는 해당 필드 하단에 인라인으로 표시 (빨간 텍스트)
- **비활성 상태:** `isPurchased: true` 이후의 수정 불가 항목은 흐리게 처리하고 커서를 `not-allowed`로 설정
- **반응형:** 모든 주요 기능은 320px 이상의 화면에서 사용 가능

---

## 7. 향후 확장 계획

| 기능 | 설명 |
| :--- | :--- |
| **알림 기능** | 배부 완료 시 신청자에게 이메일 또는 Firebase Cloud Messaging 푸시 알림 |
| **통계 고도화** | 월별 총 지출 비용 추이, 가장 많이 신청된 물품 Top 5 차트 시각화 (Recharts 또는 Chart.js) |
| **엑셀 내보내기** | 관리자가 현황판 데이터를 `.xlsx` 파일로 다운로드 |
| **다크 모드** | Tailwind의 `dark:` 클래스를 활용한 다크 테마 지원 |
