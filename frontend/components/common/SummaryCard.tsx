import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
    title: string;
    value: string | number;
    icon?: LucideIcon;
    iconColor?: string;
    iconBg?: string;
    description?: string;
    className?: string;
}

export function SummaryCard({
    title,
    value,
    icon: Icon,
    iconColor = 'text-[#4F46E5]',
    iconBg = 'bg-[#EEF2FF]',
    description,
    className,
}: SummaryCardProps) {
    return (
        <div
            className={cn(
                'bg-white border border-[#E5E7EB] rounded-lg px-5 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide">{title}</p>
                    <p className="text-2xl font-bold text-[#0F172A] mt-1">{value}</p>
                    {description && (
                        <p className="text-xs text-[#94A3B8] mt-1">{description}</p>
                    )}
                </div>
                {Icon && (
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
                        <Icon className={cn('w-5 h-5', iconColor)} />
                    </div>
                )}
            </div>
        </div>
    );
}
