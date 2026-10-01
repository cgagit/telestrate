import React from 'react';
import { MicStatus } from '../types';

export const PlayIcon: React.FC = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 5V19L19 12L8 5Z" />
    </svg>
);

export const PauseIcon: React.FC = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 19H10V5H6V19ZM14 5V19H18V5H14Z" />
    </svg>
);

// Re-purposed for "Jump 1s"
export const RewindIcon: React.FC = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="11 17 6 12 11 7"></polyline>
        <polyline points="18 17 13 12 18 7"></polyline>
    </svg>
);

// Re-purposed for "Jump 1s"
export const FastForwardIcon: React.FC = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="13 17 18 12 13 7"></polyline>
        <polyline points="6 17 11 12 6 7"></polyline>
    </svg>
);

export const StepBackwardIcon: React.FC = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="10" y1="5" x2="10" y2="19" />
        <polygon points="19 5 10 12 19 19 19 5" />
    </svg>
);

export const StepForwardIcon: React.FC = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="14" y1="5" x2="14" y2="19" />
        <polygon points="5 5 14 12 5 19 5 5" />
    </svg>
);

export const VolumeIcon: React.FC = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
);

export const MuteIcon: React.FC = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
    </svg>
);


export const UploadIcon: React.FC = () => (
    <svg className="w-12 h-12 text-gray-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

export const PencilIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
);

export const EraserIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z" />
      <line x1="17" y1="17" x2="11" y2="11" />
    </svg>
);

export const UndoIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 13H4.83l5.59-5.59L9 6l-8 8 8 8 1.41-1.41L4.83 15H21v-2z"/>
    </svg>
);

export const RedoIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 13h16.17l-5.59-5.59L15 6l8 8-8 8-1.41-1.41L19.17 15H3v-2z"/>
    </svg>
);

export const TrashIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

export const RecordIcon: React.FC<{ isRecording?: boolean; className?: string }> = ({ isRecording, className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        {isRecording 
            ? <rect x="6" y="6" width="12" height="12" rx="2" />
            : <circle cx="12" cy="12" r="8" />
        }
    </svg>
);


export const MicrophoneIcon: React.FC<{ status: MicStatus }> = ({ status }) => {
    const color = status === 'active' ? 'text-green-500' : status === 'error' ? 'text-red-500' : 'text-gray-400';
    return (
        <svg className={`w-6 h-6 ${color} transition-colors`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
            {status === 'error' && <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2.5"></line>}
        </svg>
    );
};


// New Tool Icons
export const LineIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="19" x2="19" y2="5"></line>
    </svg>
);

export const ArrowIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="19" x2="19" y2="5"></line>
        <polyline points="10 5 19 5 19 14"></polyline>
    </svg>
);

export const RectangleIcon: React.FC<{className?: string, filled?: boolean}> = ({className, filled}) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={filled ? "currentColor" : "none"}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fillOpacity={filled ? 0.3 : 0}></rect>
    </svg>
);

export const CircleIcon: React.FC<{className?: string, filled?: boolean}> = ({className, filled}) => (
     <svg className={className} width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={filled ? "currentColor" : "none"}>
        <circle cx="12" cy="12" r="9" fillOpacity={filled ? 0.3 : 0}></circle>
    </svg>
);

export const FolderOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className || "w-5 h-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
);

export const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className || "w-5 h-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

export const KeyboardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className || "w-6 h-6"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
        <line x1="6" y1="8" x2="8" y2="8"></line>
        <line x1="10" y1="8" x2="14" y2="8"></line>
        <line x1="16" y1="8" x2="18" y2="8"></line>
        <line x1="6" y1="12" x2="8" y2="12"></line>
        <line x1="10" y1="12" x2="14" y2="12"></line>
        <line x1="16" y1="12" x2="18" y2="12"></line>
        <line x1="7" y1="16" x2="17" y2="16"></line>
    </svg>
);