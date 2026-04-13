'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile } from '@/lib/types';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** 최초 로그인 시 Firestore users/{uid} 문서를 role: "user" 로 생성 */
async function createUserDocIfNotExists(firebaseUser: User, overrideName?: string) {
    const docRef = doc(db, 'users', firebaseUser.uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        await setDoc(docRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            name: overrideName ?? firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? '사용자',
            role: 'user',
            createdAt: serverTimestamp(),
        });
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = useCallback(async (uid: string) => {
        try {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data() as UserProfile;
                setUserProfile(data);
                
                // 세션별 방문수 증분 로직
                if (typeof window !== 'undefined' && !sessionStorage.getItem('access_logged')) {
                    sessionStorage.setItem('access_logged', 'true');
                    try {
                        await updateDoc(docRef, {
                            loginCount: increment(1),
                            lastLoginAt: serverTimestamp()
                        });
                        // 로컬 상태에도 반영
                        setUserProfile(prev => prev ? { ...prev, loginCount: (prev.loginCount || 0) + 1 } : prev);
                    } catch (e) {
                        console.error('방문 기록 업데이트 실패:', e);
                    }
                }
            } else {
                setUserProfile(null);
            }
        } catch (error) {
            console.error('사용자 프로필 로드 실패:', error);
            setUserProfile(null);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                await fetchUserProfile(firebaseUser.uid);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [fetchUserProfile]);

    const signInWithEmail = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUpWithEmail = async (email: string, password: string, name: string) => {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        // 표시 이름 설정
        await updateProfile(credential.user, { displayName: name });
        // Firestore users 문서 생성
        await createUserDocIfNotExists(credential.user, name);
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const credential = await signInWithPopup(auth, provider);
        // 최초 Google 로그인 시 users 문서 자동 생성
        await createUserDocIfNotExists(credential.user);
        // 프로필 즉시 갱신
        await fetchUserProfile(credential.user.uid);
    };

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth는 AuthProvider 안에서 사용해야 합니다.');
    }
    return context;
}
