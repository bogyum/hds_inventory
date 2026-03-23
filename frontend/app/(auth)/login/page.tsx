'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Mail, Lock, Package, Chrome, User } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Mode = 'login' | 'signup';

export default function LoginPage() {
    const router = useRouter();
    const { signInWithEmail, signUpWithEmail, signInWithGoogle, userProfile, loading } = useAuth();
    const [mode, setMode] = useState<Mode>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

    const validate = () => {
        const newErrors: { name?: string; email?: string; password?: string } = {};
        if (mode === 'signup' && !name.trim()) newErrors.name = '이름을 입력하세요.';
        if (!email) newErrors.email = '이메일을 입력하세요.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = '올바른 이메일 형식이 아닙니다.';
        if (!password) newErrors.password = '비밀번호를 입력하세요.';
        else if (password.length < 6) newErrors.password = '비밀번호는 6자 이상이어야 합니다.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRedirect = (role?: string) => {
        if (role === 'admin') {
            router.push('/admin/dashboard');
        } else {
            router.push('/user/dashboard');
        }
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        try {
            if (mode === 'login') {
                await signInWithEmail(email, password);
                toast.success('로그인 성공!');
                setTimeout(() => handleRedirect(userProfile?.role), 500);
            } else {
                await signUpWithEmail(email, password, name.trim());
                toast.success('회원가입 완료! 로그인되었습니다.');
                setTimeout(() => handleRedirect('user'), 500);
            }
        } catch (error: unknown) {
            console.error(error);
            const firebaseError = error as { code?: string };
            if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/invalid-credential') {
                toast.error('이메일 또는 비밀번호가 올바르지 않습니다.');
            } else if (firebaseError.code === 'auth/email-already-in-use') {
                toast.error('이미 사용 중인 이메일입니다.');
            } else if (firebaseError.code === 'auth/too-many-requests') {
                toast.error('로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요.');
            } else {
                toast.error(mode === 'login' ? '로그인 중 오류가 발생했습니다.' : '회원가입 중 오류가 발생했습니다.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle();
            toast.success('Google 로그인 성공!');
            setTimeout(() => handleRedirect(userProfile?.role), 800);
        } catch (error: unknown) {
            console.error(error);
            toast.error('Google 로그인 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 relative">
            <div className="w-full max-w-[400px]">
                {/* 로고 */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-[#4F46E5] flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
                        <Package className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#0F172A]">흥덕고 인벤토리 프로젝트</h1>
                    <p className="text-sm text-[#64748B] mt-1">교내 물품 구매 신청 시스템</p>
                </div>

                {/* 카드 */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                    {/* 탭 */}
                    <div className="flex border border-[#E5E7EB] rounded-lg p-1 mb-6 bg-[#F8FAFC]">
                        <button
                            type="button"
                            onClick={() => { setMode('login'); setErrors({}); }}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${mode === 'login' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                        >
                            로그인
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMode('signup'); setErrors({}); }}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${mode === 'signup' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                        >
                            회원가입
                        </button>
                    </div>

                    <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
                        {/* 이름 (회원가입 전용) */}
                        {mode === 'signup' && (
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-xs font-medium text-[#64748B]">
                                    이름
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="홍길동"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className={`pl-10 ${errors.name ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                                        disabled={isLoading}
                                        autoComplete="name"
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-xs text-red-500" role="alert">{errors.name}</p>
                                )}
                            </div>
                        )}

                        {/* 이메일 */}
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-xs font-medium text-[#64748B]">
                                이메일
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="teacher@school.kr"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`pl-10 ${errors.email ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                                    disabled={isLoading}
                                    autoComplete="email"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-xs text-red-500" role="alert">{errors.email}</p>
                            )}
                        </div>

                        {/* 비밀번호 */}
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-xs font-medium text-[#64748B]">
                                비밀번호
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder={mode === 'signup' ? '6자 이상 입력' : '비밀번호 입력'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`pl-10 ${errors.password ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                                    disabled={isLoading}
                                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                                />
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-500" role="alert">{errors.password}</p>
                            )}
                        </div>

                        {/* 제출 버튼 */}
                        <Button
                            type="submit"
                            className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white transition-colors duration-150"
                            disabled={isLoading}
                            id="auth-submit-btn"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {mode === 'login' ? '로그인 중...' : '가입 중...'}
                                </span>
                            ) : (mode === 'login' ? '로그인' : '회원가입')}
                        </Button>
                    </form>

                    {/* 구분선 */}
                    <div className="relative my-5">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#E5E7EB]" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-3 text-xs text-[#94A3B8]">또는</span>
                        </div>
                    </div>

                    {/* Google 로그인 */}
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#0F172A]"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        id="google-login-btn"
                    >
                        <Chrome className="w-4 h-4 mr-2" />
                        Google로 {mode === 'login' ? '로그인' : '가입'}
                    </Button>
                </div>

                <p className="text-center text-xs text-[#94A3B8] mt-6">
                    {mode === 'login' ? '계정이 없으신가요? 위의 회원가입 탭을 이용하세요.' : '이미 계정이 있으신가요? 로그인 탭을 이용하세요.'}
                </p>
            </div>

            {/* 하단 개발자 표시 */}
            <div className="absolute bottom-4 right-6 text-[11px] text-[#94A3B8] tracking-widest">
                made by BK
            </div>
        </div>
    );
}
