<script>
    import { slide } from 'svelte/transition';
    let openIndex = null;
    const faqs = [
        { q: "¿Es DUA-Conecta realmente gratuito?", a: "Sí, nuestra misión es apoyar a la educación inclusiva. Actualmente todas las herramientas y plantillas son de acceso libre." },
        { q: "¿Puedo usar mis propias imágenes?", a: "¡Por supuesto! En el editor, puedes subir fotos desde tu dispositivo para personalizar las actividades." },
        { q: "¿Se guardan mis actividades?", a: "Sí. Si tienes una cuenta registrada, todo lo que crees se guardará en la sección 'Mis Actividades'." },
        { q: "¿En qué formato se descargan las fichas?", a: "Todas las actividades se descargan en formato PDF de alta calidad." }
    ];
    function toggle(index) { openIndex = openIndex === index ? null : index; }
</script>

<svelte:head><title>FAQ - DUA-Conecta</title></svelte:head>

<div class="page-header-wrapper">
    <div class="container">
        <a href="javascript:history.back()" class="back-btn">← Volver</a>
    </div>
</div>

<main class="faq-container">
    <div class="header">
        <h1>Preguntas Frecuentes</h1>
        <p>Resolvemos tus dudas para que te enfoques en enseñar.</p>
    </div>
    <div class="faq-grid">
        {#each faqs as faq, i}
            <div class="faq-item" class:active={openIndex === i}>
                <button class="faq-question" on:click={() => toggle(i)}>
                    {faq.q}
                    <span class="icon">{openIndex === i ? '−' : '+'}</span>
                </button>
                {#if openIndex === i}
                    <div class="faq-answer" transition:slide><p>{faq.a}</p></div>
                {/if}
            </div>
        {/each}
    </div>
</main>

<style>
    .page-header-wrapper { background: var(--bg-card); border-bottom: 1px solid var(--border-color); padding: 1rem 0; position: sticky; top: 0; z-index: 10; }
    .container { max-width: 800px; margin: 0 auto; padding: 0 1.5rem; }
    .back-btn { text-decoration: none; font-weight: 700; color: var(--primary-color); }
    
    .faq-container { max-width: 800px; margin: 0 auto; padding: 3rem 1.5rem; }
    .header { text-align: center; margin-bottom: 3rem; }
    .header h1 { font-size: 2.5rem; color: var(--text-dark); margin-bottom: 0.5rem; }
    .header p { color: var(--text-light); }
    
    .faq-grid { display: flex; flex-direction: column; gap: 1rem; }
    .faq-item { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; transition: all 0.3s; }
    .faq-item.active { border-color: var(--primary-color); }
    .faq-question { width: 100%; text-align: left; padding: 1.5rem; background: none; border: none; display: flex; justify-content: space-between; align-items: center; font-size: 1.1rem; font-weight: 700; color: var(--text-dark); cursor: pointer; }
    .icon { font-size: 1.5rem; color: var(--primary-color); }
    .faq-answer { padding: 0 1.5rem 1.5rem 1.5rem; color: var(--text-light); line-height: 1.6; }
</style>