'use client';

import { useState, useMemo } from 'react';
import { format, startOfWeek, startOfMonth } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { useAdminInventory, useAdminUsers, formatCurrency } from '@/lib/hooks/useInventory';
import { Header } from '@/components/common/Header';
import { Skeleton } from '@/components/ui/skeleton';

// 물품명 기반 카테고리 클러스터링 도우미 함수
const categorizeItemName = (name: string): string => {
    const lowerName = name.toLowerCase();
    
    // 1. 키보드/마우스
    if (lowerName.includes('마우스') || lowerName.includes('키보드') || lowerName.includes('키스킨') || lowerName.includes('손목받침대') || lowerName.includes('패드')) return '키보드/마우스/패드';
    // 2. 모니터/거치용품
    if (lowerName.includes('모니터') || lowerName.includes('거치대') || lowerName.includes('스탠드') || lowerName.includes('받침대') || lowerName.includes('모니터암')) return '모니터/거치용품';
    // 3. 필기구
    if (lowerName.includes('펜') || lowerName.includes('연필') || lowerName.includes('샤프') || lowerName.includes('매직') || lowerName.includes('화이트') || lowerName.includes('수정테이프') || lowerName.includes('지우개')) return '필기구';
    // 4. 전자기기 주변용품
    if (lowerName.includes('케이블') || lowerName.includes('허브') || lowerName.includes('젠더') || lowerName.includes('충전기') || lowerName.includes('어댑터') || lowerName.includes('건전지') || lowerName.includes('배터리') || lowerName.includes('이어폰') || lowerName.includes('스피커') || lowerName.includes('웹캠')) return 'PC/주변기기';
    // 5. 제본/서류용품
    if (lowerName.includes('파일') || lowerName.includes('바인더') || lowerName.includes('클리어') || lowerName.includes('홀더') || lowerName.includes('인덱스') || lowerName.includes('포스트잇') || lowerName.includes('메모') || lowerName.includes('노트') || lowerName.includes('수첩')) return '서류/메모용품';
    // 6. 종이류
    if (lowerName.includes('a4') || lowerName.includes('a3') || lowerName.includes('b4') || lowerName.includes('복사지') || lowerName.includes('도화지') || lowerName.includes('색상지')) return '용지/종이류';
    // 7. 일반 문구류
    if (lowerName.includes('가위') || lowerName.includes('칼') || lowerName.includes('테이프') || lowerName.includes('풀') || lowerName.includes('클립') || lowerName.includes('스테이플러') || lowerName.includes('호치키스') || lowerName.includes('펀치') || lowerName.includes('자석') || lowerName.includes('도장') || lowerName.includes('인주')) return '일반 문구류';
    // 8. 저장장치
    if (lowerName.includes('usb') || lowerName.includes('ssd') || lowerName.includes('외장하드') || lowerName.includes('sd카드')) return '저장장치';

    // 매칭되는 키워드가 없으면 너무 파편화되지 않도록 원래 문자열 대신 마지막 단어를 쓰거나 원래 이름을 반환
    return name;
};

