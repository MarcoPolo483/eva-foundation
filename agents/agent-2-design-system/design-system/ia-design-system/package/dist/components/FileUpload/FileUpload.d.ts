import React from 'react';
export interface FileUploadFile {
    file: File;
    id: string;
    progress?: number;
    error?: string;
    status: 'pending' | 'uploading' | 'complete' | 'error';
}
export interface IAFileUploadProps {
    accept?: string;
    multiple?: boolean;
    maxSize?: number;
    maxFiles?: number;
    onFileSelect?: (files: File[]) => void;
    onFileUpload?: (file: File) => Promise<void>;
    className?: string;
    disabled?: boolean;
    dragAndDrop?: boolean;
    children?: React.ReactNode;
}
export declare const IAFileUpload: React.FC<IAFileUploadProps>;
