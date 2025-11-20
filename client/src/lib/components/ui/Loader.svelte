<div class="loading-wrapper">
    <div class="loader-content">
        <div class="spinner"></div>
        <h2>Cargando...</h2>
        <p>Estamos preparando tu actividad.</p>
    </div>
</div>

<style>
    .loading-wrapper {
        height: 100vh;
        width: 100%;
        position: fixed;
        top: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--bg-main);
        z-index: 9999;
    }
    .loader-content { text-align: center; }
    .spinner {
        width: 60px; height: 60px;
        border: 6px solid var(--border-color);
        border-top-color: var(--primary-color);
        border-radius: 50%;
        margin: 0 auto 1.5rem;
        animation: spin 1s linear infinite;
    }
    h2 { font-size: 1.5rem; color: var(--text-dark); margin-bottom: 0.5rem; }
    p { color: var(--text-light); font-size: 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
</style>