export default function AdminStatisticsPage() {
    const { items, loading: itemsLoading, error: itemsError } = useAdminInventory();
    const { users, loading: usersLoading, error: usersError } = useAdminUsers();
    
    const loading = itemsLoading || usersLoading;
    const error = itemsError || usersError;
    
    const [trendPeriod, setTrendPeriod] = useState<'weekly' | 'monthly'>('monthly');

    // 유효 항목 필터링 (불가 배제)
    const validItems = useMemo(() => items.filter(i => !i.isUnavailable), [items]);

    // 1. 주별/월별 추이 데이터
    const trendData = useMemo(() => {
        const map = new Map<string, number>();
        validItems.forEach(item => {
            if (!item.createdAt) return;
            const date = item.createdAt instanceof Timestamp ? item.createdAt.toDate() : new Date(item.createdAt as unknown as string);
            
            let key;
            if (trendPeriod === 'weekly') {
                key = format(startOfWeek(date, { weekStartsOn: 1 }), 'MM.dd(월) 주');
            } else {
                key = format(startOfMonth(date), 'yyyy.MM월');
            }
            map.set(key, (map.get(key) || 0) + (item.price * item.quantity));
        });
        return Array.from(map.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, amount]) => ({ date, amount }));
    }, [validItems, trendPeriod]);

    // 2. 구매금액 Top 10
    const topUsersData = useMemo(() => {
        const map = new Map<string, { name: string, amount: number, quantity: number }>();
        validItems.forEach(item => {
            if (!map.has(item.userEmail)) {
                map.set(item.userEmail, { name: item.userName, amount: 0, quantity: 0 });
            }
            const userRef = map.get(item.userEmail)!;
            userRef.amount += (item.price * item.quantity);
            userRef.quantity += item.quantity;
        });
        return Array.from(map.values())
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10);
    }, [validItems]);

    // 3. 인기 물품 카테고리 Top 5 (클러스터링 적용)
    const topItemsData = useMemo(() => {
        const map = new Map<string, number>();
        validItems.forEach(item => {
            const category = categorizeItemName(item.itemName);
            map.set(category, (map.get(category) || 0) + item.quantity);
        });
        return Array.from(map.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, quantity]) => ({ name, quantity }));
    }, [validItems]);

    // 4. 파이프라인 파이 차트
    const pipelineData = useMemo(() => {
        let pending = 0, purchased = 0, distributed = 0, unavailable = 0;
        items.forEach(i => {
            if (i.isUnavailable) unavailable++;
            else if (i.isDistributed) distributed++;
            else if (i.isPurchased) purchased++;
            else pending++;
        });
        return [
            { name: '신청 대기', value: pending, color: '#FBBF24' },
            { name: '구매 완료', value: purchased, color: '#3B82F6' },
            { name: '배부 완료', value: distributed, color: '#10B981' },
            { name: '구매 불가', value: unavailable, color: '#EF4444' }
        ].filter(d => d.value > 0);
    }, [items]);

    // 5. 방문 횟수(누적) Top 10
    const topVisitsData = useMemo(() => {
        return [...users]
            .filter(u => u.loginCount && u.loginCount > 0)
            .sort((a, b) => (b.loginCount || 0) - (a.loginCount || 0))
            .slice(0, 10)
            .map(u => ({ name: u.name, visits: u.loginCount || 0 }));
    }, [users]);

    // 6. 신청 건수 빈도 Top 10 (항목 등록 횟수)
    const topRequestorsData = useMemo(() => {
        const map = new Map<string, { name: string, requestCount: number }>();
        validItems.forEach(item => {
            if (!map.has(item.userEmail)) {
                map.set(item.userEmail, { name: item.userName, requestCount: 0 });
            }
            map.get(item.userEmail)!.requestCount += 1;
        });
        return Array.from(map.values())
            .sort((a, b) => b.requestCount - a.requestCount)
            .slice(0, 10);
    }, [validItems]);

    if (error) {
        return <div className="py-12 text-center text-sm text-[#64748B]">{error}</div>;
    }

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <Skeleton className="h-20 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-80 w-full" />
                    <Skeleton className="h-80 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div>
            <Header
                title="통계 데이터"
                description="전체 신청 내역에 대한 다양한 주요 지표와 랭킹을 한눈에 확인하세요."
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6 pb-12">
                
                {/* 1. 구매 신청 예상 지출 추이 */}
                <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-[#0F172A]">신청 지출 예상 추이</h3>
                        <div className="flex bg-[#F8FAFC] rounded-md p-0.5 gap-0.5">
                            <button onClick={() => setTrendPeriod('weekly')} className={`px-3 py-1.5 text-xs font-semibold transition-colors rounded ${trendPeriod === 'weekly' ? 'bg-white text-[#4F46E5] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}>주별</button>
                            <button onClick={() => setTrendPeriod('monthly')} className={`px-3 py-1.5 text-xs font-semibold transition-colors rounded ${trendPeriod === 'monthly' ? 'bg-white text-[#4F46E5] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}>월별</button>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748B'}} tickMargin={10} />
                                <YAxis tickFormatter={(val) => `${(val / 10000).toFixed(0)}만`} tick={{fontSize: 12, fill: '#64748B'}} width={55} />
                                <Tooltip formatter={(value: any) => [`${value.toLocaleString()}원`, '금액']} labelStyle={{color: '#0F172A'}} />
                                <Line type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. 파이프라인 진행 건수 비율 */}
                <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <h3 className="font-semibold text-[#0F172A] mb-6">전체 재고 진행 상태 (파이프라인)</h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pipelineData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pipelineData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => [`${value}건`, '건수']} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. 누적 구매액 상위 10명 */}
                <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <h3 className="font-semibold text-[#0F172A] mb-6">신청 금액 상위 10명</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topUsersData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                <XAxis type="number" tickFormatter={(val) => `${(val / 10000).toFixed(0)}만`} tick={{fontSize: 12, fill: '#64748B'}} />
                                <YAxis dataKey="name" type="category" tick={{fontSize: 12, fill: '#0F172A', fontWeight: 500}} width={70} />
                                <Tooltip cursor={{fill: '#F8FAFC'}} formatter={(value: any, name: any, props: any) => [`${value.toLocaleString()}원 (총 ${props.payload.quantity}개 신청)`, '누적 금액']} />
                                <Bar dataKey="amount" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. 인기 물품 카테고리 순위 */}
                <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <h3 className="font-semibold text-[#0F172A] mb-6">가장 많이 신청된 품목군 (TOP 5)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topItemsData} margin={{ top: 15, right: 20, left: -20, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#0F172A'}} tickMargin={10} angle={-15} textAnchor="end" />
                                <YAxis tick={{fontSize: 12, fill: '#64748B'}} allowDecimals={false} />
                                <Tooltip cursor={{fill: '#F8FAFC'}} formatter={(value: any) => [`${value}개`, '신청 수량']} />
                                <Bar dataKey="quantity" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5. 접속 빈도 상위 10명 */}
                <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <h3 className="font-semibold text-[#0F172A] mb-6">가장 자주 접속한 교직원 (TOP 10)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topVisitsData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#0F172A'}} tickMargin={10} />
                                <YAxis tick={{fontSize: 12, fill: '#64748B'}} allowDecimals={false} />
                                <Tooltip cursor={{fill: '#F8FAFC'}} formatter={(value: any) => [`${value}회`, '누적 방문수']} />
                                <Bar dataKey="visits" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 6. 신청 건수 빈도 상위 10명 */}
                <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <h3 className="font-semibold text-[#0F172A] mb-6">가장 물품 신청을 많이 한 교직원 (TOP 10)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topRequestorsData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#0F172A'}} tickMargin={10} />
                                <YAxis tick={{fontSize: 12, fill: '#64748B'}} allowDecimals={false} />
                                <Tooltip cursor={{fill: '#F8FAFC'}} formatter={(value: any) => [`${value}회 (건)`, '총 신청 건수']} />
                                <Bar dataKey="requestCount" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}
