<svelte:head>
    <title>Política de Privacidad - DUA-Conecta</title>
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
        <h1>Política de Privacidad</h1>
        <p class="last-updated">Última actualización: {new Date().toLocaleDateString()}</p>

        <div class="content">
            <section>
                <h2>1. Introducción</h2>
                <p>Tu privacidad es importante. Esta política explica de manera simple y transparente qué hacemos con tus datos en DUA-Conecta.</p>
            </section>

            <section>
                <h2>2. Datos que recopilamos</h2>
                <ul>
                    <li><strong>Cuenta:</strong> Tu nombre, correo electrónico y contraseña (guardada de forma segura y encriptada).</li>
                    <li><strong>Actividades:</strong> Los nombres y personalizaciones que guardas en tus fichas. Recomendamos usar solo nombres de pila.</li>
                    <li><strong>Cookies:</strong> Usamos cookies esenciales para mantener tu sesión activa y segura.</li>
                </ul>
            </section>

            <section>
                <h2>3. Uso de la información</h2>
                <p>Solo usamos tus datos para:</p>
                <ul>
                    <li>Darte acceso a tu cuenta y guardar tu trabajo.</li>
                    <li>Generar los PDFs que descargas.</li>
                    <li>Mejorar la plataforma (análisis anónimos).</li>
                </ul>
                <p><strong>Nunca vendemos tus datos a terceros.</strong></p>
            </section>

            <section>
                <h2>4. Tus Derechos</h2>
                <p>Eres dueño de tu información. Puedes pedirnos que borremos tu cuenta y todos tus datos en cualquier momento a través de la sección de contacto.</p>
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