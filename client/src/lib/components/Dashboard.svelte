<div class="dashboard-container">
    <div class="header-section">
        <h1 class="welcome-text">¿Qué vas a aprender hoy?</h1>
        <div class="search-bar-container">
            <input type="text" placeholder="Busca millones de plantillas" class="search-input" />
            <button class="create-button">Crear</button>
        </div>
    </div>

    <div class="content-sections">
        <div class="section">
            <h2>Plantillas Destacadas</h2>
            <div class="grid-container">
                <div class="template-card">
                    <p>Matemáticas</p>
                </div>
                <div class="template-card">
                    <p>Lectura</p>
                </div>
                <div class="template-card">
                    <p>Habilidades Sociales</p>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Mis Estudiantes Recientes</h2>
            <div class="grid-container">
                <div class="student-card">
                    <p>Estudiante 1</p>
                </div>
                <div class="student-card">
                    <p>Estudiante 2</p>
                </div>
                <div class="student-card">
                    <p>Estudiante 3</p>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .dashboard-container {
        display: flex;
        flex-direction: column;
        padding: 2rem;
        gap: 2rem;
        font-family: var(--font-body);
    }

    .header-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 1rem;
    }

    .welcome-text {
        font-size: 2.5rem;
        font-weight: 700;
        color: #333;
    }

    .search-bar-container {
        display: flex;
        width: 100%;
        max-width: 600px;
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
    }

    .search-input {
        border: none;
        padding: 0.8rem 1rem;
        flex-grow: 1;
        font-size: 1rem;
    }

    .search-input:focus {
        outline: none;
    }

    .create-button {
        background-color: var(--color-theme-1);
        color: white;
        border: none;
        padding: 0.8rem 1.5rem;
        cursor: pointer;
        font-weight: 700;
        transition: background-color 0.2s;
    }

    .create-button:hover {
        background-color: #e53e00;
    }

    .content-sections {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .grid-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1.5rem;
    }

    .template-card, .student-card {
        border-radius: 8px;
        padding: 2rem;
        text-align: center;
        background-color: #f9f9f9;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: transform 0.2s;
    }

    .template-card:hover, .student-card:hover {
        transform: translateY(-5px);
    }

    h2 {
        font-size: 1.5rem;
        font-weight: 600;
    }
</style>