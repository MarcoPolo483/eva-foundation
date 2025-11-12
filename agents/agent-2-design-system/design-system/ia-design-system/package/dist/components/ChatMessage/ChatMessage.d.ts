import React from 'react';
export interface IAChatMessageProps {
    children: React.ReactNode;
    role: 'user' | 'assistant' | 'system';
    source?: 'work' | 'web' | 'compare';
    timestamp?: Date;
    avatar?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
    loading?: boolean;
}
export declare const IAChatMessage: React.FC<IAChatMessageProps>;
