import React, { useState, useRef, useCallback, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import VideoControls from './components/VideoControls';
import DrawingToolbar from './components/DrawingToolbar';
import DrawingCanvas from './components/DrawingCanvas';
import { UploadIcon, RecordIcon, FolderOpenIcon, DownloadIcon } from './components/icons';
import { Tool, Stroke, Quality, MicStatus } from './types';

const ShortcutsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-800 p-6 rounded-xl shadow-2xl max-w-md w-full border border-gray-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-700 mb-4">
                <h3 className="text-lg font-bold text-white">Keyboard Shortcuts</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-sm font-semibold p-1">✕</button>
            </div>
            <div className="space-y-2.5 text-gray-300 text-sm">
                <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                    <span className="font-mono bg-gray-700/80 px-2 py-0.5 rounded text-xs text-white">Space / K</span> 
                    <span>Play / Pause</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                    <span className="font-mono bg-gray-700/80 px-2 py-0.5 rounded text-xs text-white">← / →</span> 
                    <span>Jump 1 Second</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                    <span className="font-mono bg-gray-700/80 px-2 py-0.5 rounded text-xs text-white">, / .</span> 
                    <span>Step 1 Frame (Hold down to scrub continuously)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                    <span className="font-mono bg-gray-700/80 px-2 py-0.5 rounded text-xs text-white">J / L</span> 
                    <span>Hold to Smooth Scrub Backward / Forward</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                    <span className="font-mono bg-gray-700/80 px-2 py-0.5 rounded text-xs text-white">0</span> 
                    <span>Restart Play (00:00)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                    <span className="font-mono bg-gray-700/80 px-2 py-0.5 rounded text-xs text-white">1</span> 
                    <span>0.5x Slow Motion</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                    <span className="font-mono bg-gray-700/80 px-2 py-0.5 rounded text-xs text-white">2</span> 
                    <span>1.0x Regular Speed</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                    <span className="font-mono bg-gray-700/80 px-2 py-0.5 rounded text-xs text-white">Shift (Hold + Drag)</span> 
                    <span>Perfect Circle / Square (Center-Out)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                    <span className="font-mono bg-gray-700/80 px-2 py-0.5 rounded text-xs text-white">Z / Shift+Z</span> 
                    <span>Undo / Redo Annotation</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                    <span className="font-mono bg-gray-700/80 px-2 py-0.5 rounded text-xs text-white">C</span> 
                    <span>Clear All Annotations</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                    <span className="font-mono bg-gray-700/80 px-2 py-0.5 rounded text-xs text-white">R</span> 
                    <span>Start / Stop Recording</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                    <span className="font-mono bg-gray-700/80 px-2 py-0.5 rounded text-xs text-white">M</span> 
                    <span>Mute / Unmute</span>
                </div>
                <div className="flex justify-between items-center py-1">
                    <span className="font-mono bg-gray-700/80 px-2 py-0.5 rounded text-xs text-white">F</span> 
                    <span>Toggle Fullscreen</span>
                </div>
            </div>
            <button 
                onClick={onClose} 
                className="mt-5 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors"
            >
                Got It
            </button>
        </div>
    </div>
);

