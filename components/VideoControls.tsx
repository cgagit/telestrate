import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PlayIcon, PauseIcon, RewindIcon, FastForwardIcon, StepBackwardIcon, StepForwardIcon, VolumeIcon, MuteIcon, KeyboardIcon, MicrophoneIcon } from './icons';
import { MicStatus } from '../types';

interface VideoControlsProps {
    isPlaying: boolean;
    isMuted: boolean;
    volume: number;
    progress: number;
    duration: number;
    playbackRate: number;
    micStatus: MicStatus;
    onPlayPause: () => void;
    onToggleMute: () => void;
    onVolumeChange: (vol: number) => void;
    onSeek: (time: number) => void;
    onPlaybackRateChange: (rate: number) => void;
    onSeekBackward: () => void;
    onSeekForward: () => void;
    onStepBackward: () => void;
    onStepForward: () => void;
    onToggleShortcuts: () => void;
}

// Button that repeats action when held down (useful for frame-by-frame stepping)
const RepeatButton: React.FC<{
    onClick: () => void;
    className?: string;
    children: React.ReactNode;
    ariaLabel: string;
}> = ({ onClick, className, children, ariaLabel }) => {
    const intervalRef = useRef<number | null>(null);
    const timeoutRef = useRef<number | null>(null);

    const stop = useCallback(() => {
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => stop();
    }, [stop]);

    const start = (e: React.PointerEvent) => {
        stop();
        onClick(); 
        
        timeoutRef.current = window.setTimeout(() => {
            intervalRef.current = window.setInterval(() => {
                onClick();
            }, 66); 
        }, 350);
    };

    return (
        <button
            onPointerDown={start}
            onPointerUp={stop}
            onPointerLeave={stop}
            onPointerCancel={stop}
            className={className}
            aria-label={ariaLabel}
            type="button"
        >
            {children}
        </button>
    );
};

