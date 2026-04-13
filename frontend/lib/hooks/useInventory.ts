'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { InventoryItem, InventoryItemForm, UserProfile } from '@/lib/types';

// ====================================================
// 관리자: 전체 회원 목록 실시간 조회 (users 컬렉션)
// ====================================================
export function useAdminUsers() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(
            collection(db, 'users'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const data = snapshot.docs.map(doc => doc.data()) as UserProfile[];
                setUsers(data);
                setLoading(false);
            },
            (err) => {
                console.error('Firestore 유저 로드 오류:', err);
                setError('회원 정보를 불러오는 중 오류가 발생했습니다.');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { users, loading, error };
}

// ====================================================
// 일반 교사: 본인 신청 목록 실시간 조회
// ====================================================
export function useUserInventory(userEmail: string | null) {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userEmail) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'bk.inventory'),
            where('userEmail', '==', userEmail),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as InventoryItem[];
                setItems(data);
                setLoading(false);
            },
            (err) => {
                console.error('Firestore 오류:', err);
                setError('데이터를 불러오는 중 오류가 발생했습니다.');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userEmail]);

    return { items, loading, error };
}

// ====================================================
// 관리자: 전체 신청 목록 실시간 조회
// ====================================================
export function useAdminInventory() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(
            collection(db, 'bk.inventory'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as InventoryItem[];
                setItems(data);
                setLoading(false);
            },
            (err) => {
                console.error('Firestore 오류:', err);
                setError('데이터를 불러오는 중 오류가 발생했습니다.');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { items, loading, error };
}

// ====================================================
// 물품 신청 생성
// ====================================================
export async function createInventoryItem(
    formData: InventoryItemForm,
    userEmail: string,
    userName: string
): Promise<string> {
    const docRef = await addDoc(collection(db, 'bk.inventory'), {
        ...formData,
        brand: formData.brand || '무관',
        itemUrl: formData.itemUrl || '',
        userEmail,
        userName,
        isPurchased: false,
        isDistributed: false,
        isUnavailable: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

// ====================================================
// 물품 신청 수정 (isPurchased: false인 경우만)
// ====================================================
export async function updateInventoryItem(
    id: string,
    formData: Partial<InventoryItemForm>
): Promise<void> {
    const docRef = doc(db, 'bk.inventory', id);
    await updateDoc(docRef, {
        ...formData,
        updatedAt: serverTimestamp(),
    });
}

// ====================================================
// 물품 신청 삭제
// ====================================================
export async function deleteInventoryItem(id: string): Promise<void> {
    const docRef = doc(db, 'bk.inventory', id);
    await deleteDoc(docRef);
}

// ====================================================
// 관리자: 구매/배부 상태 업데이트 (낙관적 업데이트)
// ====================================================
export async function updateItemStatus(
    id: string,
    updates: { isPurchased?: boolean; isDistributed?: boolean; isUnavailable?: boolean }
): Promise<void> {
    const docRef = doc(db, 'bk.inventory', id);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

// ====================================================
// 전체 신청자 목록 조회 (관리자 필터링용)
// ====================================================
export async function getAllUsers(): Promise<{ email: string; name: string }[]> {
    const q = query(collection(db, 'bk.inventory'));
    const snapshot = await getDocs(q);
    const usersMap = new Map<string, string>();

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userEmail && !usersMap.has(data.userEmail)) {
            usersMap.set(data.userEmail, data.userName);
        }
    });

    return Array.from(usersMap.entries()).map(([email, name]) => ({ email, name }));
}

// ====================================================
// 숫자 수자 포맷팅 유틸리티
// ====================================================
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

export function useInventorySearch(items: InventoryItem[]) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredItems = useCallback(() => {
        if (!searchQuery.trim()) return items;
        const q = searchQuery.toLowerCase();
        return items.filter(item =>
            item.itemName.toLowerCase().includes(q) ||
            item.brand.toLowerCase().includes(q)
        );
    }, [items, searchQuery]);

    return { searchQuery, setSearchQuery, filteredItems: filteredItems() };
}
