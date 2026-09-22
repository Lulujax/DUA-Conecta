// src/lib/sanitize.ts
// Saneamiento ligero de HTML rico (texto editable del editor) y CSS inline.
// Permite el formato básico que produce document.execCommand, pero elimina
// scripts, event handlers, iframes, urls peligrosas y estilos con url()/expression.

const ALLOWED_TAGS = new Set([
	'A', 'B', 'BR', 'BLOCKQUOTE', 'DIV', 'EM', 'FONT', 'I', 'LI', 'OL',
	'P', 'S', 'SPAN', 'STRONG', 'STRIKE', 'SUB', 'SUP', 'U', 'UL'
]);

const ALLOWED_ATTRS = new Set(['href', 'style', 'face', 'color', 'size', 'type', 'start', 'value', 'title']);

function sanitizeCss(css: string): string {
	const safe: string[] = [];
	for (const decl of css.split(';')) {
		const d = decl.trim();
		if (!d) continue;
		if (/url\(|expression|javascript:|behavior\s*:|@import|-[a-z]+expression/i.test(d)) continue;
		safe.push(d);
	}
	return safe.join(';').slice(0, 2000);
}

export function sanitizeRichText(html: string): string {
	if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return '';
	if (!html) return '';

	const doc = new DOMParser().parseFromString(html, 'text/html');

	// Eliminar nodos peligrosos/ajenos antes de recorrer
	doc.body.querySelectorAll('style, script, iframe, object, embed, link, meta').forEach((n) => n.remove());

	function dropComments(node: Node) {
		const children = Array.from(node.childNodes);
		for (const child of children) {
			if (child.nodeType === Node.COMMENT_NODE) {
				node.removeChild(child);
			} else {
				dropComments(child);
			}
		}
	}
	dropComments(doc.body);

	function clean(node: Element) {
		for (const el of Array.from(node.children) as HTMLElement[]) {
			const tag = el.tagName.toUpperCase();
			if (!ALLOWED_TAGS.has(tag)) {
				while (el.firstChild) node.insertBefore(el.firstChild, el);
				node.removeChild(el);
				continue;
			}
			for (const attr of Array.from(el.attributes)) {
				const name = attr.name.toLowerCase();
				if (name.startsWith('on') || !ALLOWED_ATTRS.has(name) && name !== 'src') {
					el.removeAttribute(attr.name);
					continue;
				}
				if (name === 'href' || name === 'src') {
					const v = (attr.value || '').trim().toLowerCase();
					if (!/^(#|\.|\/(?!\/)|https?:|mailto:)/.test(v) || /javascript:|data:/i.test(v)) {
						el.removeAttribute(attr.name);
					}
				}
			}
			if (el.hasAttribute('style')) {
				el.setAttribute('style', sanitizeCss(el.getAttribute('style') || ''));
			}
			clean(el);
		}
	}
	clean(doc.body);

	return doc.body.innerHTML;
}

const SAFE_COLOR = /^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})|rgba?\(\s*[\d.\s,]+%?\s*\)|transparent|currentColor)$/;

export function safeColor(value: string | null | undefined, fallback: string): string {
	const v = (value || '').trim();
	return SAFE_COLOR.test(v) ? v : fallback;
}