const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) {
        return '00:00';
    }
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const VideoControls: React.FC<VideoControlsProps> = ({
    isPlaying,
    isMuted,
    volume,
    progress,
    duration,
    playbackRate,
    micStatus,
    onPlayPause,
    onToggleMute,
    onVolumeChange,
    onSeek,
    onPlaybackRateChange,
    onSeekBackward,
    onSeekForward,
    onStepBackward,
    onStepForward,
    onToggleShortcuts,
}) => {
    const progressBarRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [localProgress, setLocalProgress] = useState(progress);
    
    // Volume slider hover visibility
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);

    // Sync local progress with prop progress only when not actively dragging
    useEffect(() => {
        if (!isDragging) {
            setLocalProgress(progress);
        }
    }, [progress, isDragging]);

    const calculateProgress = useCallback((clientX: number) => {
        if (!progressBarRef.current || !duration) return 0;
        const rect = progressBarRef.current.getBoundingClientRect();
        if (rect.width === 0) return 0;
        const x = clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        return percentage * duration;
    }, [duration]);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        setIsDragging(true);
        
        const newTime = calculateProgress(e.clientX);
        setLocalProgress(newTime);
        onSeek(newTime);
        
        try {
            (e.target as Element).setPointerCapture(e.pointerId);
        } catch {
            // Fallback for environments without pointer capture
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const newTime = calculateProgress(e.clientX);
        setLocalProgress(newTime);
        onSeek(newTime);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        setIsDragging(false);
        try {
            (e.target as Element).releasePointerCapture(e.pointerId);
        } catch {
            // Fallback
        }
        
        const newTime = calculateProgress(e.clientX);
        onSeek(newTime);
    };

    const handleJumpBack = () => onSeek(Math.max(0, progress - 1));
    const handleJumpForward = () => onSeek(Math.min(duration, progress + 1));

    const rates = [0.25, 0.5, 0.75, 1, 1.5, 2];

    return (
        <div className="pt-1.5 space-y-2 select-none">
            {/* Progress Scrubber */}
            <div className="flex items-center gap-3 relative">
                <span className="text-xs font-mono text-gray-300 w-11 text-right select-none">{formatTime(localProgress)}</span>
                
                <div 
                    ref={progressBarRef}
                    className="w-full relative group py-4 cursor-pointer touch-none"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    role="slider"
                    aria-valuemin={0}
                    aria-valuemax={duration}
                    aria-valuenow={localProgress}
                    aria-label="Video Progress"
                >
                    {/* Scrubber Track */}
                    <div className="absolute top-1/2 left-0 w-full h-1.5 bg-gray-700 rounded-lg pointer-events-none transform -translate-y-1/2 overflow-hidden" />

                    {/* Scrubber Fill */}
                    <div 
                        className="absolute top-1/2 left-0 h-1.5 bg-blue-500 rounded-lg pointer-events-none transform -translate-y-1/2"
                        style={{ width: `${(localProgress / (duration || 1)) * 100}%` }}
                    />

                    {/* Scrubber Thumb */}
                    <div 
                        className={`absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-md border border-gray-200 pointer-events-none transition-transform transform -translate-y-1/2 -translate-x-1/2 ${
                            isDragging ? 'scale-125' : 'group-hover:scale-110'
                        }`}
                        style={{ left: `${(localProgress / (duration || 1)) * 100}%` }}
                    />
                </div>

                <span className="text-xs font-mono text-gray-400 w-11 text-left select-none">{formatTime(duration)}</span>
            </div>
            
            {/* Control Buttons Row */}
            <div className="flex items-center justify-between relative min-h-11">
                {/* Left Controls: Shortcuts modal & mic status */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onToggleShortcuts} 
                        className="p-2 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors" 
                        title="Keyboard Shortcuts (? or K)"
                        type="button"
                    >
                        <KeyboardIcon className="w-5 h-5" />
                    </button>
                    <div 
                        className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-800/80 text-xs text-gray-300" 
                        title={micStatus === 'active' ? 'Microphone Active' : micStatus === 'error' ? 'Microphone Permission Denied' : 'Microphone Ready'}
                    >
                        <MicrophoneIcon status={micStatus} />
                        <span className="text-[11px] hidden sm:inline text-gray-400">
                            {micStatus === 'active' ? 'Voiceover ON' : micStatus === 'error' ? 'Mic Blocked' : 'Voiceover'}
                        </span>
                    </div>
                </div>

                {/* Center Controls: Frame Step & Playback */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleJumpBack} 
                        className="text-gray-400 hover:text-white transition-colors p-1.5 rounded hover:bg-gray-800" 
                        aria-label="Jump back 1s (Left Arrow)"
                        title="Jump back 1s (←)"
                        type="button"
                    >
                        <RewindIcon />
                    </button>
                    
                    <RepeatButton 
                        onClick={onStepBackward} 
                        className="text-gray-400 hover:text-white transition-colors p-1.5 rounded hover:bg-gray-800" 
                        ariaLabel="Step back 1 frame (,)"
                    >
                        <StepBackwardIcon />
                    </RepeatButton>
                    
                    <button 
                        onClick={onPlayPause} 
                        className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-full shadow-md transition-transform transform active:scale-95" 
                        aria-label={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                        title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                        type="button"
                    >
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    
                    <RepeatButton 
                        onClick={onStepForward} 
                        className="text-gray-400 hover:text-white transition-colors p-1.5 rounded hover:bg-gray-800" 
                        ariaLabel="Step forward 1 frame (.)"
                    >
                        <StepForwardIcon />
                    </RepeatButton>

                    <button 
                        onClick={handleJumpForward} 
                        className="text-gray-400 hover:text-white transition-colors p-1.5 rounded hover:bg-gray-800" 
                        aria-label="Jump forward 1s (Right Arrow)"
                        title="Jump forward 1s (→)"
                        type="button"
                    >
                        <FastForwardIcon />
                    </button>
                </div>

                {/* Right Controls: Volume slider & Slow-mo / Speed buttons */}
                <div className="flex items-center gap-2">
                    {/* Volume with hover slider */}
                    <div 
                        className="relative flex items-center"
                        onMouseEnter={() => setShowVolumeSlider(true)}
                        onMouseLeave={() => setShowVolumeSlider(false)}
                    >
                        <button 
                            onClick={onToggleMute} 
                            className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-800 transition-colors" 
                            aria-label={isMuted ? "Unmute (M)" : "Mute (M)"}
                            title={isMuted ? "Unmute (M)" : "Mute (M)"}
                            type="button"
                        >
                            {isMuted || volume === 0 ? <MuteIcon /> : <VolumeIcon />}
                        </button>

                        {showVolumeSlider && (
                            <div className="absolute right-8 bg-gray-800 px-2 py-1.5 rounded-md shadow-lg border border-gray-700 flex items-center z-30">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={isMuted ? 0 : volume}
                                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                                    className="w-16 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    aria-label="Volume slider"
                                />
                            </div>
                        )}
                    </div>

                    {/* Speed selector */}
                    <div className="flex items-center bg-gray-800 rounded-md p-0.5 gap-0.5">
                        {rates.map(rate => (
                            <button
                                key={rate}
                                onClick={() => onPlaybackRateChange(rate)}
                                className={`px-1.5 py-1 text-[11px] font-semibold rounded transition-colors ${
                                    playbackRate === rate 
                                        ? 'bg-blue-600 text-white shadow-sm' 
                                        : 'text-gray-400 hover:text-white hover:bg-gray-700/60'
                                }`}
                                type="button"
                            >
                                {rate === 0.25 ? '.25x' : rate === 0.75 ? '.75x' : `${rate}x`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoControls;
