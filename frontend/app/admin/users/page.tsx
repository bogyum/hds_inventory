'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';
import { ShieldAlert, KeyRound, Trash2, Search, X } from 'lucide-react';

interface UserData {
    uid: string;
    email: string;
    name: string;
    role: string;
    createdAt?: string;
    lastSignInTime?: string;
}

export default function AdminUsersPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal states
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchUsers = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const token = await user.getIdToken();
            const res = await fetch('/api/admin/users', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data.users || []);
        } catch (error) {
            console.error(error);
            toast.error('회원 목록을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [user]);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedUser) return;
        if (newPassword.length < 6) {
            toast.error('비밀번호는 6자리 이상이어야 합니다.');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/admin/users/${selectedUser.uid}/password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ newPassword })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to change password');
            }

            toast.success(`${selectedUser.name}님의 비밀번호가 변경되었습니다.`);
            setPasswordModalOpen(false);
            setNewPassword('');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || '비밀번호 변경에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!user || !selectedUser) return;
        
        setIsSubmitting(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/admin/users/${selectedUser.uid}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to delete user');
            }

            toast.success(`${selectedUser.name}님을 강제 탈퇴 처리했습니다.`);
            setDeleteModalOpen(false);
            fetchUsers(); // Refresh the list
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || '회원 탈퇴 처리에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.includes(searchTerm) || 
        u.email.includes(searchTerm)
    );

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2">
                        회원 관리
                    </h1>
                    <p className="text-sm text-[#64748B] mt-1">
                        시스템에 등록된 사용자를 조회하고 관리합니다.
                    </p>
                </div>
                
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input
                        type="text"
                        placeholder="이름 또는 이메일 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-shadow"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-[#64748B] uppercase bg-[#F8FAFC] border-b border-[#E5E7EB] whitespace-nowrap">
                            <tr>
                                <th className="px-6 py-4 font-medium">이름 / 역할</th>
                                <th className="px-6 py-4 font-medium hidden sm:table-cell">이메일</th>
                                <th className="px-6 py-4 font-medium hidden md:table-cell">가입일</th>
                                <th className="px-6 py-4 font-medium text-right">관리 작업</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-[#64748B]">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
                                            데이터를 불러오는 중...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-[#64748B]">
                                        검색된 사용자가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.uid} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F8FAFC] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-[#0F172A]">{u.name}</div>
                                            <div className="text-xs mt-0.5 max-w-[150px] truncate sm:hidden text-[#64748B]">{u.email}</div>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium mt-1 ${
                                                u.role === 'admin' 
                                                ? 'bg-purple-100 text-purple-700' 
                                                : 'bg-slate-100 text-slate-700'
                                            }`}>
                                                {u.role === 'admin' ? '관리자' : '일반 교사'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[#64748B] hidden sm:table-cell">
                                            {u.email}
                                        </td>
                                        <td className="px-6 py-4 text-[#64748B] hidden md:table-cell">
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {u.uid !== user?.uid ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(u);
                                                            setPasswordModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-[#64748B] hover:text-[#4F46E5] hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="비밀번호 변경"
                                                    >
                                                        <KeyRound className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(u);
                                                            setDeleteModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors"
                                                        title="강제 탈퇴"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-[#94A3B8] font-medium px-2">내 계정</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Password Modal */}
            {passwordModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                            <h3 className="font-semibold text-[#0F172A] flex items-center gap-2">
                                <KeyRound className="w-4 h-4 text-[#4F46E5]" />
                                비밀번호 강제 변경
                            </h3>
                            <button onClick={() => setPasswordModalOpen(false)} className="text-[#94A3B8] hover:text-[#0F172A]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handlePasswordChange} className="p-5">
                            <p className="text-sm text-[#64748B] mb-4">
                                <strong className="text-[#0F172A]">{selectedUser.name}</strong>님의 새로운 비밀번호를 설정합니다. 사용자는 다음 로그인부터 새로 설정된 비밀번호를 사용해야 합니다.
                            </p>
                            <input
                                type="password"
                                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                                placeholder="새 비밀번호 (6자리 이상)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength={6}
                                required
                            />
                            <div className="mt-5 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPasswordModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-[#E5E7EB] text-[#64748B] font-medium rounded-lg hover:bg-[#F8FAFC]"
                                    disabled={isSubmitting}
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-medium rounded-lg flex justify-center items-center"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        '변경 확인'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-5 py-4 flex items-center justify-between border-b border-red-100 bg-red-50">
                            <h3 className="font-semibold text-red-700 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5" />
                                강제 탈퇴 경고
                            </h3>
                            <button onClick={() => setDeleteModalOpen(false)} className="text-red-400 hover:text-red-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-[#475569] mb-4 leading-relaxed">
                                정말 <strong className="text-[#0F172A]">{selectedUser.name}</strong> 님을 시스템에서 완전히 탈퇴시키시겠습니까? 
                            </p>
                            <p className="text-xs text-red-600 font-medium mb-5 p-3 bg-red-50 rounded-lg">
                                주의: 이 작업은 되돌릴 수 없으며, 사용자의 접속 및 모든 개인 시스템 권한이 영구적으로 박탈됩니다. (단, 기존의 신청 내역 등은 보존될 수 있습니다.)
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDeleteModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-[#E5E7EB] text-[#64748B] font-medium rounded-lg hover:bg-[#F8FAFC]"
                                    disabled={isSubmitting}
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleDeleteUser}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex justify-center items-center"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        '탈퇴 실행'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
