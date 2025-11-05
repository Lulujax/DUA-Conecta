<script lang="ts">
	import TemplateEditor from '$lib/components/TemplateEditor.svelte';

	// 1. Definimos el ID de esta plantilla
	const templateId = '3';
    
	// 2. Definimos los elementos base para la Plantilla 3
	const BASE_ELEMENTS: Array<any> = [
		{ id: 1, type: 'text', content: '¿COMO TE AYUDO?', x: 40, y: 40, width: 620, height: 40, fontSize: 36, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
		{ id: 2, type: 'text', content: 'Nombre:', x: 40, y: 100, width: 80, height: 20, fontSize: 14, color: '#000000', isBold: false, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
		{ id: 102, type: 'text', content: '__________________', x: 100, y: 100, width: 130, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
		{ id: 3, type: 'text', content: 'Fecha:', x: 280, y: 100, width: 80, height: 20, fontSize: 14, color: '#000000', isBold: false, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
		{ id: 103, type: 'text', content: '__________________', x: 330, y: 100, width: 130, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 4, type: 'text', content: 'Grado:', x: 510, y: 100, width: 80, height: 20, fontSize: 14, color: '#000000', isBold: false, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
		{ id: 104, type: 'text', content: '__________________', x: 560, y: 100, width: 130, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
		{ id: 5, type: 'text', content: 'Según lo que ves en la imagen ¿Qué le sucede? o ¿Cómo podemos ayudarlo?', x: 40, y: 140, width: 620, height: 40, fontSize: 16, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
        { id: 10, type: 'image', url: '/situacion-pelea.png', x: 60, y: 200, width: 140, height: 100 },
        { id: 11, type: 'text', content: '• ________________________', x: 220, y: 250, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
		{ id: 20, type: 'image', url: '/situacion-llora-solo.png', x: 60, y: 340, width: 140, height: 100 },
        { id: 21, type: 'text', content: '• ________________________', x: 220, y: 390, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 30, type: 'image', url: '/situacion-quita-juguete.png', x: 60, y: 480, width: 140, height: 100 },
        { id: 31, type: 'text', content: '• ________________________', x: 220, y: 530, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 40, type: 'image', url: '/situacion-ayuda.png', x: 60, y: 620, width: 140, height: 100 },
        { id: 41, type: 'text', content: '• ________________________', x: 220, y: 670, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 50, type: 'image', url: '/situacion-consola.png', x: 380, y: 200, width: 140, height: 100 },
        { id: 51, type: 'text', content: '• ________________________', x: 540, y: 250, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 60, type: 'image', url: '/situacion-bici.png', x: 380, y: 340, width: 140, height: 100 },
        { id: 61, type: 'text', content: '• ________________________', x: 540, y: 390, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 70, type: 'image', url: '/situacion-resbala.png', x: 380, y: 480, width: 140, height: 100 },
        { id: 71, type: 'text', content: '• ________________________', x: 540, y: 530, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 80, type: 'image', url: '/situacion-curita.png', x: 380, y: 620, width: 140, height: 100 },
        { id: 81, type: 'text', content: '• ________________________', x: 540, y: 670, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
		{ id: 99, type: 'text', content: '¡Gana tu ficha aquí!', x: 400, y: 880, width: 160, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'right', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
		{ id: 199, type: 'text', content: '___________', x: 570, y: 880, width: 100, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false}
	];
</script>

<svelte:head>
	<title>Editor - ¿Cómo te ayudo? - DUA-Conecta</title>
</svelte:head>

<TemplateEditor {templateId} baseElements={BASE_ELEMENTS} />