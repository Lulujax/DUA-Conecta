<script>
    let subject = '';
    let body = '';
    function sendEmail() {
        const email = "soporte@dua-conecta.com";
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
</script>

<svelte:head><title>Contacto - DUA-Conecta</title></svelte:head>

<div class="page-header-wrapper">
    <div class="container">
        <a href="javascript:history.back()" class="back-btn">← Volver</a>
    </div>
</div>

<main class="contact-container">
    <div class="contact-card">
        <h1>Contáctanos</h1>
        <p>¿Tienes alguna duda o sugerencia? Escríbenos.</p>
        <form on:submit|preventDefault={sendEmail}>
            <div class="form-group">
                <label for="subject">Asunto</label>
                <input type="text" id="subject" bind:value={subject} placeholder="Ej: Problema con una plantilla" required>
            </div>
            <div class="form-group">
                <label for="message">Mensaje</label>
                <textarea id="message" bind:value={body} rows="5" placeholder="Cuéntanos cómo podemos ayudarte..." required></textarea>
            </div>
            <button type="submit" class="btn-primary">Enviar Correo</button>
        </form>
    </div>
</main>

<style>
    .page-header-wrapper { background: var(--bg-card); border-bottom: 1px solid var(--border-color); padding: 1rem 0; position: sticky; top: 0; z-index: 10; }
    .container { max-width: 800px; margin: 0 auto; padding: 0 1.5rem; }
    .back-btn { text-decoration: none; font-weight: 700; color: var(--primary-color); }

    .contact-container { display: flex; justify-content: center; padding: 4rem 1.5rem; }
    .contact-card { width: 100%; max-width: 500px; background: var(--bg-card); padding: 2.5rem; border-radius: 24px; border: 1px solid var(--border-color); text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
    h1 { margin: 0 0 0.5rem 0; color: var(--text-dark); }
    p { color: var(--text-light); margin-bottom: 2rem; }
    .form-group { text-align: left; margin-bottom: 1.5rem; }
    label { display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-dark); }
    input, textarea { width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-section); font-family: inherit; font-size: 1rem; }
    input:focus, textarea:focus { outline: none; border-color: var(--primary-color); }
    .btn-primary { width: 100%; padding: 1rem; font-size: 1rem; margin-top: 1rem; background: linear-gradient(45deg, var(--primary-color), var(--primary-hover)); color: white; border: none; border-radius: 50px; font-weight: 700; cursor: pointer; }
</style>