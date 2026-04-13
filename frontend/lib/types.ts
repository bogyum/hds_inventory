// Firestore 데이터 타입 정의

import { Timestamp } from 'firebase/firestore';

// 물품 신청 데이터 (bk.inventory 컬렉션)
export interface InventoryItem {
    id: string;
    userEmail: string;
    userName: string;
    itemName: string;
    brand: string;      // 없을 경우 "무관"
    itemUrl: string;    // 없을 경우 ""
    price: number;      // 단가 (원)
    quantity: number;   // 수량
    isPurchased: boolean;
    isDistributed: boolean;
    isUnavailable?: boolean; // 구매불가 여부 (새로 추가, 하위 호환성을 위해 undefined 가능)
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// 신청 폼 데이터 (사용자 입력 부분만)
export interface InventoryItemForm {
    itemName: string;
    brand: string;
    itemUrl: string;
    price: number;
    quantity: number;
}

// 사용자 정보 (users 컬렉션)
export interface UserProfile {
    uid: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
    loginCount?: number;
    lastLoginAt?: Timestamp;
}

// 상태 타입
export type ItemStatus = 'pending' | 'purchased' | 'distributed' | 'unavailable';
