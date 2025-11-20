<svelte:head><title>Manual de Usuario - DUA-Conecta</title></svelte:head>

<div class="page-header-wrapper">
    <div class="container">
        <a href="javascript:history.back()" class="back-btn">← Volver</a>
    </div>
</div>

<main class="manual-container">
    <article class="prose">
        <h1>Manual de Usuario</h1>
        <p class="intro">Aprende a sacar el máximo provecho a DUA-Conecta.</p>
        
        <div class="placeholder-content">
            <h2>1. Primeros Pasos</h2>
            <p>Para comenzar, regístrate y accede a tu panel de control. Desde allí podrás ver la biblioteca completa de plantillas.</p>
            
            <h2>2. Usando el Editor</h2>
            <p>Selecciona una plantilla. Haz clic en cualquier texto para editarlo. Puedes arrastrar imágenes desde tu computadora al lienzo.</p>
            
            <div class="info-box">
                <strong>Tip Pro:</strong> Usa el botón "Duplicar" en la barra de herramientas para crear variaciones rápidas de un elemento.
            </div>

            <h2>3. Guardar y Descargar</h2>
            <p>Usa el botón "Guardar" para almacenar tu progreso en la nube. Cuando termines, pulsa "Descargar PDF" para obtener una versión en alta calidad lista para imprimir.</p>
        </div>
    </article>
</main>

<style>
    .page-header-wrapper { background: var(--bg-card); border-bottom: 1px solid var(--border-color); padding: 1rem 0; position: sticky; top: 0; z-index: 10; }
    .container { max-width: 800px; margin: 0 auto; padding: 0 1.5rem; }
    .back-btn { text-decoration: none; font-weight: 700; color: var(--primary-color); }
    
    .manual-container { max-width: 800px; margin: 0 auto; padding: 3rem 1.5rem; }
    .prose h1 { font-size: 2.5rem; color: var(--text-dark); margin-bottom: 0.5rem; }
    .intro { font-size: 1.2rem; color: var(--text-light); margin-bottom: 3rem; border-bottom: 1px solid var(--border-color); padding-bottom: 2rem; }
    .prose h2 { font-size: 1.8rem; color: var(--primary-color); margin-top: 2.5rem; margin-bottom: 1rem; }
    .prose p { line-height: 1.8; color: var(--text-dark); margin-bottom: 1rem; }
    .info-box { background: var(--bg-section); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--primary-color); margin: 2rem 0; }
</style>