import React from 'react';
import { 
    PencilIcon, ArrowIcon, EraserIcon, UndoIcon, RedoIcon, TrashIcon,
    LineIcon, RectangleIcon, CircleIcon
} from './icons';
import { Tool } from '../types';

interface DrawingToolbarProps {
    tool: Tool;
    setTool: (tool: Tool) => void;
    color: string;
    setColor: (color: string) => void;
    brushSize: number;
    setBrushSize: (size: number) => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onClearAll: () => void;
}

const HIGH_VIS_COLORS = [
    { label: 'High-Vis Yellow', hex: '#FFE600' },
    { label: 'Laser Green', hex: '#00E676' },
    { label: 'Electric Cyan', hex: '#00E5FF' },
    { label: 'Fire Red', hex: '#FF1744' },
    { label: 'Pure White', hex: '#FFFFFF' },
    { label: 'Pitch Black', hex: '#000000' },
    { label: 'Flame Orange', hex: '#FF9100' },
];

const ToolButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
}> = ({ label, isActive, onClick, disabled = false, children }) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        className={`p-2 rounded-md transition-colors ${
            disabled 
                ? 'opacity-40 cursor-not-allowed bg-gray-800 text-gray-500'
                : isActive 
                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
        }`}
        aria-label={label}
        title={label}
    >
        {children}
    </button>
);

const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
    tool,
    setTool,
    color,
    setColor,
    brushSize,
    setBrushSize,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onClearAll,
}) => {
    return (
        <div className="flex items-center flex-wrap gap-2">
            {/* Freehand & Lines */}
            <div className="flex items-center gap-1">
                <ToolButton label="Pen Tool (Freehand)" isActive={tool === 'pen'} onClick={() => setTool('pen')}>
                    <PencilIcon className="w-5 h-5" />
                </ToolButton>
                <ToolButton label="Arrow Tool (Direct player run / pass)" isActive={tool === 'arrow'} onClick={() => setTool('arrow')}>
                    <ArrowIcon className="w-5 h-5" />
                </ToolButton>
                <ToolButton label="Line Tool" isActive={tool === 'line'} onClick={() => setTool('line')}>
                    <LineIcon className="w-5 h-5" />
                </ToolButton>
                <ToolButton label="Eraser Tool" isActive={tool === 'eraser'} onClick={() => setTool('eraser')}>
                    <EraserIcon className="w-5 h-5" />
                </ToolButton>
            </div>
            
            <div className="w-px h-6 bg-gray-600 hidden sm:block"></div>

            {/* Shapes */}
            <div className="flex items-center gap-1">
                <ToolButton label="Rectangle (Center-out · Hold Shift for square)" isActive={tool === 'rectangle'} onClick={() => setTool('rectangle')}>
                    <RectangleIcon className="w-5 h-5" />
                </ToolButton>
                <ToolButton label="Filled Zone Rectangle (Center-out · Hold Shift for square)" isActive={tool === 'rectangle-fill'} onClick={() => setTool('rectangle-fill')}>
                    <RectangleIcon className="w-5 h-5" filled />
                </ToolButton>
                <ToolButton label="Player Circle (Center-out · Hold Shift for circle)" isActive={tool === 'circle'} onClick={() => setTool('circle')}>
                    <CircleIcon className="w-5 h-5" />
                </ToolButton>
                <ToolButton label="Filled Zone Circle (Center-out · Hold Shift for circle)" isActive={tool === 'circle-fill'} onClick={() => setTool('circle-fill')}>
                    <CircleIcon className="w-5 h-5" filled />
                </ToolButton>
            </div>

            <div className="w-px h-6 bg-gray-600 hidden sm:block"></div>

            {/* Colors & Brush */}
            <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 pl-1">
                    {HIGH_VIS_COLORS.map(c => (
                        <button
                            key={c.hex}
                            onClick={() => setColor(c.hex)}
                            className={`w-6 h-6 rounded-full transition-transform transform hover:scale-110 border ${
                                c.hex === '#000000' ? 'border-gray-500' : 'border-black/40'
                            } ${
                                color.toUpperCase() === c.hex && tool !== 'eraser' 
                                    ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white scale-110' 
                                    : ''
                            }`}
                            style={{ backgroundColor: c.hex }}
                            aria-label={c.label}
                            title={c.label}
                        />
                    ))}
                    {/* Custom Color Picker */}
                    <label 
                        htmlFor="color-picker"
                        className="relative w-6 h-6 block cursor-pointer ml-0.5"
                        title="Custom Color"
                    >
                        <div 
                            className="w-full h-full rounded-full transition-transform transform hover:scale-110 border border-black/40 shadow-inner"
                            style={{ background: 'conic-gradient(from 90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }}
                        />
                        <div 
                            className={`absolute -inset-0.5 rounded-full ${
                                !HIGH_VIS_COLORS.some(c => c.hex === color.toUpperCase()) && tool !== 'eraser' 
                                    ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' 
                                    : ''
                            }`} 
                            aria-hidden="true"
                        />
                        <input
                            id="color-picker"
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="absolute w-full h-full top-0 left-0 opacity-0 cursor-pointer"
                        />
                    </label>
                </div>

                {/* Brush / Eraser Size Slider */}
                <div className="flex items-center gap-1.5 bg-gray-700/60 px-2 py-1 rounded-md">
                    <span className="text-[11px] text-gray-300 font-mono w-7 text-right select-none">{brushSize}px</span>
                    <input
                        id="brush-size"
                        type="range"
                        min={tool === 'eraser' ? 6 : 2}
                        max={tool === 'eraser' ? 60 : 30}
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-16 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        title={tool === 'eraser' ? `Eraser Size: ${brushSize}px` : `Brush Size: ${brushSize}px`}
                    />
                </div>
            </div>

            <div className="w-px h-6 bg-gray-600 hidden sm:block"></div>

            {/* Actions: Undo, Redo, Clear */}
            <div className="flex items-center gap-1">
                <ToolButton label="Undo (Z)" isActive={false} disabled={!canUndo} onClick={onUndo}>
                    <UndoIcon className="w-5 h-5" />
                </ToolButton>
                <ToolButton label="Redo (Y / Shift+Z)" isActive={false} disabled={!canRedo} onClick={onRedo}>
                    <RedoIcon className="w-5 h-5" />
                </ToolButton>
                <ToolButton label="Clear All Annotations" isActive={false} onClick={onClearAll}>
                    <TrashIcon className="w-5 h-5" />
                </ToolButton>
            </div>
        </div>
    );
};

export default DrawingToolbar;