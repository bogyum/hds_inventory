# bk.inventory

**교내 물품 구매 신청 및 관리 시스템**

교내 교사들이 필요한 소모품을 간편하게 신청하고, 관리자가 이를 실시간으로 확인·관리(구매/배부)할 수 있는 웹 기반 시스템.

## 기술 스택

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Firebase (Firestore + Authentication)
- **Hosting**: Vercel

## 폴더 구조

```
Inventory/
├── frontend/    # Next.js 프론트엔드
├── backend/     # Firebase 설정 파일
├── PRD.bk.inventory.md
└── IMPLEMENTATION_PLAN.md
```

## 개발 시작

```bash
# 프론트엔드 실행
cd frontend
npm run dev
```

## 사용자 역할

- **일반 교사 (User)**: 물품 신청, 본인 신청 내역 조회 및 수정/취소
- **관리자 (Admin)**: 전체 신청 목록 관리, 구매/배부 상태 업데이트
