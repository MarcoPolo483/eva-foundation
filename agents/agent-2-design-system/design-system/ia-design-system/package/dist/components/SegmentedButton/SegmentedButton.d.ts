import React from 'react';
export interface SegmentedButtonOption {
    key: string;
    text: string;
    iconProps?: any;
    disabled?: boolean;
}
export interface IASegmentedButtonProps {
    options: SegmentedButtonOption[];
    selectedKey?: string;
    onChange?: (key: string) => void;
    className?: string;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
}
export declare const IASegmentedButton: React.FC<IASegmentedButtonProps>;
