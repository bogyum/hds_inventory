'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Sidebar } from '@/components/common/Sidebar';

export default function UserLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, userProfile, loading, logout } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace('/login');
                return;
            }
            // users 컬렉션에 없는 사용자 또는 admin이 /user에 접근할 경우 처리
            if (userProfile?.role === 'admin') {
                router.replace('/admin/dashboard');
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

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex">
            <Sidebar
                role="user"
                userName={userProfile?.name || user.displayName || '사용자'}
                userEmail={user.email || ''}
                onLogout={logout}
            />
            <main className="flex-1 w-full md:ml-[220px] p-4 md:p-8 pb-20 md:pb-8 max-w-full overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
