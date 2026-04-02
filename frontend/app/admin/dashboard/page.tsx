'use client';

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Search, ShoppingCart, CheckCircle, Package, TrendingUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore';
import { useAdminInventory, updateItemStatus, deleteInventoryItem, formatCurrency } from '@/lib/hooks/useInventory';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/common/Header';
import { SummaryCard } from '@/components/common/SummaryCard';
import { StatusBadge, getItemStatus } from '@/components/common/StatusBadge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryItem } from '@/lib/types';

type PeriodType = 'month' | 'lastMonth' | 'all';

function getPeriodRange(period: PeriodType): { start: Date; end: Date } {
    const now = new Date();
    switch (period) {
        case 'month':
            return { start: startOfMonth(now), end: endOfMonth(now) };
        case 'lastMonth':
            const lastMonthDate = subMonths(now, 1);
            return { start: startOfMonth(lastMonthDate), end: endOfMonth(lastMonthDate) };
        case 'all':
            return { start: new Date(0), end: new Date('2099-12-31') };
    }
}

export default function AdminDashboardPage() {
    const { items, loading, error } = useAdminInventory();

    const [period, setPeriod] = useState<PeriodType>('month');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<string>('all');
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteItem, setConfirmDeleteItem] = useState<{ id: string; itemName: string; userName: string } | null>(null);

    // 기간 필터
    const { start, end } = getPeriodRange(period);
    const periodFiltered = useMemo(() => items.filter(item => {
        if (!item.createdAt) return false;
        const date = item.createdAt instanceof Timestamp
            ? item.createdAt.toDate()
            : new Date(item.createdAt as unknown as string);
        return date >= start && date <= end;
    }), [items, period]); // eslint-disable-line react-hooks/exhaustive-deps

    // 전체 신청자 목록
    const allUsers = useMemo(() => {
        const map = new Map<string, string>();
        items.forEach(i => { if (i.userEmail) map.set(i.userEmail, i.userName); });
        return Array.from(map.entries()).map(([email, name]) => ({ email, name }));
    }, [items]);

    // 신청자 + 키워드 필터
    const filteredItems = useMemo(() => {
        return periodFiltered.filter(item => {
            const matchUser = selectedUser === 'all' || item.userEmail === selectedUser;
            const q = searchQuery.toLowerCase();
            const matchSearch = !q || item.itemName.toLowerCase().includes(q) || item.userName.toLowerCase().includes(q);
            return matchUser && matchSearch;
        });
    }, [periodFiltered, selectedUser, searchQuery]);

    const tableItems = useMemo(() => filteredItems.filter(i => !i.isDistributed), [filteredItems]);

    // 요약 통계 (필터 적용된 데이터 기준)
    const stats = useMemo(() => {
        const purchasedItems = filteredItems.filter(i => i.isPurchased && !i.isUnavailable);
        return {
            total: filteredItems.length,
            purchased: purchasedItems.length,
            distributed: filteredItems.filter(i => i.isDistributed && !i.isUnavailable).length,
            unavailable: filteredItems.filter(i => i.isUnavailable).length,
            totalAmount: filteredItems.reduce((sum, i) => sum + (i.isUnavailable ? 0 : (i.price * i.quantity)), 0),
            purchasedAmount: purchasedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0),
        };
    }, [filteredItems]);

    const handleStatusChange = async (
        item: InventoryItem,
        field: 'isPurchased' | 'isDistributed' | 'isUnavailable',
        checked: boolean
    ) => {
        // 구매불가 상태일 때는 구매/배부 처리 불가
        if (item.isUnavailable && field !== 'isUnavailable') {
            toast.error('구매 불가 처리된 항목입니다.');
            return;
        }

        // isDistributed는 isPurchased가 true일 때만 가능
        if (field === 'isDistributed' && !item.isPurchased && checked) {
            toast.error('구매 완료 후에만 배부 완료 처리가 가능합니다.');
            return;
        }

        const updates: { isPurchased?: boolean; isDistributed?: boolean; isUnavailable?: boolean } = { [field]: checked };
        
        if (field === 'isPurchased' && !checked) {
            updates.isDistributed = false;
        }

        // 구매불가(isUnavailable)를 true로 하면 나머지 상태 초기화
        if (field === 'isUnavailable' && checked) {
            updates.isPurchased = false;
            updates.isDistributed = false;
        }

        setUpdatingIds(prev => new Set(prev).add(item.id));
        try {
            await updateItemStatus(item.id, updates);
        } catch (e) {
            console.error(e);
            toast.error('상태 업데이트 중 오류가 발생했습니다.');
        } finally {
            setUpdatingIds(prev => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
            });
        }
    };

    const handleDeleteRequest = async () => {
        if (!confirmDeleteItem) return;
        setDeletingId(confirmDeleteItem.id);
        setConfirmDeleteItem(null);
        try {
            await deleteInventoryItem(confirmDeleteItem.id);
            toast.success('신청 항목이 삭제되었습니다.');
        } catch (e) {
            console.error(e);
            toast.error('삭제 중 오류가 발생했습니다.');
        } finally {
            setDeletingId(null);
        }
    };

    const PERIOD_TABS: { value: PeriodType; label: string }[] = [
        { value: 'month', label: '이번 달' },
        { value: 'lastMonth', label: '지난 달' },
        { value: 'all', label: '전체' },
    ];

    return (
        <div>
            <Header
                title="전체 현황판"
                description="모든 교사의 물품 신청 현황을 관리하세요."
            />

            {/* 요약 카드 */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <SummaryCard title="전체 신청" value={stats.total} icon={Package} />
                <SummaryCard
                    title="구매 완료"
                    value={stats.purchased}
                    icon={ShoppingCart}
                    iconColor="text-[#1D4ED8]"
                    iconBg="bg-[#EFF6FF]"
                />
                <SummaryCard
                    title="배부 완료"
                    value={stats.distributed}
                    icon={CheckCircle}
                    iconColor="text-[#15803D]"
                    iconBg="bg-[#F0FDF4]"
                />
                <SummaryCard
                    title="총 예상 지출"
                    value={formatCurrency(stats.totalAmount)}
                    icon={TrendingUp}
                    iconColor="text-[#B45309]"
                    iconBg="bg-[#FFFBEB]"
                    description="전체 신청 합산"
                />
                <SummaryCard
                    title="실제 지출 금액"
                    value={formatCurrency(stats.purchasedAmount)}
                    icon={TrendingUp}
                    iconColor="text-[#1D4ED8]"
                    iconBg="bg-[#EFF6FF]"
                    description="구매 완료 합산"
                />
            </div>

            {/* 필터 바 */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
                {/* 기간 탭 */}
                <div className="flex bg-[#F8FAFC] rounded-md p-0.5 gap-0.5">
                    {PERIOD_TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setPeriod(tab.value)}
                            className={`px-3 py-1.5 text-sm rounded transition-colors font-medium ${period === tab.value
                                ? 'bg-white text-[#4F46E5] shadow-sm'
                                : 'text-[#64748B] hover:text-[#0F172A]'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 신청자 필터 */}
                <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="text-sm border border-[#E5E7EB] rounded-md px-3 py-1.5 text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                    id="admin-user-filter"
                >
                    <option value="all">전체 신청자</option>
                    {allUsers.map(u => (
                        <option key={u.email} value={u.email}>{u.name}</option>
                    ))}
                </select>

                {/* 키워드 검색 */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <Input
                        id="admin-search"
                        type="text"
                        placeholder="물품명 또는 신청자 이름"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>

                {tableItems.length !== items.filter(i => !i.isDistributed).length && (
                    <span className="text-sm text-[#64748B]">{tableItems.length}건</span>
                )}
            </div>

            {/* 테이블 */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                {error ? (
                    <div className="py-12 text-center text-sm text-[#64748B]">{error}</div>
                ) : loading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : tableItems.length === 0 ? (
                    <div className="py-16 text-center">
                        <Package className="w-10 h-10 text-[#E5E7EB] mx-auto mb-3" />
                        <p className="text-sm text-[#64748B]">해당 기간에 신청 내역이 없습니다.</p>
                    </div>
                ) : (
                    <>
                        {/* 데스크톱 테이블 뷰 */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">신청자</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">물품명</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">브랜드</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">단가</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">수량</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">총액</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">신청일</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">구매불가</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">구매완료</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">배부완료</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">삭제</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableItems.map(item => {
                                        const status = getItemStatus(item.isPurchased, item.isDistributed);
                                        const isUpdating = updatingIds.has(item.id);
                                        const createdDate = item.createdAt?.toDate
                                            ? format(item.createdAt.toDate(), 'MM.dd', { locale: ko })
                                            : '-';

                                        return (
                                            <tr key={item.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-[#0F172A]">{item.userName}</p>
                                                        <p className="text-xs text-[#94A3B8]">{item.userEmail}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-[#0F172A]">
                                                    <div className="flex items-center gap-2">
                                                        {item.itemName}
                                                        <StatusBadge status={status} />
                                                    </div>
                                                    {item.itemUrl && (
                                                        <a href={item.itemUrl} target="_blank" rel="noopener noreferrer"
                                                            className="text-xs text-[#4F46E5] hover:underline">
                                                            링크 보기
                                                        </a>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-[#64748B]">{item.brand}</td>
                                                <td className="px-4 py-3 text-right text-[#0F172A]">{formatCurrency(item.price)}</td>
                                                <td className="px-4 py-3 text-right text-[#0F172A]">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right font-medium text-[#0F172A]">{formatCurrency(item.price * item.quantity)}</td>
                                                <td className="px-4 py-3 text-xs text-[#64748B]">{createdDate}</td>

                                                {/* 구매불가 체크박스 */}
                                                <td className="px-4 py-3 text-center">
                                                    <Checkbox
                                                        id={`unavailable-${item.id}`}
                                                        checked={!!item.isUnavailable}
                                                        onCheckedChange={(checked) => handleStatusChange(item, 'isUnavailable', !!checked)}
                                                        disabled={isUpdating}
                                                        className="data-[state=checked]:bg-[#DC2626] data-[state=checked]:border-[#DC2626]"
                                                    />
                                                </td>

                                                {/* 구매완료 체크박스 */}
                                                <td className="px-4 py-3 text-center">
                                                    <Checkbox
                                                        id={`purchased-${item.id}`}
                                                        checked={item.isPurchased}
                                                        onCheckedChange={(checked) => handleStatusChange(item, 'isPurchased', !!checked)}
                                                        disabled={isUpdating || item.isUnavailable}
                                                        title={item.isUnavailable ? '구매 불가 항목입니다' : ''}
                                                        className="data-[state=checked]:bg-[#1D4ED8] data-[state=checked]:border-[#1D4ED8]"
                                                    />
                                                </td>

                                                {/* 배부완료 체크박스 */}
                                                <td className="px-4 py-3 text-center">
                                                    <Checkbox
                                                        id={`distributed-${item.id}`}
                                                        checked={item.isDistributed}
                                                        onCheckedChange={(checked) => handleStatusChange(item, 'isDistributed', !!checked)}
                                                        disabled={isUpdating || !item.isPurchased || item.isUnavailable}
                                                        title={item.isUnavailable ? '구매 불가 항목입니다' : !item.isPurchased ? '구매 완료 후 활성화됩니다' : ''}
                                                        className="data-[state=checked]:bg-[#15803D] data-[state=checked]:border-[#15803D] disabled:opacity-30"
                                                    />
                                                </td>

                                                {/* 삭제 버튼 */}
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => setConfirmDeleteItem({ id: item.id, itemName: item.itemName, userName: item.userName })}
                                                        disabled={deletingId === item.id}
                                                        className="p-1.5 rounded text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors disabled:opacity-30"
                                                        title="신청 삭제"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* 모바일 카드 리스트 뷰 */}
                        <div className="md:hidden flex flex-col gap-3 p-3">
                            {tableItems.map(item => {
                                const status = getItemStatus(item.isPurchased, item.isDistributed);
                                const isUpdating = updatingIds.has(item.id);
                                const createdDate = item.createdAt?.toDate
                                    ? format(item.createdAt.toDate(), 'MM.dd', { locale: ko })
                                    : '-';

                                return (
                                    <div key={`admin-mobile-${item.id}`} className="p-4 bg-white rounded-lg border border-[#E5E7EB] flex flex-col gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <StatusBadge status={status} />
                                                    <span className="font-semibold text-[#0F172A] truncate">{item.itemName}</span>
                                                </div>
                                                <div className="text-xs text-[#64748B] flex flex-col gap-0.5 mt-1">
                                                    <span className="truncate">{item.brand || '-'} ({createdDate})</span>
                                                    <span className="truncate text-[#4F46E5] font-medium">{item.userName}</span>
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

                                        {/* 상태 변경 체크박스 그룹 */}
                                        <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9] bg-[#F8FAFC] -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <Checkbox
                                                    id={`m-unavailable-${item.id}`}
                                                    checked={!!item.isUnavailable}
                                                    onCheckedChange={(checked) => handleStatusChange(item, 'isUnavailable', !!checked)}
                                                    disabled={isUpdating}
                                                    className="w-4 h-4 data-[state=checked]:bg-[#DC2626] data-[state=checked]:border-[#DC2626]"
                                                />
                                                <span className="text-xs font-semibold text-[#64748B]">구매불가</span>
                                            </label>
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <Checkbox
                                                    id={`m-purchased-${item.id}`}
                                                    checked={item.isPurchased}
                                                    onCheckedChange={(checked) => handleStatusChange(item, 'isPurchased', !!checked)}
                                                    disabled={isUpdating || item.isUnavailable}
                                                    className="w-4 h-4 data-[state=checked]:bg-[#1D4ED8] data-[state=checked]:border-[#1D4ED8]"
                                                />
                                                <span className="text-xs font-semibold text-[#64748B]">구매완료</span>
                                            </label>
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <Checkbox
                                                    id={`m-distributed-${item.id}`}
                                                    checked={item.isDistributed}
                                                    onCheckedChange={(checked) => handleStatusChange(item, 'isDistributed', !!checked)}
                                                    disabled={isUpdating || !item.isPurchased || item.isUnavailable}
                                                    className="w-4 h-4 data-[state=checked]:bg-[#15803D] data-[state=checked]:border-[#15803D] disabled:opacity-30"
                                                />
                                                <span className="text-xs font-semibold text-[#64748B]">배부완료</span>
                                            </label>
                                        </div>

                                        {/* 모바일 삭제 버튼 */}
                                        <button
                                            onClick={() => setConfirmDeleteItem({ id: item.id, itemName: item.itemName, userName: item.userName })}
                                            disabled={deletingId === item.id}
                                            className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] transition-colors disabled:opacity-30"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            신청 삭제
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* 삭제 확인 다이얼로그 */}
            <Dialog open={!!confirmDeleteItem} onOpenChange={(open) => { if (!open) setConfirmDeleteItem(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>신청 항목 삭제</DialogTitle>
                        <DialogDescription>
                            <span className="font-semibold text-[#0F172A]">{confirmDeleteItem?.userName}</span>님의{' '}
                            <span className="font-semibold text-[#0F172A]">&apos;{confirmDeleteItem?.itemName}&apos;</span> 신청을
                            삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setConfirmDeleteItem(null)}>
                            취소
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteRequest}>
                            삭제
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
