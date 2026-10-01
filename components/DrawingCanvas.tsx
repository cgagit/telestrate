import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Tool, Stroke, Point, Quality } from '../types';

interface DrawingCanvasProps {
    tool: Tool;
    color: string;
    brushSize: number;
    videoRef: React.RefObject<HTMLVideoElement>;
    strokes: Stroke[];
    onAddStroke: (stroke: Stroke) => void;
    isRecording: boolean;
    quality: Quality;
    onSeekDelta: (delta: number) => void;
}

export const getVideoTransform = (
    canvasWidth: number, 
    canvasHeight: number, 
    videoWidth: number, 
    videoHeight: number
) => {
    if (!videoWidth || !videoHeight || !canvasWidth || !canvasHeight || isNaN(videoWidth) || isNaN(videoHeight)) {
        return { 
            renderedVideoWidth: canvasWidth || 1, 
            renderedVideoHeight: canvasHeight || 1, 
            offsetX: 0, 
            offsetY: 0 
        };
    }
    const videoRatio = videoWidth / videoHeight;
    const canvasRatio = canvasWidth / canvasHeight;
    let renderedVideoWidth = canvasWidth;
    let renderedVideoHeight = canvasHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > videoRatio) {
        renderedVideoWidth = canvasHeight * videoRatio;
        offsetX = (canvasWidth - renderedVideoWidth) / 2;
    } else {
        renderedVideoHeight = canvasWidth / videoRatio;
        offsetY = (canvasHeight - renderedVideoHeight) / 2;
    }
    return { renderedVideoWidth, renderedVideoHeight, offsetX, offsetY };
};

const isShapeTool = (t: Tool) => ['arrow', 'line', 'rectangle', 'rectangle-fill', 'circle', 'circle-fill'].includes(t);

