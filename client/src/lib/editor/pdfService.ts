// src/lib/editor/pdfService.ts
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { editorStore } from './editor.store.svelte';

/**
 * Genera y descarga un PDF del contenedor del canvas.
 * @param canvasContainerRef El elemento HTML <div class="canvas-container">
 */
async function downloadPdf(canvasContainerRef: HTMLDivElement) {
	if (!canvasContainerRef) {
		console.error('Error de PDF: No se encontró el contenedor del canvas.');
		alert('Error: No se encontró el área de diseño.');
		return;
	}

	const options = {
		scale: 2, 
		useCORS: true, 
		backgroundColor: '#FFFFFF', 
		scrollY: -window.scrollY, 
		scrollX: -window.scrollX,
		windowWidth: canvasContainerRef.scrollWidth,
		windowHeight: canvasContainerRef.scrollHeight
	};

	try {
		const canvas = await html2canvas(canvasContainerRef, options);
		const imgData = canvas.toDataURL('image/jpeg', 1.0); 

		const pdf = new jsPDF('p', 'px', 'a4'); 
		const pdfWidth = pdf.internal.pageSize.getWidth();
		const imgHeight = (canvas.height * pdfWidth) / canvas.width;
		
		// Lee el nombre de la actividad desde el store
		const activityName = editorStore.activityName.replace(/\s/g, '_');
		
		pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
		pdf.save(`DUA-Conecta_Actividad_${activityName}.pdf`);

		alert('¡PDF generado con éxito!');
	} catch (error) {
		console.error('Error al generar PDF:', error);
		alert('Error al generar PDF. Revisa la consola.');
	}
}

export const pdfService = {
	downloadPdf
};