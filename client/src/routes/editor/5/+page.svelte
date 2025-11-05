<script lang="ts">
	import TemplateEditor from '$lib/components/TemplateEditor.svelte';

	// 1. Definimos el ID de esta plantilla
	const templateId = '5';
    
	// ------------------------------------------------------------------
	// --- *** ZONA DE AJUSTES VISUALES *** ---
	// ------------------------------------------------------------------

    // --- Banderas Decorativas (¡AHORA MÚLTIPLES!) ---
    // (Estos 3 elementos crean la "escalera" detrás de BINGO)
    const flagWidth = 300; // Ancho para cada tira de banderas
    const flagHeight = 60; // Alto para cada tira

    // Aquí puedes ajustar la posición y rotación de cada bandera
    const flag1 = { id: 4, type: 'image', url: '/banderas-decoracion.png', x: 20, y: 30, width: flagWidth, height: flagHeight, rotation: -5, z: 1 };
    const flag2 = { id: 5, type: 'image', url: '/banderas-decoracion.png', x: 200, y: 20, width: flagWidth, height: flagHeight, rotation: 0, z: 1 };
    const flag3 = { id: 6, type: 'image', url: '/banderas-decoracion.png', x: 380, y: 30, width: flagWidth, height: flagHeight, rotation: 5, z: 1 };


    // --- Título "BINGO" ---
    const bingoFontSize = 95;
    const bingoHeight = 130;
    const bingoLineHeight = 1.0; 
    const bingoY = 80; // Posición Y fija, encima de las banderas

    // --- Subtítulo ---
    const subtitleHeight = 40;
    const subtitleY = bingoY + bingoHeight - 20; 

    // --- Cuadrícula de Juego ---
    const gridWidth = 620;
    const rowHeight = 130;
    const y1 = subtitleY + subtitleHeight + 20;

	// ------------------------------------------------------------------
	// --- (Fin de la Zona de Ajustes) ---
	// ------------------------------------------------------------------

	// --- Cálculos automáticos (No tocar) ---
    const gridX = (700 - gridWidth) / 2;
    const y2 = y1 + rowHeight, y3 = y2 + rowHeight, y4 = y3 + rowHeight, y5 = y4 + rowHeight; 
    const colWidth = gridWidth / 5, textWidth = 110, textHeight = 36, textFontSize = 16; 
    const textXOffset = (colWidth - textWidth) / 2, textYOffset = 82;
    const x1 = gridX + textXOffset, x2 = x1 + colWidth, x3 = x2 + colWidth, x4 = x3 + colWidth, x5 = x4 + colWidth;

    const createText = (id: number, x: number, y: number, content = '...') => ({
        id: id, type: 'text', content: content, x: x, y: y + textYOffset,
        width: textWidth, height: textHeight, fontSize: textFontSize,
        color: '#000000', isBold: false, textAlign: 'center', fontFamily: 'Arial',
        isItalic: false, isUnderlined: false, z: 10
    });

	const BASE_ELEMENTS: Array<any> = [
        // --- Banderas Decorativas (NUEVA SECUENCIA) ---
        flag1,
        flag2,
        flag3,

        // --- Encabezado ---
		{ 
            id: 1, type: 'text', content: 'BINGO', 
            x: 40, y: bingoY, 
            width: 620, height: bingoHeight, 
            fontSize: bingoFontSize, 
            lineHeight: bingoLineHeight, 
            color: '#000000', isBold: true, 
            textAlign: 'center', fontFamily: 'Anton', 
            isItalic: false, isUnderlined: false, 
            z: 2 // z: 2 para estar SOBRE las banderas (z: 1)
        },
		{ id: 2, type: 'shape', shapeType: 'rectangle', x: 40, y: subtitleY, width: 620, height: subtitleHeight, fill: '#000000', stroke: '#000000', strokeWidth: 0, z: 2},
        { id: 3, type: 'text', content: 'EL PRIMERO QUE CANTE GANA', x: 40, y: subtitleY + 8, width: 620, height: 30, fontSize: 20, color: '#FFFFFF', isBold: true, textAlign: 'center', fontFamily: 'Oswald', isItalic: false, isUnderlined: false, z: 3 }, // z: 3 para estar sobre la barra negra

        // --- Cuadrícula (Las 5 tiras de imágenes) ---
        { id: 10, type: 'image', url: '/banderas-bingo-1.png', x: gridX, y: y1, width: gridWidth, height: rowHeight, z: 1 },
        { id: 11, type: 'image', url: '/banderas-bingo-2.png', x: gridX, y: y2, width: gridWidth, height: rowHeight, z: 1 },
        { id: 12, type: 'image', url: '/banderas-bingo-3.png', x: gridX, y: y3, width: gridWidth, height: rowHeight, z: 1 },
        { id: 13, type: 'image', url: '/banderas-bingo-4.png', x: gridX, y: y4, width: gridWidth, height: rowHeight, z: 1 },
        { id: 14, type: 'image', url: '/banderas-bingo-5.png', x: gridX, y: y5, width: gridWidth, height: rowHeight, z: 1 },

        // --- Textos Editables (Capa 3 - z:10) ---
        createText(100, x1, y1), createText(101, x2, y1), createText(102, x3, y1), createText(103, x4, y1), createText(104, x5, y1),
        createText(105, x1, y2), createText(106, x2, y2), createText(107, x3, y2), createText(108, x4, y2), createText(109, x5, y2),
        createText(110, x1, y3), createText(111, x2, y3), { ...createText(112, x3, y3, 'PALABRA'), isBold: true, fontSize: 18 }, createText(113, x4, y3), createText(114, x5, y3),
        createText(115, x1, y4), createText(116, x2, y4), createText(117, x3, y4), createText(118, x4, y4), createText(119, x5, y4),
        createText(120, x1, y5), createText(121, x2, y5), createText(122, x3, y5), createText(123, x4, y5), createText(124, x5, y5),
	];
</script>

<svelte:head>
	<title>Editor - BINGO - DUA-Conecta</title>
</svelte:head>

<TemplateEditor {templateId} baseElements={BASE_ELEMENTS} />