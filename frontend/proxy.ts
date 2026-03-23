import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 미들웨어는 Firebase Admin SDK 없이 쿠키/세션 기반으로 동작
// 실제 역할 검증은 클라이언트 사이드 AuthProvider에서 처리
// 미들웨어는 기본 인증 여부만 체크 (Firebase 세션 쿠키 활용 또는 클라이언트 리다이렉트)

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 공개 경로 (로그인 페이지)
    const publicPaths = ['/login'];
    if (publicPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // 루트 경로 → 로그인으로 리다이렉트
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 클라이언트 사이드 인증이 메인 보호 수단
    // Next.js 미들웨어에서 Firebase Auth 토큰 검증은 엣지 런타임 제약이 있어
    // 클라이언트 레벨의 ProtectedLayout 컴포넌트가 실제 보호를 담당합니다.
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/).*)',
    ],
};
