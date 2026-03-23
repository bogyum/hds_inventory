'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus, Search, ShoppingCart, CheckCircle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUserInventory, useInventorySearch, deleteInventoryItem, formatCurrency } from '@/lib/hooks/useInventory';
import { Header } from '@/components/common/Header';
import { SummaryCard } from '@/components/common/SummaryCard';
import { StatusBadge, getItemStatus } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { InventoryItem } from '@/lib/types';
import EditItemModal from '@/components/user/EditItemModal';

export default function UserDashboardPage() {
    const { user, userProfile } = useAuth();
    const { items, loading, error } = useUserInventory(user?.email ?? null);
    const { searchQuery, setSearchQuery, filteredItems } = useInventorySearch(items);

    const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
    const [editTarget, setEditTarget] = useState<InventoryItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // 요약 통계 (전체 항목 기준 유지)
    const totalCount = items.length;
    const purchasedCount = items.filter(i => i.isPurchased).length;
    const distributedCount = items.filter(i => i.isDistributed).length;

    // 대시보드는 진행 중(배부 전) 항목만 표시 (단, 구매불가 제외)
    const activeItems = filteredItems.filter(i => !i.isDistributed && !i.isUnavailable);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteInventoryItem(deleteTarget.id);
            toast.success('신청이 취소되었습니다.');
            setDeleteTarget(null);
        } catch (e) {
            console.error(e);
            toast.error('취소 중 오류가 발생했습니다.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div>
            <Header
                title={`안녕하세요, ${userProfile?.name || user?.displayName || ''}님 👋`}
                description="현재 진행 중인 물품 신청 현황을 확인하세요."
                action={
                    <Link href="/user/request" id="new-request-btn">
                        <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2">
                            <Plus className="w-4 h-4" />
                            신청하기
                        </Button>
                    </Link>
                }
            />

            {/* 요약 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <SummaryCard
                    title="총 신청 건수"
                    value={totalCount}
                    icon={Package}
                    iconColor="text-[#4F46E5]"
                    iconBg="bg-[#EEF2FF]"
                />
                <SummaryCard
                    title="구매 완료"
                    value={purchasedCount}
                    icon={ShoppingCart}
                    iconColor="text-[#1D4ED8]"
                    iconBg="bg-[#EFF6FF]"
                />
                <SummaryCard
                    title="배부 완료"
                    value={distributedCount}
                    icon={CheckCircle}
                    iconColor="text-[#15803D]"
                    iconBg="bg-[#F0FDF4]"
                />
            </div>

            {/* 검색 및 타이틀 영역 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-[#0F172A]">진행 중인 신청 내역</h2>
                    <span className="bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold px-2 py-0.5 rounded-full">
                        {activeItems.length}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                        <Input
                            id="dashboard-search"
                            type="text"
                            placeholder="진행 중인 물품 검색"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                </div>
            </div>

            {/* 목록 테이블 */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] mb-4">
                {error ? (
                    <div className="py-12 text-center text-[#64748B]">
                        <p className="text-sm">{error}</p>
                    </div>
                ) : loading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : activeItems.length === 0 ? (
                    <div className="py-16 text-center">
                        <CheckCircle className="w-10 h-10 text-[#E5E7EB] mx-auto mb-3" />
                        <p className="text-sm font-medium text-[#64748B]">
                            {searchQuery ? '검색 결과가 없습니다.' : '현재 대기 중이거나 진행 중인 신청 내역이 없습니다.'}
                        </p>
                        {!searchQuery && (
                            <Link href="/user/history">
                                <Button variant="outline" size="sm" className="mt-4">
                                    지난 전체 신청 내역 보기
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        {/* 데스크톱 테이블 뷰 */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
                                        <th className="text-left px-4 py-3 text-xs font-600 text-[#64748B] uppercase tracking-wide">물품명</th>
                                        <th className="text-left px-4 py-3 text-xs font-600 text-[#64748B] uppercase tracking-wide">브랜드</th>
                                        <th className="text-right px-4 py-3 text-xs font-600 text-[#64748B] uppercase tracking-wide">단가</th>
                                        <th className="text-right px-4 py-3 text-xs font-600 text-[#64748B] uppercase tracking-wide">수량</th>
                                        <th className="text-right px-4 py-3 text-xs font-600 text-[#64748B] uppercase tracking-wide">총액</th>
                                        <th className="text-left px-4 py-3 text-xs font-600 text-[#64748B] uppercase tracking-wide">상태</th>
                                        <th className="text-left px-4 py-3 text-xs font-600 text-[#64748B] uppercase tracking-wide">신청일</th>
                                        <th className="text-left px-4 py-3 text-xs font-600 text-[#64748B] uppercase tracking-wide">작업</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeItems.map((item) => {
                                        const status = getItemStatus(item.isPurchased, item.isDistributed, item.isUnavailable);
                                        const canEdit = !item.isPurchased && !item.isUnavailable;
                                        const createdDate = item.createdAt?.toDate
                                            ? format(item.createdAt.toDate(), 'yyyy.MM.dd', { locale: ko })
                                            : '-';

                                        return (
                                            <tr key={item.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                                                <td className="px-4 py-3 font-medium text-[#0F172A]">
                                                    {item.itemUrl ? (
                                                        <a href={item.itemUrl} target="_blank" rel="noopener noreferrer"
                                                            className="text-[#4F46E5] hover:underline">
                                                            {item.itemName}
                                                        </a>
                                                    ) : item.itemName}
                                                </td>
                                                <td className="px-4 py-3 text-[#64748B]">{item.brand}</td>
                                                <td className="px-4 py-3 text-right text-[#0F172A]">{formatCurrency(item.price)}</td>
                                                <td className="px-4 py-3 text-right text-[#0F172A]">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right font-medium text-[#0F172A]">{formatCurrency(item.price * item.quantity)}</td>
                                                <td className="px-4 py-3"><StatusBadge status={status} /></td>
                                                <td className="px-4 py-3 text-[#64748B] text-xs">{createdDate}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => canEdit && setEditTarget(item)}
                                                            disabled={!canEdit}
                                                            title={!canEdit ? '구매 완료된 항목은 수정할 수 없습니다' : '수정'}
                                                            className={`text-xs px-2.5 py-1 rounded border transition-colors ${canEdit
                                                                ? 'border-[#E5E7EB] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] cursor-pointer'
                                                                : 'border-[#F1F5F9] text-[#CBD5E1] cursor-not-allowed'
                                                                }`}
                                                        >
                                                            수정
                                                        </button>
                                                        <button
                                                            onClick={() => canEdit && setDeleteTarget(item)}
                                                            disabled={!canEdit}
                                                            title={!canEdit ? '구매 완료된 항목은 취소할 수 없습니다' : '취소'}
                                                            className={`text-xs px-2.5 py-1 rounded border transition-colors ${canEdit
                                                                ? 'border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer'
                                                                : 'border-[#F1F5F9] text-[#CBD5E1] cursor-not-allowed'
                                                                }`}
                                                        >
                                                            취소
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* 모바일 카드 리스트 뷰 */}
                        <div className="md:hidden flex flex-col divide-y divide-[#E5E7EB]">
                            {activeItems.map((item) => {
                                const status = getItemStatus(item.isPurchased, item.isDistributed, item.isUnavailable);
                                const canEdit = !item.isPurchased && !item.isUnavailable;
                                const createdDate = item.createdAt?.toDate
                                    ? format(item.createdAt.toDate(), 'yy.MM.dd', { locale: ko })
                                    : '-';

                                return (
                                    <div key={`mobile-${item.id}`} className="p-4 bg-white flex flex-col gap-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <StatusBadge status={status} />
                                                    <span className="font-semibold text-[#0F172A] truncate">{item.itemName}</span>
                                                </div>
                                                <div className="text-xs text-[#64748B] flex items-center gap-2 mt-1">
                                                    <span className="truncate max-w-[120px]">{item.brand}</span>
                                                    <span>•</span>
                                                    <span>{createdDate}</span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="font-semibold text-[#0F172A]">{formatCurrency(item.price * item.quantity)}</div>
                                                <div className="text-xs text-[#64748B] mt-0.5">{formatCurrency(item.price)} × {item.quantity}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                                            {item.itemUrl && (
                                                <a href={item.itemUrl} target="_blank" rel="noopener noreferrer"
                                                    className="text-xs text-[#4F46E5] hover:underline mr-auto">
                                                    링크 보기
                                                </a>
                                            )}
                                            <button
                                                onClick={() => canEdit && setEditTarget(item)}
                                                disabled={!canEdit}
                                                className={`text-xs px-4 py-2 rounded-md border font-medium transition-colors ${canEdit
                                                    ? 'border-[#E5E7EB] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] cursor-pointer'
                                                    : 'border-[#F1F5F9] text-[#CBD5E1] cursor-not-allowed'
                                                    }`}
                                            >
                                                수정
                                            </button>
                                            <button
                                                onClick={() => canEdit && setDeleteTarget(item)}
                                                disabled={!canEdit}
                                                className={`text-xs px-4 py-2 rounded-md border font-medium transition-colors ${canEdit
                                                    ? 'border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer'
                                                    : 'border-[#F1F5F9] text-[#CBD5E1] cursor-not-allowed'
                                                    }`}
                                            >
                                                취소
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* 수정 모달 */}
            {editTarget && (
                <EditItemModal
                    item={editTarget}
                    onClose={() => setEditTarget(null)}
                />
            )}

            {/* 삭제 확인 다이얼로그 */}
            <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>신청 취소 확인</DialogTitle>
                        <DialogDescription>
                            <strong>&quot;{deleteTarget?.itemName}&quot;</strong> 신청을 취소하시겠습니까?
                            이 작업은 되돌릴 수 없습니다.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                            돌아가기
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? '취소 중...' : '신청 취소'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
