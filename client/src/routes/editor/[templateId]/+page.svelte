<script lang="ts">
	import { page } from '$app/stores';
	import TemplateEditor from '$lib/components/TemplateEditor.svelte';

	// 1. Obtenemos el ID de la URL (así es como funciona la plantilla 1)
	const templateId = $page.params.templateId;

	// 2. Definimos los elementos base para la Plantilla 1
	const BASE_ELEMENTS: Array<any> = [
		{ id: 1, type: 'text', content: 'Nombre:', x: 50, y: 40, width: 60, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
		{ id: 101, type: 'text', content: '_____________________', x: 115, y: 40, width: 180, height: 20, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
		{ id: 2, type: 'text', content: 'Fecha:', x: 350, y: 40, width: 50, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
		{ id: 102, type: 'text', content: '__________', x: 405, y: 40, width: 100, height: 20, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
		{ id: 3, type: 'text', content: 'Grado:', x: 550, y: 40, width: 50, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
		{ id: 103, type: 'text', content: '______', x: 605, y: 40, width: 80, height: 20, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
		{ id: 4, type: 'text', content: 'El Monstruo de las Emociones', x: 50, y: 90, width: 600, height: 35, fontSize: 24, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
		{ id: 6, type: 'text', content: 'El monstruo siente muchas emociones, dice que en cada parte de su cuerpo hay una emoción ¿En qué parte del cuerpo sientes la emoción?', x: 50, y: 140, width: 600, height: 40, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
		{ id: 7, type: 'text', content: 'COLORES Y EMOCIONES:', x: 50, y: 200, width: 600, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
		{ id: 8, type: 'text', content: '• ROJO - IRA/MOLESTIA', x: 70, y: 230, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
		{ id: 9, type: 'text', content: '• MORADO - MIEDO', x: 70, y: 250, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
		{ id: 10, type: 'text', content: '• AZUL - TRISTEZA', x: 70, y: 270, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
		{ id: 11, type: 'text', content: '• AMARILLO - FELICIDAD', x: 70, y: 290, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
		{ id: 12, type: 'text', content: '• VERDE - ASCO', x: 70, y: 310, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
		{ id: 5, type: 'image', url: '/asdasda-removebg-preview.png', x: 200, y: 360, width: 300, height: 300 },
		{ id: 13, type: 'text', content: '¡Gana tu ficha aquí!', x: 380, y: 920, width: 160, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'right', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
		{ id: 113, type: 'text', content: '___________', x: 550, y: 920, width: 100, height: 20, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false}
	];
</script>

<svelte:head>
	<title>Editor - DUA-Conecta</title>
</svelte:head>

<TemplateEditor {templateId} baseElements={BASE_ELEMENTS} />