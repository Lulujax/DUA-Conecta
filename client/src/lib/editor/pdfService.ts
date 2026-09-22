// src/lib/editor/pdfService.ts
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { API_BASE_URL } from '$lib/api';

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

	// Las imágenes externas (Pixabay/Pexels) no envían CORS y "manchan" el canvas.
	// Las servimos a través del proxy del backend (mismo origen + ACAO: *) y las
	// restauramos al terminar para no alterar el editor.
	const swapped: { img: HTMLImageElement, original: string }[] = [];
	canvasContainerRef.querySelectorAll<HTMLImageElement>('img[src^="http"]').forEach((img) => {
		const original = img.getAttribute('src')!;
		swapped.push({ img, original });
		img.setAttribute('src', `${API_BASE_URL}/api/image-proxy?url=${encodeURIComponent(original)}`);
	});

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
		// Esperar a que las imágenes proxificadas terminen de cargar
		await Promise.all(swapped.map(({ img }) => img.decode().catch(() => {})));

		// 1. Generar el canvas con alta fidelidad
		const canvas = await html2canvas(canvasContainerRef, options);
		
		// 2. Usar PNG (Lossless) en lugar de JPEG para textos nítidos
		const imgData = canvas.toDataURL('image/png'); 

		// 3. Hoja Carta (8.5"x11", por defecto en Latinoamérica)
		// El canvas mantiene proporción A4, así que encajamos la imagen dentro de
		// la página Carta preservando la proporción y centrándola (sin deformar ni cortar).
		const pdf = new jsPDF('p', 'px', 'letter'); 
		const pdfWidth = pdf.internal.pageSize.getWidth();
		const pdfHeight = pdf.internal.pageSize.getHeight();
		
		const imgProps = pdf.getImageProperties(imgData);
		const scale = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
		const imgW = imgProps.width * scale;
		const imgH = imgProps.height * scale;
		const x = (pdfWidth - imgW) / 2;
		const y = (pdfHeight - imgH) / 2;
		
		// Renderizar
		pdf.addImage(imgData, 'PNG', x, y, imgW, imgH);

		// 4. Guardar
		pdf.save(filename); 

	} catch (error) {
		console.error('Error al generar PDF:', error);
		// Lanzamos el error para que el componente sepa que falló y quite el spinner
		throw error;
	} finally {
		swapped.forEach(({ img, original }) => img.setAttribute('src', original));
	}
}

export const pdfService = {
	downloadPdf
};