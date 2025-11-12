import React from 'react';
export interface IALayoutProps {
    children: React.ReactNode;
    header?: React.ReactNode;
    sidebar?: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    sidebarCollapsed?: boolean;
    onSidebarToggle?: () => void;
}
export declare const IALayout: React.FC<IALayoutProps>;
