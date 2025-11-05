<script lang="ts">
	import TemplateEditor from '$lib/components/TemplateEditor.svelte';

	// 1. Definimos el ID de esta plantilla
	const templateId = '4';
    
	// 2. Definimos los elementos base (Extraídos de tu código)
 	const CUBE_SIZE = 150;
    const ICON_SIZE = 100;
    const ICON_OFFSET = (CUBE_SIZE - ICON_SIZE) / 2; // 25
    
    // Dimensiones de tu imagen de solapa
    const SOLAPA_W = 150; 
    const SOLAPA_H = 50;  

    // Coordenadas base
    const Y_START = 200; // Margen superior
    const X_CENTER = 275; // El centro de la columna principal

    // Fila 1 (Naranja)
    const Y1 = Y_START;
    // Fila 2 (Azul)
    const Y2 = Y1 + CUBE_SIZE; // 350
    // Fila 3 (Amarillo, Rojo, Verde)
    const Y3 = Y2 + CUBE_SIZE; // 500
    // Fila 4 (Cian)
    const Y4 = Y3 + CUBE_SIZE; // 650
    
    // Columnas
    const X2 = X_CENTER;            // 275
    const X1 = X2 - CUBE_SIZE;      // 125
    const X3 = X2 + CUBE_SIZE;      // 425

	const BASE_ELEMENTS: Array<any> = [
        // --- Textos (Capa más alta) ---
        { id: 1, type: 'text', content: 'El Dado de las Historias', x: 40, y: 40, width: 620, height: 40, fontSize: 36, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false, z: 100},
        { id: 2, type: 'text', content: 'Un dado grande con imágenes (personaje, lugar, objeto). El niño lanza el dado y empieza una historia con ese elemento.', x: 40, y: 100, width: 220, height: 160, fontSize: 16, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false, z: 100 },

        // --- CAPA 1 (Fondo): Cuadrados de Colores ---
        // (z-index bajo)
        { id: 10, type: 'image', url: '/dado-naranja.png', x: X2, y: Y1, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 },
        { id: 11, type: 'image', url: '/dado-azul.png', x: X2, y: Y2, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 },
        { id: 12, type: 'image', url: '/dado-rojo.png', x: X2, y: Y3, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 }, 
        { id: 13, type: 'image', url: '/dado-cian.png', x: X2, y: Y4, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 }, 
        { id: 14, type: 'image', url: '/dado-amarillo.png', x: X1, y: Y3, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 },
        { id: 15, type: 'image', url: '/dado-verde.png', x: X3, y: Y3, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 },

        // --- CAPA 2: Iconos ---
        // (z-index medio, encima de los colores)
        { id: 20, type: 'image', url: '/dado-icono-persona.png', x: X2 + ICON_OFFSET, y: Y1 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
        { id: 21, type: 'image', url: '/dado-icono-lugar.png', x: X2 + ICON_OFFSET, y: Y2 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
        { id: 22, type: 'image', url: '/dado-icono-persona.png', x: X2 + ICON_OFFSET, y: Y3 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
        { id: 23, type: 'image', url: '/dado-icono-lugar.png', x: X2 + ICON_OFFSET, y: Y4 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
        { id: 24, type: 'image', url: '/dado-icono-objeto.png', x: X1 + ICON_OFFSET, y: Y3 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
        { id: 25, type: 'image', url: '/dado-icono-objeto.png', x: X3 + ICON_OFFSET, y: Y3 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },

        // --- CAPA 3: Solapas (NUEVO) ---
        // (z-index alto, encima de todo. Estas son las coordenadas corregidas)
        // Solapas Horizontales
        { id: 30, type: 'image', url: '/dado-solapa.png', x: X2, y: 155, width: SOLAPA_W, height: SOLAPA_H, rotation: 0, z: 3 },
        { id: 31, type: 'image', url: '/dado-solapa.png', x: X1, y: 454, width: SOLAPA_W, height: SOLAPA_H, rotation: 0, z: 3 },
        { id: 32, type: 'image', url: '/dado-solapa.png', x: X3, y: 456, width: SOLAPA_W, height: SOLAPA_H, rotation: 0, z: 3 },
        { id: 33, type: 'image', url: '/dado-solapa.png', x: X2, y: 794, width: SOLAPA_W, height: SOLAPA_H, rotation: 180, z: 3 },
        
        // Solapas Verticales (Rotadas) - COORDENADAS CORREGIDAS
        // Lógica: La caja de la solapa es 150x50.
        // x = (Borde del Cubo) - (Alto de la Solapa)
        // y = (Borde del Cubo) + (Mitad Cubo) - (Mitad Ancho Solapa)
        { id: 34, type: 'image', url: '/dado-solapa.png', x:30, y: 550, width: SOLAPA_W, height: SOLAPA_H, rotation: 270, z: 3 }, // Izquierda de Amarillo
        { id: 35, type: 'image', url: '/dado-solapa.png', x: 521, y: 550, width: SOLAPA_W, height: SOLAPA_H, rotation: 90, z: 3 },  // Derecha de Verde
        { id: 36, type: 'image', url: '/dado-solapa.png', x: 125, y: 645, width: SOLAPA_W, height: SOLAPA_H, rotation: 180, z: 3 }, // Izquierda de Cian
        { id: 37, type: 'image', url: '/dado-solapa.png', x: X2 + CUBE_SIZE, y: 646, width: SOLAPA_W, height: SOLAPA_H, rotation: 180, z: 3 }  // Derecha de Cian
    ];
</script>

<svelte:head>
	<title>Editor - Dado de Historias - DUA-Conecta</title>
</svelte:head>

<TemplateEditor {templateId} baseElements={BASE_ELEMENTS} />