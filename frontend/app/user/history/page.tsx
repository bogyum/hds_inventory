'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Package, Search } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUserInventory, formatCurrency } from '@/lib/hooks/useInventory';
import { Header } from '@/components/common/Header';
import { StatusBadge, getItemStatus } from '@/components/common/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

type FilterStatus = 'all' | 'pending' | 'purchased' | 'distributed' | 'unavailable';

const FILTER_TABS: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: '전체 보기' },
    { value: 'pending', label: '진행 중' },
    { value: 'purchased', label: '구매 완료' },
    { value: 'distributed', label: '배부 완료' },
    { value: 'unavailable', label: '구매 불가' },
];

export default function UserHistoryPage() {
    const { user } = useAuth();
    const { items, loading, error } = useUserInventory(user?.email || '');
    const [filter, setFilter] = useState<FilterStatus>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // 상태 필터 및 검색어 적용 후 최신순 정렬
    const displayItems = useMemo(() => {
        let result = items;

        // 1. 상태 필터 적용
        if (filter === 'pending') {
            result = result.filter(i => !i.isPurchased && !i.isDistributed && !i.isUnavailable);
        } else if (filter === 'purchased') {
            result = result.filter(i => i.isPurchased && !i.isDistributed && !i.isUnavailable);
        } else if (filter === 'distributed') {
            result = result.filter(i => i.isDistributed && !i.isUnavailable);
        } else if (filter === 'unavailable') {
            result = result.filter(i => i.isUnavailable);
        }

        // 2. 검색어 필터 적용
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(i => i.itemName.toLowerCase().includes(q) || i.brand?.toLowerCase().includes(q));
        }

        // 3. 신청일 기준 내림차순 정렬
        return [...result].sort((a, b) => {
            const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt as unknown as string);
            const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt as unknown as string);
            return dateB.getTime() - dateA.getTime();
        });
    }, [items, filter, searchQuery]);

    return (
        <div>
            <Header
                title="신청 내역"
                description="지금까지 내가 신청한 모든 물품 내역을 확인합니다."
            />

            {/* 필터 및 검색 바 */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 mt-6 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex bg-[#F8FAFC] rounded-md p-0.5 gap-0.5 overflow-x-auto">
                    {FILTER_TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setFilter(tab.value)}
                            className={`whitespace-nowrap px-3 py-1.5 text-sm rounded transition-colors font-medium ${filter === tab.value
                                ? 'bg-white text-[#4F46E5] shadow-sm'
                                : 'text-[#64748B] hover:text-[#0F172A]'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 sm:max-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <Input
                        id="history-search"
                        type="text"
                        placeholder="물품명 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                {error ? (
                    <div className="py-12 text-center text-sm text-[#64748B]">{error}</div>
                ) : loading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : displayItems.length === 0 ? (
                    <div className="py-16 text-center">
                        <Package className="w-10 h-10 text-[#E5E7EB] mx-auto mb-3" />
                        <p className="text-sm text-[#64748B]">
                            {searchQuery || filter !== 'all' ? '조건에 맞는 내역이 없습니다.' : '아직 신청한 내역이 없습니다.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* 데스크톱 테이블 뷰 */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">신청 일자</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">물품명</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">브랜드</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">단가</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">수량</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">총액</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">상태</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayItems.map(item => {
                                        const status = getItemStatus(item.isPurchased, item.isDistributed, item.isUnavailable);
                                        const createdDate = item.createdAt?.toDate
                                            ? format(item.createdAt.toDate(), 'yyyy.MM.dd HH:mm', { locale: ko })
                                            : '-';

                                        return (
                                            <tr key={item.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                                                <td className="px-4 py-3 text-xs text-[#64748B]">{createdDate}</td>
                                                <td className="px-4 py-3 font-medium text-[#0F172A]">
                                                    {item.itemName}
                                                    {item.itemUrl && (
                                                        <span className="block mt-0.5">
                                                            <a href={item.itemUrl} target="_blank" rel="noopener noreferrer"
                                                                className="text-xs text-[#4F46E5] hover:underline">
                                                                링크 보기
                                                            </a>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-[#64748B]">{item.brand || '-'}</td>
                                                <td className="px-4 py-3 text-right text-[#0F172A]">{formatCurrency(item.price)}</td>
                                                <td className="px-4 py-3 text-right text-[#0F172A]">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right font-medium text-[#0F172A]">{formatCurrency(item.price * item.quantity)}</td>
                                                <td className="px-4 py-3">
                                                    <StatusBadge status={status} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* 모바일 카드 리스트 뷰 */}
                        <div className="md:hidden flex flex-col divide-y divide-[#E5E7EB]">
                            {displayItems.map(item => {
                                const status = getItemStatus(item.isPurchased, item.isDistributed, item.isUnavailable);
                                const createdDate = item.createdAt?.toDate
                                    ? format(item.createdAt.toDate(), 'yy.MM.dd', { locale: ko })
                                    : '-';

                                return (
                                    <div key={`history-mobile-${item.id}`} className="p-4 bg-white flex flex-col gap-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <StatusBadge status={status} />
                                                    <span className="font-semibold text-[#0F172A] truncate">{item.itemName}</span>
                                                </div>
                                                <div className="text-xs text-[#64748B] flex items-center gap-2 mt-1">
                                                    <span className="truncate max-w-[120px]">{item.brand || '-'}</span>
                                                    <span>•</span>
                                                    <span>{createdDate}</span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="font-semibold text-[#0F172A]">{formatCurrency(item.price * item.quantity)}</div>
                                                <div className="text-xs text-[#64748B] mt-0.5">{formatCurrency(item.price)} × {item.quantity}</div>
                                            </div>
                                        </div>
                                        
                                        {item.itemUrl && (
                                            <div className="pt-2 border-t border-[#F1F5F9]">
                                                <a href={item.itemUrl} target="_blank" rel="noopener noreferrer"
                                                    className="text-xs text-[#4F46E5] hover:underline">
                                                    링크 보기
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
