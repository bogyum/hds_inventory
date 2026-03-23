'use client';

import { AuthProvider } from '@/lib/hooks/useAuth';

// AuthProvider를 모든 동적 레이아웃에서 사용하기 위한 Client 래퍼
export function Providers({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}
