import { NextResponse } from 'next/server';
import { adminAuth, adminDb, verifyAdmin } from '@/lib/firebase-admin';

export async function GET(request: Request) {
    try {
        const adminUid = await verifyAdmin(request);
        if (!adminUid) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all Firebase Auth users
        const listUsersResult = await adminAuth.listUsers(1000);
        const authUsers = listUsersResult.users;

        // Fetch all user roles from Firestore
        const usersSnapshot = await adminDb.collection('users').get();
        const firestoreUsers = new Map();
        usersSnapshot.forEach(doc => {
            firestoreUsers.set(doc.id, doc.data());
        });

        // Combine Auth and Firestore data
        const combinedUsers = authUsers.map(user => {
            const fsData = firestoreUsers.get(user.uid) || {};
            return {
                uid: user.uid,
                email: user.email,
                name: fsData.name || user.displayName || '이름 없음',
                role: fsData.role || 'user',
                createdAt: user.metadata.creationTime,
                lastSignInTime: user.metadata.lastSignInTime,
            };
        });

        return NextResponse.json({ users: combinedUsers });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
