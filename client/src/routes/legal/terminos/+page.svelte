<svelte:head>
    <title>Términos del Servicio - DUA-Conecta</title>
</svelte:head>

<div class="page-header-wrapper">
    <div class="container">
        <a href="javascript:history.back()" class="back-btn">← Volver</a>
    </div>
</div>

<main class="legal-container">
    <h1>Términos del Servicio</h1>
    <p class="last-updated">Última actualización: {new Date().toLocaleDateString()}</p>

    <section>
        <h2>1. Aceptación de los Términos</h2>
        <p>Al registrarte y utilizar <strong>DUA-Conecta</strong>, aceptas cumplir con estos términos. Si no estás de acuerdo, por favor no utilices el servicio.</p>
    </section>

    <section>
        <h2>2. Uso Aceptable</h2>
        <p>DUA-Conecta es una herramienta para la creación de material educativo inclusivo. Te comprometes a:</p>
        <ul>
            <li>No subir imágenes ofensivas, ilegales o con derechos de autor protegidos sin permiso.</li>
            <li>No intentar dañar, hackear o sobrecargar nuestros servidores.</li>
            <li>Usar la plataforma con fines educativos y éticos.</li>
        </ul>
    </section>

    <section>
        <h2>3. Propiedad Intelectual</h2>
        <p>Las plantillas base y el diseño de la plataforma son propiedad de DUA-Conecta. El material que tú generes y personalices te pertenece a ti para su uso en el aula.</p>
    </section>

    <section>
        <h2>4. Limitación de Responsabilidad</h2>
        <p>El servicio se ofrece "tal cual". No garantizamos que la plataforma esté libre de errores o disponible el 100% del tiempo, aunque trabajamos duro para que así sea. No nos hacemos responsables por la pérdida de datos accidentales.</p>
    </section>
</main>

<style>
    .page-header-wrapper { background: var(--bg-card); border-bottom: 1px solid var(--border-color); padding: 1rem 0; position: sticky; top: 0; z-index: 10; }
    .container { max-width: 800px; margin: 0 auto; padding: 0 1.5rem; }
    .back-btn { text-decoration: none; font-weight: 700; color: var(--primary-color); font-size: 0.95rem; }
    .back-btn:hover { text-decoration: underline; }

    .legal-container { max-width: 800px; margin: 0 auto; padding: 3rem 1.5rem; color: var(--text-dark); }
    h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; }
    .last-updated { color: var(--text-light); font-size: 0.9rem; margin-bottom: 3rem; }
    section { margin-bottom: 2.5rem; }
    h2 { font-size: 1.5rem; margin-bottom: 1rem; color: var(--primary-color); }
    p, li { font-size: 1.05rem; line-height: 1.7; margin-bottom: 1rem; }
    ul { padding-left: 1.5rem; }
</style>