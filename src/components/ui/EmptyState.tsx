'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface EmptyStateProps {
    type: 'devices' | 'connections' | 'notes';
    onAction?: () => void;
}

export function EmptyState({ type, onAction }: EmptyStateProps) {
    const { t, language } = useLanguage();

    const content = {
        devices: {
            icon: (
                <svg className="w-16 h-16 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 0 0 2-2V5a2 2 0 0 0 -2-2H5a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2z" />
                </svg>
            ),
            title: language === 'tr' ? 'Henüz cihaz yok' : 'No devices yet',
            description: language === 'tr'
                ? 'Yukarıdaki butonlardan PC, Switch veya Router ekleyin'
                : 'Add a PC, Switch, or Router from the buttons above',
            actionLabel: t.addDevice
        },
        connections: {
            icon: (
                <svg className="w-16 h-16 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 0 0 -5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0 -5.656-5.656l-1.1 1.1" />
                </svg>
            ),
            title: language === 'tr' ? 'Bağlantı yok' : 'No connections',
            description: language === 'tr'
                ? 'İki cihazın portlarına tıklayarak kablo bağlayın'
                : 'Click on two device ports to connect them with a cable',
            actionLabel: ''
        },
        notes: {
            icon: (
                <svg className="w-16 h-16 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
            title: language === 'tr' ? 'Not yok' : 'No notes',
            description: language === 'tr'
                ? 'Topolojinize açıklama eklemek için not ekleyin'
                : 'Add a note to annotate your topology',
            actionLabel: t.addNote
        }
    };

    const { icon, title, description, actionLabel } = content[type];

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 p-4 rounded-full bg-muted/30">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground/70 max-w-xs mb-4">{description}</p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}