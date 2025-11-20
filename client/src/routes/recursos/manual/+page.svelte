<svelte:head>
    <title>Manual de Usuario - DUA-Conecta</title>
</svelte:head>

<div class="page-header-wrapper">
    <div class="container">
        <a href="/" class="back-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Volver al Inicio
        </a>
    </div>
</div>

<main class="manual-container">
    <div class="manual-card">
        <div class="icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open-text"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/><path d="M6 8h2"/><path d="M6 12h2"/><path d="M16 8h2"/><path d="M16 12h2"/></svg>
        </div>
        <h1>Manual de Usuario</h1>
        <p class="description">
            Descarga nuestra guía oficial en PDF. Aprende paso a paso cómo crear actividades, usar el editor y sacar el máximo provecho a todas las herramientas de DUA-Conecta.
        </p>

        <div class="download-section">
            <a href="/manual.pdf" download="Manual_DUA_Conecta.pdf" class="btn-download">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Descargar Manual (PDF)
            </a>
            <span class="file-info">Formato PDF • Lectura rápida</span>
        </div>
    </div>
</main>

<style>
    .page-header-wrapper { background: var(--bg-card); border-bottom: 1px solid var(--border-color); padding: 1rem 0; position: sticky; top: 0; z-index: 10; }
    .container { max-width: 800px; margin: 0 auto; padding: 0 1.5rem; }
    .back-btn { text-decoration: none; font-weight: 600; color: var(--text-light); font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem; transition: color 0.2s; }
    .back-btn:hover { color: var(--primary-color); }

    .manual-container { 
        display: flex; 
        justify-content: center; 
        align-items: center; 
        min-height: 80vh; 
        padding: 2rem 1.5rem; 
    }

    .manual-card { 
        background: var(--bg-card); 
        border-radius: 24px; 
        padding: 4rem 2rem; 
        max-width: 600px; 
        width: 100%; 
        text-align: center; 
        box-shadow: 0 20px 40px rgba(0,0,0,0.08); 
        border: 1px solid var(--border-color);
    }

    .icon-wrapper {
        color: var(--primary-color);
        margin-bottom: 1.5rem;
        background: var(--bg-section);
        width: 100px;
        height: 100px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: auto;
        margin-right: auto;
    }

    h1 { font-size: 2.2rem; color: var(--text-dark); margin-bottom: 1rem; font-weight: 800; }
    .description { font-size: 1.1rem; color: var(--text-light); line-height: 1.6; margin-bottom: 3rem; }

    .btn-download {
        display: inline-flex;
        align-items: center;
        gap: 0.8rem;
        background: var(--primary-color);
        color: white;
        padding: 1rem 2rem;
        border-radius: 50px;
        text-decoration: none;
        font-weight: 700;
        font-size: 1.1rem;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 10px 20px rgba(160, 132, 232, 0.3);
    }
    .btn-download:hover { transform: translateY(-3px); box-shadow: 0 15px 25px rgba(160, 132, 232, 0.4); }
    
    .file-info { display: block; margin-top: 1rem; font-size: 0.85rem; color: var(--text-light); opacity: 0.8; }
</style>