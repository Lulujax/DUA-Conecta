// src/lib/editor/pdfService.ts
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
// --- *** CAMBIO: Ya no importamos el store aquí *** ---
// import { editorStore } from './editor.store.svelte';

/**
 * Genera y descarga un PDF del contenedor del canvas.
 * @param canvasContainerRef El elemento HTML <div class="canvas-container">
 * @param filename El nombre final deseado para el archivo PDF (ej. "Mi_Actividad.pdf")
 */
async function downloadPdf(canvasContainerRef: HTMLDivElement, filename: string) {
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
		
		pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);

		// --- *** CAMBIO: Usamos el filename que recibimos como parámetro *** ---
		pdf.save(filename); 
		// (Ya no mostramos la alerta aquí, la moveremos al Sidebar)

	} catch (error) {
		console.error('Error al generar PDF:', error);
		alert('Error al generar PDF. Revisa la consola.');
	}
}

export const pdfService = {
	downloadPdf
};