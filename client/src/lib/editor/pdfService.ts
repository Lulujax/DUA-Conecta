// src/lib/editor/pdfService.ts
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Genera y descarga un PDF de ALTA CALIDAD del contenedor del canvas.
 * @param canvasContainerRef El elemento HTML <div class="canvas-container">
 * @param filename El nombre final deseado para el archivo PDF
 */
async function downloadPdf(canvasContainerRef: HTMLDivElement, filename: string) {
	if (!canvasContainerRef) {
		console.error('Error de PDF: No se encontró el contenedor del canvas.');
		alert('Error: No se encontró el área de diseño.');
		return;
	}

	// CONFIGURACIÓN PRO: Alta resolución
	const options = {
		scale: 3, // 3x de resolución (aprox 300 DPI para impresión nítida)
		useCORS: true, // Permite cargar imágenes externas si las hubiera
		backgroundColor: '#FFFFFF', 
		scrollY: -window.scrollY, 
		scrollX: -window.scrollX,
		windowWidth: canvasContainerRef.scrollWidth,
		windowHeight: canvasContainerRef.scrollHeight,
		logging: false // Limpiamos la consola de ruido
	};

	try {
		// 1. Generar el canvas con alta fidelidad
		const canvas = await html2canvas(canvasContainerRef, options);
		
		// 2. Usar PNG (Lossless) en lugar de JPEG para textos nítidos
		const imgData = canvas.toDataURL('image/png'); 

		// 3. Calcular dimensiones para PDF A4
		const pdf = new jsPDF('p', 'px', 'a4'); 
		const pdfWidth = pdf.internal.pageSize.getWidth();
		const pdfHeight = pdf.internal.pageSize.getHeight();
		
		const imgProps = pdf.getImageProperties(imgData);
		const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
		
		// Renderizar
		pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);

		// 4. Guardar
		pdf.save(filename); 

	} catch (error) {
		console.error('Error al generar PDF:', error);
		// Lanzamos el error para que el componente sepa que falló y quite el spinner
		throw error;
	}
}

export const pdfService = {
	downloadPdf
};