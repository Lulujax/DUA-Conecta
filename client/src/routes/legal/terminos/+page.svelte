<svelte:head>
    <title>Términos del Servicio - DUA-Conecta</title>
</svelte:head>

<div class="page-header-wrapper">
    <div class="container">
        <a href="/" class="back-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Volver al Inicio
        </a>
    </div>
</div>

<main class="content-wrapper">
    <div class="document-card">
        <h1>Términos del Servicio</h1>
        <p class="last-updated">Última actualización: {new Date().toLocaleDateString()}</p>

        <div class="content">
            <section>
                <h2>1. Aceptación</h2>
                <p>Al registrarte y utilizar <strong>DUA-Conecta</strong>, aceptas cumplir con estos términos. Si no estás de acuerdo, por favor no utilices el servicio.</p>
            </section>

            <section>
                <h2>2. Uso Aceptable</h2>
                <p>Te comprometes a usar la plataforma con fines educativos y éticos. Está prohibido:</p>
                <ul>
                    <li>Subir contenido ofensivo o ilegal.</li>
                    <li>Intentar dañar la seguridad del sitio.</li>
                    <li>Compartir tu cuenta con terceros no autorizados.</li>
                </ul>
            </section>

            <section>
                <h2>3. Propiedad Intelectual</h2>
                <p>Las plantillas base son propiedad de DUA-Conecta. El material educativo que tú personalices y generes te pertenece a ti para su uso en el aula.</p>
            </section>

            <section>
                <h2>4. Responsabilidad</h2>
                <p>El servicio se ofrece "tal cual". Trabajamos para que esté siempre disponible, pero no nos hacemos responsables por interrupciones del servicio o pérdida de datos no guardados.</p>
            </section>
        </div>
    </div>
</main>

<style>
    .page-header-wrapper { background: var(--bg-card); border-bottom: 1px solid var(--border-color); padding: 1rem 0; position: sticky; top: 0; z-index: 10; }
    .container { max-width: 900px; margin: 0 auto; padding: 0 1.5rem; }
    .back-btn { text-decoration: none; font-weight: 600; color: var(--text-light); font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem; transition: color 0.2s; }
    .back-btn:hover { color: var(--primary-color); }

    .content-wrapper { padding: 3rem 1.5rem; display: flex; justify-content: center; }
    .document-card { background: var(--bg-card); max-width: 800px; width: 100%; padding: 3rem; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.03); border: 1px solid var(--border-color); }
    
    h1 { font-size: 2.5rem; font-weight: 800; color: var(--text-dark); margin-bottom: 0.5rem; }
    .last-updated { color: var(--text-light); font-size: 0.9rem; margin-bottom: 3rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); }
    
    section { margin-bottom: 2.5rem; }
    h2 { font-size: 1.4rem; color: var(--primary-color); margin-bottom: 1rem; font-weight: 700; }
    p, li { font-size: 1.05rem; line-height: 1.7; color: var(--text-dark); opacity: 0.9; margin-bottom: 1rem; }
    ul { padding-left: 1.5rem; }
    li { margin-bottom: 0.5rem; }
</style>