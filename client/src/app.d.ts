// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

    // --- DEFINICIONES DE TUS ELEMENTOS ---
    
    type ElementType = 'text' | 'image' | 'shape';
    type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow';
    type TextAlign = 'left' | 'center' | 'right' | 'justify';

    interface EditorElement {
        id: number;
        type: ElementType;
        x: number;
        y: number;
        width: number;
        height: number;
        z: number; 
        rotation?: number;
        
        // Propiedades de Texto (Rich Text)
        content?: string;       
        fontSize?: number;      
        fontFamily?: string;    
        color?: string;         
        textAlign?: TextAlign;  
        lineHeight?: number; 

        // Propiedades de Imagen
        url?: string;
        opacity?: number;
        flipX?: boolean; 

        // Propiedades de Forma
        shapeType?: ShapeType;
        stroke?: string;       
        fill?: string | null;  
        strokeWidth?: number;
    }
}

export {};