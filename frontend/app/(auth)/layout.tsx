import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '로그인 | bk.inventory',
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
