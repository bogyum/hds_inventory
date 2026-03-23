import { cn } from '@/lib/utils';

export type ItemStatus = 'pending' | 'purchased' | 'distributed' | 'unavailable';

interface StatusBadgeProps {
    status: ItemStatus;
    className?: string;
}

const statusConfig: Record<ItemStatus, { label: string; className: string }> = {
    pending: {
        label: '구매 전',
        className: 'badge-pending',
    },
    purchased: {
        label: '구매 완료',
        className: 'badge-purchased',
    },
    distributed: {
        label: '배부 완료',
        className: 'badge-distributed',
    },
    unavailable: {
        label: '구매 불가',
        className: 'badge-unavailable',
    },
};

export function getItemStatus(isPurchased: boolean, isDistributed: boolean, isUnavailable?: boolean): ItemStatus {
    if (isUnavailable) return 'unavailable';
    if (isDistributed) return 'distributed';
    if (isPurchased) return 'purchased';
    return 'pending';
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status];
    return (
        <span
            className={cn(
                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                config.className,
                className
            )}
        >
            {config.label}
        </span>
    );
}
