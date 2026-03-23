'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { createInventoryItem } from '@/lib/hooks/useInventory';
import { InventoryItemForm } from '@/lib/types';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function RequestPage() {
    const router = useRouter();
    const { user, userProfile } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState<InventoryItemForm>({
        itemName: '',
        brand: '',
        itemUrl: '',
        price: 0,
        quantity: 1,
    });
    const [errors, setErrors] = useState<Partial<Record<keyof InventoryItemForm, string>>>({});

    const totalAmount = form.price > 0 && form.quantity > 0 ? form.price * form.quantity : 0;

    const handleChange = (field: keyof InventoryItemForm, value: string | number) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof InventoryItemForm, string>> = {};

        if (!form.itemName.trim()) {
            newErrors.itemName = '물품명을 입력하세요.';
        }
        if (!form.price || form.price <= 0) {
            newErrors.price = '올바른 단가를 입력하세요.';
        }
        if (!form.quantity || form.quantity < 1 || !Number.isInteger(form.quantity)) {
            newErrors.quantity = '수량은 1 이상의 정수여야 합니다.';
        }
        if (form.itemUrl && !/^https?:\/\/.+/.test(form.itemUrl)) {
            newErrors.itemUrl = '올바른 URL 형식이어야 합니다. (http:// 또는 https://)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        if (!user?.email) {
            toast.error('로그인이 필요합니다.');
            return;
        }

        setIsSubmitting(true);
        try {
            await createInventoryItem(
                form,
                user.email,
                userProfile?.name || user.displayName || user.email
            );
            toast.success('물품 신청이 완료되었습니다!');
            router.push('/user/dashboard');
        } catch (err) {
            console.error(err);
            toast.error('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <Header
                title="물품 신청"
                description="필요한 소모품을 신청하세요. * 표시는 필수 항목입니다."
                action={
                    <Link href="/user/dashboard">
                        <Button variant="outline" size="sm" className="gap-1.5">
                            <ArrowLeft className="w-4 h-4" />
                            돌아가기
                        </Button>
                    </Link>
                }
            />

            <Card className="border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} noValidate className="space-y-5">

                        {/* 물품명 */}
                        <div className="space-y-1.5">
                            <Label htmlFor="itemName" className="text-xs font-medium text-[#64748B]">
                                물품명 <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="itemName"
                                type="text"
                                placeholder="예: A4 복사지"
                                value={form.itemName}
                                onChange={(e) => handleChange('itemName', e.target.value)}
                                className={errors.itemName ? 'border-red-400' : ''}
                                disabled={isSubmitting}
                            />
                            {errors.itemName && <p className="text-xs text-red-500">{errors.itemName}</p>}
                        </div>

                        {/* 선호 브랜드 */}
                        <div className="space-y-1.5">
                            <Label htmlFor="brand" className="text-xs font-medium text-[#64748B]">
                                선호 브랜드 <span className="text-[#94A3B8]">(선택)</span>
                            </Label>
                            <Input
                                id="brand"
                                type="text"
                                placeholder="브랜드 없을 경우 비워두세요 (자동으로 '무관' 처리)"
                                value={form.brand}
                                onChange={(e) => handleChange('brand', e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* 물품 링크 */}
                        <div className="space-y-1.5">
                            <Label htmlFor="itemUrl" className="text-xs font-medium text-[#64748B]">
                                물품 링크 <span className="text-[#94A3B8]">(선택)</span>
                            </Label>
                            <Input
                                id="itemUrl"
                                type="url"
                                placeholder="https://..."
                                value={form.itemUrl}
                                onChange={(e) => handleChange('itemUrl', e.target.value)}
                                className={errors.itemUrl ? 'border-red-400' : ''}
                                disabled={isSubmitting}
                            />
                            {errors.itemUrl && <p className="text-xs text-red-500">{errors.itemUrl}</p>}
                        </div>

                        {/* 단가 + 수량 (나란히) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="price" className="text-xs font-medium text-[#64748B]">
                                    단가 (원) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="price"
                                    type="number"
                                    placeholder="0"
                                    min={1}
                                    value={form.price || ''}
                                    onChange={(e) => handleChange('price', parseInt(e.target.value) || 0)}
                                    className={errors.price ? 'border-red-400' : ''}
                                    disabled={isSubmitting}
                                />
                                {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="quantity" className="text-xs font-medium text-[#64748B]">
                                    수량 <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    placeholder="1"
                                    min={1}
                                    step={1}
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
                                <span className="text-lg font-bold text-[#4F46E5]">
                                    {new Intl.NumberFormat('ko-KR').format(totalAmount)}원
                                </span>
                            </div>
                        )}

                        {/* 제출 버튼 */}
                        <div className="flex justify-end gap-3 pt-2">
                            <Link href="/user/dashboard">
                                <Button type="button" variant="outline" disabled={isSubmitting}>
                                    취소
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                                disabled={isSubmitting}
                                id="submit-request-btn"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        신청 중...
                                    </span>
                                ) : '신청하기'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
