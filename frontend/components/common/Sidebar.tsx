'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    PlusCircle,
    History,
    LogOut,
    Package,
    ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
    role?: 'user' | 'admin';
    userName?: string;
    userEmail?: string;
    onLogout?: () => void;
}

const userNavItems: NavItem[] = [
    { href: '/user/dashboard', label: '내 신청 현황', icon: LayoutDashboard },
    { href: '/user/request', label: '물품 신청', icon: PlusCircle },
    { href: '/user/history', label: '신청 내역', icon: History },
];

const adminNavItems: NavItem[] = [
    { href: '/admin/dashboard', label: '전체 현황판', icon: LayoutDashboard },
];

export function Sidebar({ role = 'user', userName, userEmail, onLogout }: SidebarProps) {
    const pathname = usePathname();
    const navItems = role === 'admin' ? adminNavItems : userNavItems;

    return (
        <>
            {/* 데스크톱 사이드바 (md 이상에서만 보임) */}
            <aside
                className="hidden md:flex fixed left-0 top-0 h-full w-[220px] bg-white border-r border-[#E5E7EB] flex-col z-30"
                aria-label="데스크톱 네비게이션"
            >
                {/* 로고 영역 */}
                <div className="px-5 py-5 border-b border-[#E5E7EB]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-[#4F46E5] flex items-center justify-center">
                            <Package className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <span className="text-sm font-semibold text-[#0F172A]">bk.inventory</span>
                            {role === 'admin' && (
                                <div className="flex items-center gap-1 mt-0.5">
                                    <ShieldCheck className="w-3 h-3 text-[#4F46E5]" />
                                    <span className="text-[11px] text-[#4F46E5] font-medium">관리자</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 네비게이션 메뉴 */}
                <nav className="flex-1 px-3 py-4" role="navigation">
                    <ul className="space-y-0.5">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            const Icon = item.icon;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150',
                                            isActive
                                                ? 'bg-[#EEF2FF] text-[#4F46E5]'
                                                : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                                        )}
                                        aria-current={isActive ? 'page' : undefined}
                                    >
                                        <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-[#4F46E5]' : 'text-[#94A3B8]')} />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* 사용자 프로필 + 로그아웃 */}
                <div className="px-3 py-4 border-t border-[#E5E7EB]">
                    {(userName || userEmail) && (
                        <div className="px-3 py-2 mb-1">
                            {userName && (
                                <p className="text-sm font-medium text-[#0F172A] truncate">{userName}</p>
                            )}
                            {userEmail && (
                                <p className="text-xs text-[#94A3B8] truncate">{userEmail}</p>
                            )}
                        </div>
                    )}
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#DC2626] transition-colors duration-150"
                        id="sidebar-logout-btn"
                    >
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        로그아웃
                    </button>
                </div>
            </aside>

            {/* 모바일 하단 탭 네비게이션 (md 미만에서만 보임) */}
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-white border-t border-[#E5E7EB] z-50 flex items-center justify-around px-2 pb-safe shadow-[0_-1px_3px_rgba(0,0,0,0.05)]"
                aria-label="모바일 하단 네비게이션"
            >
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-150',
                                isActive ? 'text-[#4F46E5]' : 'text-[#64748B] hover:text-[#0F172A]'
                            )}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <Icon className={cn('w-[22px] h-[22px] flex-shrink-0', isActive ? 'text-[#4F46E5]' : 'text-[#94A3B8]')} />
                            <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
                        </Link>
                    );
                })}
                <button
                    onClick={onLogout}
                    className="flex flex-col items-center justify-center w-full h-full gap-1 text-[#64748B] hover:text-[#DC2626] transition-colors duration-150"
                    id="mobile-logout-btn"
                >
                    <LogOut className="w-[22px] h-[22px] flex-shrink-0 text-[#94A3B8] group-hover:text-[#DC2626]" />
                    <span className="text-[10px] font-medium mt-0.5">로그아웃</span>
                </button>
            </nav>
        </>
    );
}
