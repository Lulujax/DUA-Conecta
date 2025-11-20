<svelte:head>
    <title>Política de Privacidad - DUA-Conecta</title>
</svelte:head>

<div class="page-header-wrapper">
    <div class="container">
        <a href="javascript:history.back()" class="back-btn">← Volver</a>
    </div>
</div>

<main class="legal-container">
    <h1>Política de Privacidad</h1>
    <p class="last-updated">Última actualización: {new Date().toLocaleDateString()}</p>

    <section>
        <h2>1. Introducción</h2>
        <p>En <strong>DUA-Conecta</strong>, nos tomamos muy en serio la privacidad de nuestros usuarios y la de los estudiantes. Esta política describe qué datos recopilamos y cómo los utilizamos.</p>
    </section>

    <section>
        <h2>2. Datos que recopilamos</h2>
        <ul>
            <li><strong>Datos del Docente:</strong> Nombre, correo electrónico y contraseña (encriptada).</li>
            <li><strong>Datos de Actividades:</strong> Nombres de estudiantes (recomendamos usar solo nombres de pila o iniciales) y preferencias de personalización guardadas en las plantillas.</li>
            <li><strong>Cookies:</strong> Utilizamos cookies técnicas estrictamente necesarias para mantener tu sesión iniciada de forma segura.</li>
        </ul>
    </section>

    <section>
        <h2>3. Uso de la información</h2>
        <p>La información se utiliza exclusivamente para:</p>
        <ul>
            <li>Permitirte el acceso a tu cuenta y recuperar tu historial.</li>
            <li>Generar los archivos PDF personalizados.</li>
            <li>Mejorar la plataforma mediante análisis anónimos de uso.</li>
        </ul>
        <p><strong>No vendemos ni compartimos tus datos con terceros</strong> para fines publicitarios.</p>
    </section>

    <section>
        <h2>4. Seguridad</h2>
        <p>Tus contraseñas se almacenan mediante hash seguro. La comunicación con nuestros servidores está encriptada mediante SSL (HTTPS).</p>
    </section>
</main>

<style>
    /* Mismos estilos que Términos para consistencia */
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