import React, { forwardRef, SyntheticEvent } from 'react';

interface VideoPlayerProps {
    src: string | null;
    muted?: boolean;
    volume?: number;
    onTimeUpdate: (event: SyntheticEvent<HTMLVideoElement, Event>) => void;
    onLoadedData: (event: SyntheticEvent<HTMLVideoElement, Event>) => void;
    onEnded: () => void;
    onClick: () => void;
    onSeeked?: (event: SyntheticEvent<HTMLVideoElement, Event>) => void;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
    ({ src, muted = false, volume = 1, onTimeUpdate, onLoadedData, onEnded, onClick, onSeeked }, ref) => {
        if (!src) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <p className="text-gray-400">Upload a video to begin playback</p>
                </div>
            );
        }

        return (
            <video
                ref={(node) => {
                    if (typeof ref === 'function') {
                        ref(node);
                    } else if (ref) {
                        (ref as React.MutableRefObject<HTMLVideoElement | null>).current = node;
                    }
                    if (node) {
                        node.volume = volume;
                    }
                }}
                src={src}
                muted={muted}
                className="w-full h-full object-contain pointer-events-none"
                onTimeUpdate={onTimeUpdate}
                onLoadedData={onLoadedData}
                onEnded={onEnded}
                onClick={onClick}
                onSeeked={onSeeked}
                playsInline
                crossOrigin="anonymous"
            >
                Your browser does not support the video tag.
            </video>
        );
    }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;