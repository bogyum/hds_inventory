import { NextResponse } from 'next/server';
import { adminAuth, adminDb, verifyAdmin } from '@/lib/firebase-admin';

export async function DELETE(
    request: Request,
    { params }: { params: { userId: string } }
) {
    try {
        const adminUid = await verifyAdmin(request);
        if (!adminUid) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await params;

        // Prevent admin from deleting themselves
        if (userId === adminUid) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        // 1. Delete from Firebase Auth
        await adminAuth.deleteUser(userId);

        // 2. Delete from Firestore users collection
        await adminDb.collection('users').doc(userId).delete();

        return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
