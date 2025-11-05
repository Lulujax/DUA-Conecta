<script lang="ts">
	import TemplateEditor from '$lib/components/TemplateEditor.svelte';

	// 1. Definimos el ID de esta plantilla
	const templateId = '2';
    
	// 2. Definimos los elementos base para la Plantilla 2
	const BASE_ELEMENTS: Array<any> = [
        { id: 1, type: 'text', content: 'EMOCIONES CON LUPA', x: 40, y: 40, width: 350, height: 40, fontSize: 28, color: '#3D246C', isBold: true, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
		{ id: 2, type: 'text', content: 'Nombre:', x: 450, y: 40, width: 80, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
		{ id: 102, type: 'text', content: '__________________', x: 530, y: 40, width: 130, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
		{ id: 3, type: 'text', content: 'Fecha:', x: 450, y: 70, width: 80, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
		{ id: 103, type: 'text', content: '__________________', x: 530, y: 70, width: 130, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
		{ id: 4, type: 'text', content: 'Lee con atención cada situación.\nDespués, une con una flecha la emoción que crees que encaja mejor.\nAlgunas emociones pueden parecerse... ¡pero piensa bien antes de decidir!', x: 40, y: 110, width: 620, height: 60, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
        { id: 10, type: 'image', url: '/emocion-verguenza.png', x: 90, y: 200, width: 100, height: 80 },
		{ id: 11, type: 'text', content: 'VERGÜENZA', x: 90, y: 285, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
	    { id: 20, type: 'image', url: '/emocion-orgullo.png', x: 90, y: 310, width: 100, height: 80 },
		{ id: 21, type: 'text', content: 'ORGULLO', x: 90, y: 395, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 30, type: 'image', url: '/emocion-calma.png', x: 90, y: 420, width: 100, height: 80 },
		{ id: 31, type: 'text', content: 'CALMA', x: 90, y: 505, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 40, type: 'image', url: '/emocion-confusion.png', x: 90, y: 530, width: 100, height: 80 },
		{ id: 41, type: 'text', content: 'CONFUSIÓN', x: 90, y: 615, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 50, type: 'image', url: '/emocion-culpa.png', x: 90, y: 640, width: 100, height: 80 },
		{ id: 51, type: 'text', content: 'CULPA', x: 90, y: 725, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 60, type: 'image', url: '/emocion-frustracion.png', x: 90, y: 750, width: 100, height: 80 },
		{ id: 61, type: 'text', content: 'FRUSTRACIÓN', x: 90, y: 835, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 12, type: 'text', content: 'La profe explicó el ejercicio, pero no entendí qué tenía que hacer.', x: 280, y: 205, width: 380, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 22, type: 'text', content: 'Quería explicar mi idea, pero nadie me escuchaba.', x: 280, y: 315, width: 380, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 32, type: 'text', content: 'Se me olvidó lo que iba a decir en voz alta y todos me miraron.', x: 280, y: 425, width: 380, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 42, type: 'text', content: 'Prometí ir al cumpleaños, pero me olvidé y no fui.', x: 280, y: 535, width: 380, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 52, type: 'text', content: 'Aprendí a montar en bici sin ayuda y me sentí muy feliz.', x: 280, y: 645, width: 380, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 62, type: 'text', content: 'Estaba pintando sin prisa, con música bajita, y me sentía en paz.', x: 280, y: 755, width: 380, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 99, type: 'text', content: '¡Gana tu ficha aquí!', x: 400, y: 940, width: 160, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'right', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
		{ id: 199, type: 'text', content: '___________', x: 570, y: 940, width: 100, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false}
	];
</script>

<svelte:head>
	<title>Editor - Emociones con Lupa - DUA-Conecta</title>
</svelte:head>

<TemplateEditor {templateId} baseElements={BASE_ELEMENTS} />