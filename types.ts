export type Tool = 
    | 'pen' 
    | 'arrow'
    | 'line' 
    | 'rectangle' 
    | 'rectangle-fill' 
    | 'circle' 
    | 'circle-fill'
    | 'eraser';
    
export type Quality = '720p' | '1080p';

export type MicStatus = 'idle' | 'active' | 'error';

export interface Point {
    x: number; // Normalized coordinate (0 to 1)
    y: number; // Normalized coordinate (0 to 1)
}

export interface Stroke {
    id: string;
    tool: Tool;
    color: string;
    brushSize: number;
    points: Point[];
}
