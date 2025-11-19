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
        z: number; // Capa (z-index)
        rotation?: number;
        
        // Propiedades de Texto
        content?: string;
        fontSize?: number;
        fontFamily?: string;
        color?: string; // Color del texto o borde
        textAlign?: TextAlign;
        isBold?: boolean;
        isItalic?: boolean;
        isUnderlined?: boolean;
        lineHeight?: number;

        // Propiedades de Imagen
        url?: string;
        opacity?: number;

        // Propiedades de Forma
        shapeType?: ShapeType;
        stroke?: string;       // Color del borde
        fill?: string | null;  // Color de fondo (null = transparente)
        strokeWidth?: number;
    }
}

export {};