const App: React.FC = () => {
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [playbackRate, setPlaybackRate] = useState<number>(1);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [volume, setVolume] = useState<number>(1);
    
    // Telestration Tools State
    const [tool, setTool] = useState<Tool>('arrow');
    const [color, setColor] = useState<string>('#FFE600');
    const [drawingBrushSize, setDrawingBrushSize] = useState<number>(5);
    const [eraserBrushSize, setEraserBrushSize] = useState<number>(24);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [redoStrokes, setRedoStrokes] = useState<Stroke[]>([]);

    const activeBrushSize = tool === 'eraser' ? eraserBrushSize : drawingBrushSize;

    const handleSetTool = useCallback((newTool: Tool) => {
        setTool(newTool);
    }, []);

    const handleBrushSizeChange = useCallback((newSize: number) => {
        if (tool === 'eraser') {
            setEraserBrushSize(newSize);
        } else {
            setDrawingBrushSize(newSize);
        }
    }, [tool]);

    // Recording State
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
    const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
    const [recordedVideoType, setRecordedVideoType] = useState<string>('video/webm');
    const [quality, setQuality] = useState<Quality>('1080p');
    const [micStatus, setMicStatus] = useState<MicStatus>('idle');
    const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
    const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
    
    // Drag & Drop State
    const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrubbingRef = useRef<{ direction: null | 'forward' | 'backward', animationFrameId: null | number }>({ direction: null, animationFrameId: null });
    const wasPlayingBeforeScrubRef = useRef<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Smart seeking refs
    const isSeekingRef = useRef(false);
    const nextSeekTimeRef = useRef<number | null>(null);

    // Continuous frame stepping ref
    const stepHoldRef = useRef<{
        timeoutId: number | null;
        intervalId: number | null;
        activeKey: string | null;
    }>({ timeoutId: null, intervalId: null, activeKey: null });

    const stopStepHold = useCallback(() => {
        if (stepHoldRef.current.timeoutId !== null) {
            clearTimeout(stepHoldRef.current.timeoutId);
            stepHoldRef.current.timeoutId = null;
        }
        if (stepHoldRef.current.intervalId !== null) {
            clearInterval(stepHoldRef.current.intervalId);
            stepHoldRef.current.intervalId = null;
        }
        stepHoldRef.current.activeKey = null;
    }, []);

    // Recording timer
    useEffect(() => {
        let interval: number;
        if (isRecording) {
            setRecordingSeconds(0);
            interval = window.setInterval(() => {
                setRecordingSeconds(s => s + 1);
            }, 1000);
        } else {
            setRecordingSeconds(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRecording]);

    // Load Video File / URL with proper cleanup
    const loadVideoUrl = useCallback((url: string) => {
        setVideoUrl(prev => {
            if (prev && prev.startsWith('blob:')) {
                URL.revokeObjectURL(prev);
            }
            return url;
        });
        setRecordedVideoUrl(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        setIsPlaying(false);
        setProgress(0);
        setDuration(0);
        setStrokes([]);
        setRedoStrokes([]);
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            loadVideoUrl(url);
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    const handleDownloadRecording = () => {
        if (!recordedVideoUrl) return;
        const a = document.createElement('a');
        a.href = recordedVideoUrl;
        const ext = recordedVideoType.includes('mp4') ? 'mp4' : 'webm';
        a.download = `telestration-review-${Date.now()}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    
    const handlePlayPause = useCallback(() => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play().catch(() => {});
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    }, []);

    const handleMuteToggle = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    const handleVolumeChange = useCallback((newVol: number) => {
        setVolume(newVol);
        if (newVol > 0 && isMuted) {
            setIsMuted(false);
        }
        if (videoRef.current) {
            videoRef.current.volume = newVol;
        }
    }, [isMuted]);

    // Playback scrubber loop
    useEffect(() => {
        let rafId: number;
        const loop = () => {
            if (isPlaying && videoRef.current && !scrubbingRef.current.direction) {
                setProgress(videoRef.current.currentTime);
            }
            rafId = requestAnimationFrame(loop);
        };

        if (isPlaying) {
            loop();
        }

        return () => cancelAnimationFrame(rafId);
    }, [isPlaying]);

    // Smart Seek to prevent decoder freezing
    const handleSeek = useCallback((time: number) => {
        const t = Math.max(0, Math.min(duration, time));
        setProgress(t);
        
        if (!videoRef.current) return;

        if (isSeekingRef.current) {
            nextSeekTimeRef.current = t;
            return;
        }

        isSeekingRef.current = true;
        videoRef.current.currentTime = t;
    }, [duration]);

    const handleSeeked = useCallback(() => {
        isSeekingRef.current = false;
        if (nextSeekTimeRef.current !== null && videoRef.current) {
            const t = nextSeekTimeRef.current;
            nextSeekTimeRef.current = null;
            handleSeek(t);
        }
    }, [handleSeek]);

    const handleSeekDelta = useCallback((deltaSeconds: number) => {
        if (videoRef.current) {
            const currentTime = videoRef.current.currentTime;
            handleSeek(currentTime + deltaSeconds);
        }
    }, [handleSeek]);

    const seekBackward = useCallback(() => {
        if (!videoRef.current) return;
        handleSeek(videoRef.current.currentTime - 1);
    }, [handleSeek]);

    const seekForward = useCallback(() => {
        if (!videoRef.current) return;
        handleSeek(videoRef.current.currentTime + 1);
    }, [handleSeek]);

    const stepBackward = useCallback(() => {
        if (!videoRef.current) return;
        if (!videoRef.current.paused) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
        const newTime = Math.max(0, videoRef.current.currentTime - 1 / 30);
        handleSeek(newTime);
    }, [handleSeek]);

    const stepForward = useCallback(() => {
        if (!videoRef.current) return;
        if (!videoRef.current.paused) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
        const newTime = Math.min(duration, videoRef.current.currentTime + 1 / 30);
        handleSeek(newTime);
    }, [duration, handleSeek]);

    const handlePlaybackRateChange = useCallback((rate: number) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
            setPlaybackRate(rate);
        }
    }, []);

    // Annotations management
    const handleAddStroke = useCallback((stroke: Stroke) => {
        setStrokes(prev => [...prev, stroke]);
        setRedoStrokes([]);
    }, []);

    const handleUndo = useCallback(() => {
        setStrokes(prev => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            setRedoStrokes(r => [...r, last]);
            return prev.slice(0, -1);
        });
    }, []);

    const handleRedo = useCallback(() => {
        setRedoStrokes(prev => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            setStrokes(s => [...s, last]);
            return prev.slice(0, -1);
        });
    }, []);

    const handleClearAll = useCallback(() => {
        setStrokes([]);
        setRedoStrokes([]);
    }, []);

    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    };

    // Keyboard scrubbing loop (J/L keys)
    const scrubLoop = useCallback(() => {
        if (!videoRef.current || !scrubbingRef.current.direction) return;

        const scrubSpeed = 0.08; 
        const directionMultiplier = scrubbingRef.current.direction === 'forward' ? 1 : -1;
        handleSeek(videoRef.current.currentTime + (scrubSpeed * directionMultiplier));

        scrubbingRef.current.animationFrameId = requestAnimationFrame(scrubLoop);
    }, [handleSeek]);

    // Start / Stop Recording
    const startRecording = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setRecordedVideoUrl(null);
        setMicStatus('idle');

        let audioStream: MediaStream | null = null;
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
            try {
                audioStream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                    } 
                });
                setMicStatus('active');
            } catch {
                setMicStatus('error');
            }
        } else {
            setMicStatus('error');
        }

        // 60 FPS for ultra-smooth slow motion and frame-accurate sports analysis
        // Balanced bitrates: 5.5 Mbps (1080p) and 3.5 Mbps (720p) provide high fidelity without massive file bloat
        const qualitySettings = quality === '1080p'
            ? { fps: 60, videoBitsPerSecond: 5500000, audioBitsPerSecond: 128000 } 
            : { fps: 60, videoBitsPerSecond: 3500000, audioBitsPerSecond: 128000 }; 
        
        try {
            const canvasStream = canvasRef.current.captureStream(qualitySettings.fps);
            const tracks = [...canvasStream.getVideoTracks()];
            if (audioStream) {
                tracks.push(...audioStream.getAudioTracks());
            }
            
            const combinedStream = new MediaStream(tracks);

            // Prioritize standard MP4 (H.264 / AAC)
            const mimeTypes = [
                'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
                'video/mp4; codecs="avc1.4d002a, mp4a.40.2"',
                'video/mp4',
                'video/webm; codecs=h264,opus',
                'video/webm',
            ];

            const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/mp4';
            setRecordedVideoType(supportedMimeType.split(';')[0]);

            const mediaRecorder = new MediaRecorder(combinedStream, {
                mimeType: supportedMimeType,
                videoBitsPerSecond: qualitySettings.videoBitsPerSecond,
                audioBitsPerSecond: qualitySettings.audioBitsPerSecond,
            });

            mediaRecorderRef.current = mediaRecorder;
            recordedChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: supportedMimeType.split(';')[0] });
                const url = URL.createObjectURL(blob);
                setRecordedVideoUrl(url);
                combinedStream.getTracks().forEach(track => track.stop());
                if (audioStream) {
                    audioStream.getTracks().forEach(track => track.stop());
                }
                setMicStatus('idle');
                setShowPreviewModal(true);
            };

            // Start recorder continuously; avoids forced 1-second keyframe resets and eliminates stutter
            mediaRecorder.start();
            setIsRecording(true);
        } catch {
            setMicStatus('idle');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // Keyboard Shortcuts Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!videoUrl || !videoRef.current) return;

            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.isContentEditable) {
                return;
            }

            const key = e.key.toLowerCase();

            // Continuous frame stepping on hold (, and . keys)
            if (key === ',' || key === '.') {
                e.preventDefault();
                if (stepHoldRef.current.activeKey === key) return;

                stopStepHold();
                if (key === ',') stepBackward();
                else stepForward();

                stepHoldRef.current.activeKey = key;
                stepHoldRef.current.timeoutId = window.setTimeout(() => {
                    stepHoldRef.current.intervalId = window.setInterval(() => {
                        if (key === ',') stepBackward();
                        else stepForward();
                    }, 50); // ~20 frames/sec smooth continuous stepping
                }, 200);
                return;
            }

            if ((key === 'j' || key === 'l') && scrubbingRef.current.direction === null) {
                e.preventDefault();
                wasPlayingBeforeScrubRef.current = !videoRef.current.paused;
                if (wasPlayingBeforeScrubRef.current) {
                    videoRef.current.pause();
                    setIsPlaying(false);
                }
                scrubbingRef.current.direction = key === 'l' ? 'forward' : 'backward';
                scrubbingRef.current.animationFrameId = requestAnimationFrame(scrubLoop);
                return;
            }
            
            if (e.repeat) return;
            
            switch (key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    if (scrubbingRef.current.direction) return;
                    handlePlayPause();
                    break;
                case 'arrowleft':
                    e.preventDefault();
                    seekBackward();
                    break;
                case 'arrowright':
                    e.preventDefault();
                    seekForward();
                    break;
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) handleRedo();
                    else handleUndo();
                    break;
                case 'y':
                    e.preventDefault();
                    handleRedo();
                    break;
                case 'c':
                    e.preventDefault();
                    handleClearAll();
                    break;
                case 'r':
                    e.preventDefault();
                    if (isRecording) stopRecording();
                    else startRecording();
                    break;
                case 'f':
                    e.preventDefault();
                    handleToggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    handleMuteToggle();
                    break;
                case '?':
                    e.preventDefault();
                    setShowShortcuts(prev => !prev);
                    break;
                // Quick Playback Keys: 0 = Restart, 1 = 0.5x Slow-Mo, 2 = 1.0x Regular Speed
                case '0':
                    e.preventDefault();
                    handleSeek(0);
                    break;
                case '1':
                    e.preventDefault();
                    handlePlaybackRateChange(0.5);
                    break;
                case '2':
                    e.preventDefault();
                    handlePlaybackRateChange(1.0);
                    break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key === ',' || key === '.') {
                if (stepHoldRef.current.activeKey === key) {
                    stopStepHold();
                }
            }
            if ((key === 'j' || key === 'l') && scrubbingRef.current.direction) {
                e.preventDefault();
                if (scrubbingRef.current.animationFrameId) {
                    cancelAnimationFrame(scrubbingRef.current.animationFrameId);
                }
                scrubbingRef.current.direction = null;
                scrubbingRef.current.animationFrameId = null;
                
                if (wasPlayingBeforeScrubRef.current && videoRef.current) {
                    videoRef.current.play().catch(() => {});
                    setIsPlaying(true);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', stopStepHold);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', stopStepHold);
            stopStepHold();
            if (scrubbingRef.current.animationFrameId) {
                cancelAnimationFrame(scrubbingRef.current.animationFrameId);
            }
        };
    }, [
        videoUrl, duration, handlePlayPause, handleSeek, seekBackward, seekForward, 
        stepBackward, stepForward, scrubLoop, handleUndo, handleRedo, handleClearAll, 
        handleMuteToggle, isRecording, stopStepHold, handlePlaybackRateChange, handleSetTool
    ]);

    // Trackpad Horizontal Wheel Scrubbing
    const handleWheelScrub = (e: React.WheelEvent) => {
        if (!videoRef.current) return;
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            e.preventDefault();
            if (!videoRef.current.paused) {
                videoRef.current.pause();
                setIsPlaying(false);
            }
            const sensitivity = 0.005;
            const delta = e.deltaX * sensitivity;
            if (Math.abs(delta) > 0) {
                handleSeek(videoRef.current.currentTime + delta);
            }
        }
    };

    // Drag and Drop Handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFile(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFile(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFile(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('video/')) {
            const url = URL.createObjectURL(file);
            loadVideoUrl(url);
        }
    };

    const formatTimer = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <div 
            className="h-screen w-screen bg-gray-950 text-gray-100 flex flex-col outline-none select-none overflow-hidden font-sans" 
            tabIndex={-1}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input 
                id="video-upload-hidden" 
                type="file" 
                accept="video/*" 
                className="hidden" 
                onChange={handleFileChange} 
                ref={fileInputRef} 
            />
            
            {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

            {/* Recording Preview Modal */}
            {showPreviewModal && recordedVideoUrl && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 max-w-2xl w-full shadow-2xl flex flex-col gap-4">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                            <div>
                                <h3 className="text-base font-bold text-white">Telestration Recording Export</h3>
                                <p className="text-xs text-gray-400">Review your telestration voiceover and analysis</p>
                            </div>
                            <button 
                                onClick={() => setShowPreviewModal(false)}
                                className="text-gray-400 hover:text-white p-1 rounded-md"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="w-full bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                            <video 
                                src={recordedVideoUrl} 
                                controls 
                                className="w-full h-full object-contain"
                                autoPlay
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button 
                                onClick={() => setShowPreviewModal(false)}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
                            >
                                Close
                            </button>
                            <button 
                                onClick={handleDownloadRecording}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-md transition-colors"
                            >
                                <DownloadIcon className="w-4 h-4" />
                                Download Video
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-grow flex flex-col min-h-0 relative" ref={containerRef}>
                {/* Drag and Drop Fullscreen Overlay */}
                {isDraggingFile && (
                    <div className="absolute inset-0 bg-blue-600/30 border-4 border-dashed border-blue-400 z-50 flex items-center justify-center backdrop-blur-sm pointer-events-none">
                        <div className="bg-gray-900/90 px-6 py-4 rounded-xl shadow-2xl text-center border border-blue-400/50">
                            <p className="text-xl font-bold text-white">Drop video file to load</p>
                            <p className="text-sm text-gray-300 mt-1">MP4, WebM, MOV supported</p>
                        </div>
                    </div>
                )}

                {/* Upload Screen */}
                {!videoUrl && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-900 to-gray-950">
                        <div className="max-w-md w-full flex flex-col items-center text-center space-y-6">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-extrabold text-white tracking-tight">Sports Telestrator</h1>
                                <p className="text-sm text-gray-400">
                                    Precision video breakdown, direct arrow telestrations, frame stepping, and voiceover screen capture.
                                </p>
                            </div>

                            <label 
                                htmlFor="video-upload" 
                                className="w-full flex flex-col items-center justify-center px-6 py-12 border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-2xl cursor-pointer bg-gray-900/60 hover:bg-gray-800/80 transition-all duration-200 group shadow-lg"
                            >
                                <div className="p-4 bg-gray-800 group-hover:bg-blue-600/20 rounded-full transition-colors">
                                    <UploadIcon />
                                </div>
                                <span className="mt-4 text-base font-semibold text-gray-200 group-hover:text-white">Choose Video File</span>
                                <span className="mt-1 text-xs text-gray-400">or drag and drop MP4, WebM here</span>
                                <input id="video-upload" type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>
                )}
                
                {/* Active Player & Telestrator View */}
                {videoUrl && (
                    <div className="w-full h-full flex flex-col bg-black overflow-hidden min-h-0">
                        {/* Video & Canvas Stage */}
                        <div 
                            className="w-full bg-black flex-1 relative min-h-0 flex items-center justify-center"
                            onWheel={handleWheelScrub}
                        >
                            <VideoPlayer 
                                ref={videoRef}
                                src={videoUrl} 
                                muted={isMuted}
                                volume={volume}
                                onTimeUpdate={(e) => {
                                    if (!isPlaying) {
                                        setProgress(e.currentTarget.currentTime);
                                    }
                                }}
                                onSeeked={handleSeeked}
                                onLoadedData={(e) => {
                                    setDuration(e.currentTarget.duration);
                                    if (videoRef.current) {
                                        videoRef.current.playbackRate = playbackRate;
                                        videoRef.current.volume = volume;
                                    }
                                }}
                                onEnded={() => setIsPlaying(false)}
                                onClick={handlePlayPause}
                            />
                            <DrawingCanvas 
                                ref={canvasRef} 
                                videoRef={videoRef}
                                tool={tool}
                                color={color}
                                brushSize={activeBrushSize}
                                strokes={strokes}
                                onAddStroke={handleAddStroke}
                                isRecording={isRecording}
                                quality={quality}
                                onSeekDelta={handleSeekDelta}
                            />

                            {/* Active Recording Floating Indicator */}
                            {isRecording && (
                                <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-red-600/90 text-white px-3 py-1.5 rounded-full shadow-lg border border-red-500/50 backdrop-blur-sm animate-pulse">
                                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                                    <span className="text-xs font-mono font-bold tracking-wider">REC {formatTimer(recordingSeconds)}</span>
                                </div>
                            )}
                        </div>
                   
                        {/* Bottom Control Bar */}
                        <div className="bg-gray-900 border-t border-gray-800 p-2.5 z-20">
                            {/* Toolbar Top Row */}
                            <div className="pb-2 flex items-center justify-between flex-wrap gap-2">
                                <DrawingToolbar 
                                    tool={tool}
                                    setTool={handleSetTool}
                                    color={color}
                                    setColor={setColor}
                                    brushSize={activeBrushSize}
                                    setBrushSize={handleBrushSizeChange}
                                    onUndo={handleUndo}
                                    onRedo={handleRedo}
                                    canUndo={strokes.length > 0}
                                    canRedo={redoStrokes.length > 0}
                                    onClearAll={handleClearAll}
                                />
                                
                                <div className="flex items-center gap-2 ml-auto">
                                    {/* Load New File */}
                                    <button 
                                        onClick={() => fileInputRef.current?.click()} 
                                        title="Load new video file" 
                                        className="p-2 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                    >
                                        <FolderOpenIcon className="w-5 h-5" />
                                    </button>

                                    {/* Download Finished Recording */}
                                    <button 
                                        onClick={handleDownloadRecording} 
                                        disabled={!recordedVideoUrl} 
                                        title={recordedVideoUrl ? "Download telestration recording" : "Record a clip first"} 
                                        className="p-2 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <DownloadIcon className="w-5 h-5" />
                                    </button>

                                    <div className="w-px h-5 bg-gray-700 hidden sm:block"></div>

                                    {/* Resolution Selector */}
                                    <div className="flex items-center gap-0.5 bg-gray-800 rounded-md p-0.5">
                                        <button 
                                            onClick={() => setQuality('720p')} 
                                            className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                                                quality === '720p' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            720p
                                        </button>
                                        <button 
                                            onClick={() => setQuality('1080p')} 
                                            className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                                                quality === '1080p' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            1080p
                                        </button>
                                    </div>

                                    {/* Record / Stop Button */}
                                    <button
                                        onClick={isRecording ? stopRecording : startRecording}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all shadow-sm ${
                                            isRecording 
                                                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/50' 
                                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50'
                                        }`}
                                    >
                                        <RecordIcon isRecording={isRecording} className="w-3.5 h-3.5" />
                                        <span>{isRecording ? `Stop (${formatTimer(recordingSeconds)})` : 'Record'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Video Playback & Stepping Controls */}
                            <VideoControls
                                isPlaying={isPlaying}
                                isMuted={isMuted}
                                volume={volume}
                                progress={progress}
                                duration={duration}
                                playbackRate={playbackRate}
                                micStatus={micStatus}
                                onPlayPause={handlePlayPause}
                                onToggleMute={handleMuteToggle}
                                onVolumeChange={handleVolumeChange}
                                onSeek={handleSeek}
                                onPlaybackRateChange={handlePlaybackRateChange}
                                onSeekBackward={seekBackward}
                                onSeekForward={seekForward}
                                onStepBackward={stepBackward}
                                onStepForward={stepForward}
                                onToggleShortcuts={() => setShowShortcuts(prev => !prev)}
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
