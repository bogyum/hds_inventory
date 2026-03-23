import { NextResponse } from 'next/server';
import { adminAuth, verifyAdmin } from '@/lib/firebase-admin';

export async function PATCH(
    request: Request,
    { params }: { params: { userId: string } }
) {
    try {
        const adminUid = await verifyAdmin(request);
        if (!adminUid) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await params;
        const body = await request.json();
        const { newPassword } = body;

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
        }

        // Update the user's password in Firebase Auth
        await adminAuth.updateUser(userId, {
            password: newPassword,
        });

        return NextResponse.json({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
        console.error('Error updating password:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