const DrawingCanvas = forwardRef<HTMLCanvasElement, DrawingCanvasProps>(({ 
    tool, color, brushSize, videoRef, strokes, onAddStroke, isRecording, quality, onSeekDelta
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const recordingCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const recordingOffscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

    useImperativeHandle(ref, () => recordingCanvasRef.current!);

    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
    const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    
    // Two-finger scrub state
    const [isScrubbing, setIsScrubbing] = useState(false);
    const lastScrubXRef = useRef<number | null>(null);
    const lastRawPointRef = useRef<Point | null>(null);
    const liveStrokeRef = useRef<Stroke | null>(null);
    
    const animationFrameRef = useRef<number | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    // Initialize offscreen canvases
    useEffect(() => {
        if (!offscreenCanvasRef.current) {
            offscreenCanvasRef.current = document.createElement('canvas');
        }
        if (!recordingOffscreenCanvasRef.current) {
            recordingOffscreenCanvasRef.current = document.createElement('canvas');
        }
    }, []);

    // Resize observer for matching parent container size
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;

        const handleResize = (width: number, height: number) => {
            if (width > 0 && height > 0 && (canvas.width !== width || canvas.height !== height)) {
                canvas.width = width;
                canvas.height = height;
                setCanvasSize({ width, height });
            }
        };

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                handleResize(Math.floor(width), Math.floor(height));
            }
        });
        observer.observe(parent);
        resizeObserverRef.current = observer;

        const rect = parent.getBoundingClientRect();
        handleResize(Math.floor(rect.width), Math.floor(rect.height));

        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
            }
        };
    }, []);

    // Configure recording canvas resolution
    useEffect(() => {
        const recCanvas = recordingCanvasRef.current;
        if (!recCanvas) return;

        const w = quality === '1080p' ? 1920 : 1280;
        const h = quality === '1080p' ? 1080 : 720;
        recCanvas.width = w;
        recCanvas.height = h;
    }, [quality]);

    // Coordinate conversion with boundary clamping to video frame
    const getCoords = useCallback((event: React.MouseEvent | React.TouchEvent): Point | null => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video || video.videoWidth === 0 || video.videoHeight === 0) return null;
        
        const { renderedVideoWidth, renderedVideoHeight, offsetX, offsetY } = getVideoTransform(
            canvas.width, canvas.height, video.videoWidth, video.videoHeight
        );
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null;

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX: number;
        let clientY: number;

        if ('touches' in event.nativeEvent) {
            if (event.nativeEvent.touches.length === 0) return null;
            const touch = event.nativeEvent.touches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        } else {
            const mouseEvent = event.nativeEvent as MouseEvent;
            clientX = mouseEvent.clientX;
            clientY = mouseEvent.clientY;
        }

        const canvasX = (clientX - rect.left) * scaleX;
        const canvasY = (clientY - rect.top) * scaleY;

        // Clamp to video display area
        const clampedX = Math.max(offsetX, Math.min(offsetX + renderedVideoWidth, canvasX));
        const clampedY = Math.max(offsetY, Math.min(offsetY + renderedVideoHeight, canvasY));

        const normX = (clampedX - offsetX) / renderedVideoWidth;
        const normY = (clampedY - offsetY) / renderedVideoHeight;
        return { x: normX, y: normY };
    }, [videoRef]);

    // Stroke rendering helper
    const renderStrokeToContext = useCallback((
        context: CanvasRenderingContext2D, 
        stroke: Stroke, 
        transform: { renderedVideoWidth: number; renderedVideoHeight: number; offsetX: number; offsetY: number }
    ) => {
        const { renderedVideoWidth, renderedVideoHeight, offsetX, offsetY } = transform;
        
        const denormalize = (point: Point) => ({
            x: point.x * renderedVideoWidth + offsetX,
            y: point.y * renderedVideoHeight + offsetY,
        });

        const isEraser = stroke.tool === 'eraser';
        const isShape = isShapeTool(stroke.tool);

        context.save();
        context.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
        context.strokeStyle = isEraser ? '#000000' : stroke.color;
        context.fillStyle = isEraser ? '#000000' : stroke.color;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.lineWidth = stroke.brushSize;

        const points = stroke.points.map(denormalize);
        const pLen = points.length;

        if (pLen === 0) {
            context.restore();
            return;
        }

        if (pLen < 2 && !isShape) {
            const p = points[0];
            context.beginPath();
            context.arc(p.x, p.y, Math.max(1, context.lineWidth / 2), 0, 2 * Math.PI, false);
            context.fill();
            context.restore();
            return;
        }

        if (isShape) {
            const startPoint = points[0];
            const endPoint = points[pLen - 1];
            
            if (stroke.tool === 'arrow') {
                const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
                const headLength = Math.max(14, stroke.brushSize * 3.5);
                
                // Shaft
                context.beginPath();
                context.moveTo(startPoint.x, startPoint.y);
                context.lineTo(endPoint.x, endPoint.y);
                context.stroke();

                // Arrow head
                context.beginPath();
                context.moveTo(endPoint.x, endPoint.y);
                context.lineTo(
                    endPoint.x - headLength * Math.cos(angle - Math.PI / 6),
                    endPoint.y - headLength * Math.sin(angle - Math.PI / 6)
                );
                context.lineTo(
                    endPoint.x - headLength * Math.cos(angle + Math.PI / 6),
                    endPoint.y - headLength * Math.sin(angle + Math.PI / 6)
                );
                context.closePath();
                context.fill();
            } else if (stroke.tool === 'line') {
                context.beginPath();
                context.moveTo(startPoint.x, startPoint.y);
                context.lineTo(endPoint.x, endPoint.y);
                context.stroke();
            } else if (stroke.tool.startsWith('rectangle')) {
                // Center-out rectangle: startPoint is center, endPoint defines half-width and half-height
                const rx = Math.abs(endPoint.x - startPoint.x);
                const ry = Math.abs(endPoint.y - startPoint.y);
                const x = startPoint.x - rx;
                const y = startPoint.y - ry;
                const w = rx * 2;
                const h = ry * 2;
                if (stroke.tool === 'rectangle-fill') {
                    context.save();
                    context.globalAlpha = 0.3;
                    context.fillRect(x, y, w, h);
                    context.restore();
                }
                context.strokeRect(x, y, w, h);
            } else if (stroke.tool.startsWith('circle')) {
                // Center-out circle/oval: startPoint is center, endPoint defines radii
                const rx = Math.max(1, Math.abs(endPoint.x - startPoint.x));
                const ry = Math.max(1, Math.abs(endPoint.y - startPoint.y));
                context.beginPath();
                context.ellipse(startPoint.x, startPoint.y, rx, ry, 0, 0, 2 * Math.PI);
                if (stroke.tool === 'circle-fill') {
                    context.save();
                    context.globalAlpha = 0.3;
                    context.fill();
                    context.restore();
                }
                context.stroke();
            }
            context.restore();
            return;
        }

        // Freehand smooth line using quadratic curves
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);

        if (pLen > 2) {
            for (let i = 1; i < pLen - 2; i++) {
                const xc = (points[i].x + points[i + 1].x) / 2;
                const yc = (points[i].y + points[i + 1].y) / 2;
                context.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }
            context.quadraticCurveTo(
                points[pLen - 2].x, 
                points[pLen - 2].y, 
                points[pLen - 1].x, 
                points[pLen - 1].y
            );
        } else {
            context.lineTo(points[1].x, points[1].y);
        }
        
        context.stroke();
        context.restore();
    }, []);

    // Rebuild visible screen offscreen cache when strokes or canvasSize change
    useEffect(() => {
        const offscreen = offscreenCanvasRef.current;
        const video = videoRef.current;
        
        if (!offscreen || !video || canvasSize.width === 0 || canvasSize.height === 0) return;

        if (offscreen.width !== canvasSize.width || offscreen.height !== canvasSize.height) {
            offscreen.width = canvasSize.width;
            offscreen.height = canvasSize.height;
        }

        const ctx = offscreen.getContext('2d');
        if (!ctx) return;
        
        const transform = getVideoTransform(canvasSize.width, canvasSize.height, video.videoWidth, video.videoHeight);
        ctx.clearRect(0, 0, offscreen.width, offscreen.height);
        
        strokes.forEach(stroke => {
            renderStrokeToContext(ctx, stroke, transform);
        });

        // Fast redraw of main canvas
        const canvas = canvasRef.current;
        const mainCtx = canvas?.getContext('2d');
        if (mainCtx && canvas) {
            mainCtx.clearRect(0, 0, canvas.width, canvas.height);
            mainCtx.drawImage(offscreen, 0, 0);
        }
    }, [strokes, canvasSize, videoRef, renderStrokeToContext]);

    // Rebuild recording offscreen cache when strokes, quality, or video change
    useEffect(() => {
        const recOffscreen = recordingOffscreenCanvasRef.current;
        const recCanvas = recordingCanvasRef.current;
        const video = videoRef.current;

        if (!recOffscreen || !recCanvas || !video) return;

        if (recOffscreen.width !== recCanvas.width || recOffscreen.height !== recCanvas.height) {
            recOffscreen.width = recCanvas.width;
            recOffscreen.height = recCanvas.height;
        }

        const ctx = recOffscreen.getContext('2d');
        if (!ctx) return;

        const transform = getVideoTransform(recCanvas.width, recCanvas.height, video.videoWidth, video.videoHeight);
        ctx.clearRect(0, 0, recOffscreen.width, recOffscreen.height);

        strokes.forEach(stroke => {
            renderStrokeToContext(ctx, stroke, transform);
        });
    }, [strokes, quality, videoRef, renderStrokeToContext]);

    // Redraw live drawing canvas (offscreen cached strokes + current active points)
    const renderActiveCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        const offscreen = offscreenCanvasRef.current;
        const video = videoRef.current;

        if (!context || !canvas || !video || !offscreen) return;

        const transform = getVideoTransform(canvas.width, canvas.height, video.videoWidth, video.videoHeight);

        context.clearRect(0, 0, canvas.width, canvas.height);
        
        if (offscreen.width > 0 && offscreen.height > 0) {
            context.drawImage(offscreen, 0, 0);
        }

        if (currentPoints.length > 0) {
            const liveStroke: Stroke = { 
                id: 'live', 
                tool, 
                color, 
                brushSize, 
                points: currentPoints 
            };
            renderStrokeToContext(context, liveStroke, transform);
        }
    }, [currentPoints, tool, color, brushSize, videoRef, renderStrokeToContext]);

    // Keep liveStrokeRef in sync with active drawing stroke
    useEffect(() => {
        if (currentPoints.length > 0) {
            liveStrokeRef.current = { 
                id: 'live', 
                tool, 
                color, 
                brushSize, 
                points: currentPoints 
            };
        } else {
            liveStrokeRef.current = null;
        }
    }, [currentPoints, tool, color, brushSize]);

    // Trigger render when active points change during user drawing
    useEffect(() => {
        renderActiveCanvas();
    }, [renderActiveCanvas]);

    // Continuous recording render loop (only active during recording)
    // Decoupled from currentPoints to guarantee rock-solid frame rate without dropped frames during drawing
    useEffect(() => {
        if (!isRecording) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            return;
        }

        const recordingLoop = () => {
            const recCanvas = recordingCanvasRef.current;
            const recCtx = recCanvas?.getContext('2d', { alpha: false, desynchronized: true });
            const recOffscreen = recordingOffscreenCanvasRef.current;
            const video = videoRef.current;

            if (recCanvas && recCtx && video && recOffscreen) {
                const recTransform = getVideoTransform(
                    recCanvas.width, 
                    recCanvas.height, 
                    video.videoWidth, 
                    video.videoHeight
                );
                
                // Fill letterbox/pillarbox margins only if video does not span the full canvas
                if (recTransform.offsetX > 0 || recTransform.offsetY > 0) {
                    recCtx.fillStyle = '#000000';
                    if (recTransform.offsetX > 0) {
                        recCtx.fillRect(0, 0, recTransform.offsetX, recCanvas.height);
                        recCtx.fillRect(recTransform.offsetX + recTransform.renderedVideoWidth, 0, recCanvas.width - (recTransform.offsetX + recTransform.renderedVideoWidth), recCanvas.height);
                    }
                    if (recTransform.offsetY > 0) {
                        recCtx.fillRect(0, 0, recCanvas.width, recTransform.offsetY);
                        recCtx.fillRect(0, recTransform.offsetY + recTransform.renderedVideoHeight, recCanvas.width, recCanvas.height - (recTransform.offsetY + recTransform.renderedVideoHeight));
                    }
                }
                
                // Draw current video frame
                if (video.videoWidth > 0 && video.videoHeight > 0) {
                    recCtx.drawImage(
                        video, 
                        recTransform.offsetX, 
                        recTransform.offsetY, 
                        recTransform.renderedVideoWidth, 
                        recTransform.renderedVideoHeight
                    );
                }
                
                // Draw committed annotations
                if (recOffscreen.width > 0 && recOffscreen.height > 0) {
                    recCtx.drawImage(recOffscreen, 0, 0);
                }

                // Draw live active stroke if user is actively drawing
                const live = liveStrokeRef.current;
                if (live && live.points.length > 0) {
                    renderStrokeToContext(recCtx, live, recTransform);
                }
            }

            animationFrameRef.current = requestAnimationFrame(recordingLoop);
        };

        animationFrameRef.current = requestAnimationFrame(recordingLoop);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [isRecording, videoRef, renderStrokeToContext]);

    // Helper to calculate shift-constrained point for center-out shapes (perfect circle / square)
    const getConstrainedShapePoint = useCallback((center: Point, target: Point): Point => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) return target;

        const { renderedVideoWidth, renderedVideoHeight } = getVideoTransform(
            canvas.width, canvas.height, video.videoWidth, video.videoHeight
        );
        const pixelDx = (target.x - center.x) * renderedVideoWidth;
        const pixelDy = (target.y - center.y) * renderedVideoHeight;
        const maxRadius = Math.max(Math.abs(pixelDx), Math.abs(pixelDy));
        const signX = pixelDx >= 0 ? 1 : -1;
        const signY = pixelDy >= 0 ? 1 : -1;

        return {
            x: center.x + (maxRadius * signX) / renderedVideoWidth,
            y: center.y + (maxRadius * signY) / renderedVideoHeight,
        };
    }, [videoRef]);

    // Live Shift key toggle listener during active shape drawing
    useEffect(() => {
        const handleShiftKey = (e: KeyboardEvent) => {
            if (e.key !== 'Shift') return;
            if (!isDrawing || !lastRawPointRef.current || currentPoints.length === 0) return;
            if (!isShapeTool(tool) || (!tool.startsWith('circle') && !tool.startsWith('rectangle'))) return;

            const center = currentPoints[0];
            const raw = lastRawPointRef.current;
            if (e.type === 'keydown') {
                const constrained = getConstrainedShapePoint(center, raw);
                setCurrentPoints([center, constrained]);
            } else if (e.type === 'keyup') {
                setCurrentPoints([center, raw]);
            }
        };

        window.addEventListener('keydown', handleShiftKey);
        window.addEventListener('keyup', handleShiftKey);
        return () => {
            window.removeEventListener('keydown', handleShiftKey);
            window.removeEventListener('keyup', handleShiftKey);
        };
    }, [isDrawing, currentPoints, tool, getConstrainedShapePoint]);

    // Mouse and Touch Event Handlers
    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
        // Two-finger scrub detection
        if ('touches' in event.nativeEvent && event.nativeEvent.touches.length === 2) {
            event.preventDefault();
            setIsScrubbing(true);
            setIsDrawing(false);
            setCurrentPoints([]);
            lastRawPointRef.current = null;
            const t1 = event.nativeEvent.touches[0].clientX;
            const t2 = event.nativeEvent.touches[1].clientX;
            lastScrubXRef.current = (t1 + t2) / 2;
            return;
        }

        const pointData = getCoords(event);
        if (!pointData || !videoRef.current) return;
        lastRawPointRef.current = null;
        setIsDrawing(true);
        setCurrentPoints([pointData]);
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
        if (event.cancelable) event.preventDefault();

        // Two-finger scrub handling
        if ('touches' in event.nativeEvent) {
            if (event.nativeEvent.touches.length === 2) {
                const t1 = event.nativeEvent.touches[0].clientX;
                const t2 = event.nativeEvent.touches[1].clientX;
                const currentX = (t1 + t2) / 2;

                if (!isScrubbing) {
                    setIsScrubbing(true);
                    setIsDrawing(false);
                    setCurrentPoints([]);
                    lastRawPointRef.current = null;
                    lastScrubXRef.current = currentX;
                    return;
                }

                if (lastScrubXRef.current !== null) {
                    const deltaX = currentX - lastScrubXRef.current;
                    onSeekDelta(deltaX * 0.05);
                }
                lastScrubXRef.current = currentX;
                return;
            } else if (isScrubbing) {
                setIsScrubbing(false);
                lastScrubXRef.current = null;
                return;
            }
        }

        if (isScrubbing || !isDrawing) return;
        
        let pointData = getCoords(event);
        if (!pointData || !videoRef.current) return;
        
        if (isShapeTool(tool)) {
            lastRawPointRef.current = pointData;
            const isCenterOut = tool.startsWith('circle') || tool.startsWith('rectangle');
            const isShiftHeld = 'shiftKey' in event 
                ? event.shiftKey 
                : ('nativeEvent' in event && 'shiftKey' in event.nativeEvent ? (event.nativeEvent as MouseEvent).shiftKey : false);

            if (isCenterOut && isShiftHeld && currentPoints.length > 0) {
                pointData = getConstrainedShapePoint(currentPoints[0], pointData);
            }

            setCurrentPoints(prev => [prev[0], pointData]);
        } else {
            setCurrentPoints(prev => [...prev, pointData]);
        }
    };

    const stopDrawing = () => {
        lastRawPointRef.current = null;
        if (isScrubbing) {
            setIsScrubbing(false);
            lastScrubXRef.current = null;
        }

        if (!isDrawing) return;
        if (currentPoints.length > 0) {
            const finalPoints = isShapeTool(tool) && currentPoints.length > 1 
                ? [currentPoints[0], currentPoints[currentPoints.length - 1]] 
                : currentPoints;
            const newStroke: Stroke = {
                id: crypto.randomUUID(),
                tool, 
                color, 
                brushSize,
                points: finalPoints,
            };
            onAddStroke(newStroke);
        }
        setIsDrawing(false);
        setCurrentPoints([]);
    };

    return (
        <>
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full touch-none cursor-crosshair z-10"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            <canvas 
                ref={recordingCanvasRef} 
                className="absolute top-0 left-0 pointer-events-none opacity-0" 
                aria-hidden="true"
            />
        </>
    );
});

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;
