'use client';

interface HeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function Header({ title, description, action }: HeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-2xl font-bold text-[#0F172A]">{title}</h1>
                {description && (
                    <p className="text-sm text-[#64748B] mt-0.5">{description}</p>
                )}
            </div>
            {action && (
                <div className="flex items-center gap-2">
                    {action}
                </div>
            )}
        </div>
    );
}
