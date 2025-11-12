import React from 'react';
export interface IAPanelProps {
    children: React.ReactNode;
    variant?: 'default' | 'work' | 'web' | 'compare';
    className?: string;
    title?: string;
    subtitle?: string;
    actions?: React.ReactNode;
    collapsible?: boolean;
    defaultExpanded?: boolean;
    onExpandChange?: (expanded: boolean) => void;
}
export declare const IAPanel: React.FC<IAPanelProps>;
