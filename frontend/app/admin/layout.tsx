'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Sidebar } from '@/components/common/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, userProfile, loading, logout } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace('/login');
                return;
            }
            // admin이 아닌 사용자가 /admin에 접근하면 user 대시보드로 이동
            if (userProfile && userProfile.role !== 'admin') {
                router.replace('/user/dashboard');
            }
        }
    }, [user, userProfile, loading, router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (userProfile && userProfile.role !== 'admin') {
        return null; // 리다이렉트 중 공백 렌더
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex">
            <Sidebar
                role="admin"
                userName={userProfile?.name || user.displayName || '관리자'}
                userEmail={user.email || ''}
                onLogout={logout}
            />
            <main className="flex-1 w-full md:ml-[220px] p-4 md:p-8 pb-20 md:pb-8 max-w-full overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
