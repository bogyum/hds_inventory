'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { updateInventoryItem } from '@/lib/hooks/useInventory';
import { InventoryItem, InventoryItemForm } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface EditItemModalProps {
    item: InventoryItem;
    onClose: () => void;
}

export default function EditItemModal({ item, onClose }: EditItemModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState<InventoryItemForm>({
        itemName: item.itemName,
        brand: item.brand === '무관' ? '' : item.brand,
        itemUrl: item.itemUrl,
        price: item.price,
        quantity: item.quantity,
    });
    const [errors, setErrors] = useState<Partial<Record<keyof InventoryItemForm, string>>>({});

    const totalAmount = form.price > 0 && form.quantity > 0 ? form.price * form.quantity : 0;

    const handleChange = (field: keyof InventoryItemForm, value: string | number) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof InventoryItemForm, string>> = {};
        if (!form.itemName.trim()) newErrors.itemName = '물품명을 입력하세요.';
        if (!form.price || form.price <= 0) newErrors.price = '올바른 단가를 입력하세요.';
        if (!form.quantity || form.quantity < 1) newErrors.quantity = '수량은 1 이상이어야 합니다.';
        if (form.itemUrl && !/^https?:\/\/.+/.test(form.itemUrl)) {
            newErrors.itemUrl = '올바른 URL 형식이어야 합니다.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await updateInventoryItem(item.id, {
                ...form,
                brand: form.brand || '무관',
            });
            toast.success('신청이 수정되었습니다.');
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('수정 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>신청 수정</DialogTitle>
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    {/* 물품명 */}
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-itemName" className="text-xs font-medium text-[#64748B]">
                            물품명 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="edit-itemName"
                            value={form.itemName}
                            onChange={(e) => handleChange('itemName', e.target.value)}
                            className={errors.itemName ? 'border-red-400' : ''}
                            disabled={isSubmitting}
                        />
                        {errors.itemName && <p className="text-xs text-red-500">{errors.itemName}</p>}
                    </div>

                    {/* 브랜드 */}
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-brand" className="text-xs font-medium text-[#64748B]">
                            선호 브랜드 <span className="text-[#94A3B8]">(선택)</span>
                        </Label>
                        <Input
                            id="edit-brand"
                            value={form.brand}
                            onChange={(e) => handleChange('brand', e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* 링크 */}
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-itemUrl" className="text-xs font-medium text-[#64748B]">
                            물품 링크 <span className="text-[#94A3B8]">(선택)</span>
                        </Label>
                        <Input
                            id="edit-itemUrl"
                            type="url"
                            value={form.itemUrl}
                            onChange={(e) => handleChange('itemUrl', e.target.value)}
                            className={errors.itemUrl ? 'border-red-400' : ''}
                            disabled={isSubmitting}
                        />
                        {errors.itemUrl && <p className="text-xs text-red-500">{errors.itemUrl}</p>}
                    </div>

                    {/* 단가 + 수량 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-price" className="text-xs font-medium text-[#64748B]">
                                단가 (원) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="edit-price"
                                type="number"
                                min={1}
                                value={form.price || ''}
                                onChange={(e) => handleChange('price', parseInt(e.target.value) || 0)}
                                className={errors.price ? 'border-red-400' : ''}
                                disabled={isSubmitting}
                            />
                            {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-quantity" className="text-xs font-medium text-[#64748B]">
                                수량 <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="edit-quantity"
                                type="number"
                                min={1}
                                value={form.quantity || ''}
                                onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                                className={errors.quantity ? 'border-red-400' : ''}
                                disabled={isSubmitting}
                            />
                            {errors.quantity && <p className="text-xs text-red-500">{errors.quantity}</p>}
                        </div>
                    </div>

                    {/* 총액 미리보기 */}
                    {totalAmount > 0 && (
                        <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg px-4 py-3 flex items-center justify-between">
                            <span className="text-sm text-[#4F46E5] font-medium">예상 총액</span>
                            <span className="text-base font-bold text-[#4F46E5]">
                                {new Intl.NumberFormat('ko-KR').format(totalAmount)}원
                            </span>
                        </div>
                    )}

                    {/* 버튼 */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            취소
                        </Button>
                        <Button
                            type="submit"
                            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? '저장 중...' : '수정 저장'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
