// client/src/lib/stores/toast.svelte.ts

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

class ToastManager {
    // Usamos $state (Svelte 5) para que la lista sea reactiva
    toasts = $state<Toast[]>([]);

    add(message: string, type: ToastType = 'info') {
        const id = Date.now();
        // Agregamos la notificación al array
        this.toasts.push({ id, message, type });

        // Programamos su autodestrucción en 3 segundos
        setTimeout(() => {
            this.remove(id);
        }, 3000);
    }

    remove(id: number) {
        this.toasts = this.toasts.filter(t => t.id !== id);
    }

    // Atajos para usar fácilmente: toast.success('Hola')
    success(msg: string) { this.add(msg, 'success'); }
    error(msg: string) { this.add(msg, 'error'); }
    info(msg: string) { this.add(msg, 'info'); }
}

// Exportamos una única instancia para usar en toda la app
export const toast = new ToastManager();