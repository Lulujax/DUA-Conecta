<script lang="ts">
  // Lógica de la página (por ahora vacía)
</script>

<!-- ==================== -->
<!--      HEADER          -->
<!-- ==================== -->
<header class="header">
  <div class="logo">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shapes"><path d="M8.3 10a.7.7 0 0 1-.7.7 1.6 1.6 0 0 0-1.6 1.6.7.7 0 0 1-.7.7H4a.7.7 0 0 1-.7-.7 3 3 0 0 1 3-3 .7.7 0 0 1 .7.7Z"/><path d="M20.7 10a.7.7 0 0 1 .7.7 3 3 0 0 1-3 3 .7.7 0 0 1-.7-.7V12a.7.7 0 0 1 .7-.7 1.6 1.6 0 0 0 1.6-1.6.7.7 0 0 1 .7-.7Z"/><path d="M12.7 4a.7.7 0 0 1 .7.7 1.6 1.6 0 0 0 1.6 1.6.7.7 0 0 1 .7.7v1.4a.7.7 0 0 1-.7.7 3 3 0 0 1-3-3 .7.7 0 0 1 .7-.7Z"/><path d="m12 12-1.4 1.4a3 3 0 0 1-4.2 0 3 3 0 0 1 0-4.2L12 12Z"/></svg>
    <span>DUA-Conecta</span>
  </div>
  <nav class="navigation">
    <a href="#soluciones">Soluciones</a>
    <a href="#como-funciona">Cómo Funciona</a>
    <a href="#testimonios">Testimonios</a>
  </nav>
  <div class="auth-buttons">
    <button class="btn-secondary">Iniciar Sesión</button>
    <button class="btn-primary">Registrarse Gratis</button>
  </div>
</header>

<main>
  <!-- ==================== -->
  <!--    HERO SECTION      -->
  <!-- ==================== -->
  <section class="hero">
    <div class="hero-content">
      <h1>De Horas de Esfuerzo a Minutos de Magia</h1>
      <p>La herramienta definitiva para docentes que necesitan crear material didáctico personalizado y motivador para estudiantes con Necesidades Educativas Especiales (NEE), sin ser expertos en diseño.</p>
      <div class="hero-buttons">
        <button class="btn-primary large">Empieza a Crear →</button>
      </div>
    </div>
    <div class="hero-visualizer">
      <div class="visual-card template">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m0 2v14h14V5H5m2 2h10v2H7V7m0 4h10v2H7v-2m0 4h7v2H7v-2Z"/></svg>
        <span>Plantilla Base</span>
      </div>
      <div class="visual-arrow">+</div>
      <div class="visual-card character">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m0 7c2.35 0 4.25.8 5.5 1.9c-1.25 1.1-3.15 1.9-5.5 1.9s-4.25-.8-5.5-1.9C7.75 9.8 9.65 9 12 9m0 7c3.8 0 6.8-1.5 8.3-3.1c-.5-1.1-1.6-2.2-3-3C16.2 11.2 14.2 12 12 12s-4.2-.8-5.3-2.1c-1.4.8-2.5 1.9-3 3C5.2 17.5 8.2 19 12 19Z"/></svg>
        <span>Personaje Favorito</span>
      </div>
      <div class="visual-arrow">=</div>
      <div class="visual-card result">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M21.1 12.5l-2.2 2.2l-1.3-1.3l2.2-2.2l1.3 1.3M19.8 22l-1.3-1.3l-2.2 2.2l1.3 1.3l2.2-2.2m-1.3-3.5l-8.6 8.6l-1.3-1.3l8.6-8.6l1.3 1.3M7.6 5.5l-1.3-1.3L4.2 6.4l1.3 1.3l2.1-2.2m-1.3 5l-2.2 2.2l1.3 1.3l2.2-2.2l-1.3-1.3M17 3l-1.3-1.3l-2.2 2.2l1.3 1.3L17 3m-6.3 3.3l-1.3-1.3l-2.2 2.2l1.3 1.3l2.2-2.2M13.4 8l-1.3-1.3l-2.2 2.2l1.3 1.3l2.2-2.2Z"/></svg>
        <span>Actividad Mágica</span>
      </div>
    </div>
  </section>

  <!-- ======================== -->
  <!--      EL DESAFÍO          -->
  <!-- ======================== -->
  <section id="soluciones" class="section">
    <div class="section-header">
      <span class="tag">Para el Héroe del Salón de Clases</span>
      <h2 class="section-title">Sabemos que tu Tiempo es Oro y tu Misión es Gigante</h2>
      <p class="section-subtitle">DUA-Conecta nace de entender los desafíos reales que enfrentas cada día en Venezuela y más allá.</p>
    </div>
    <div class="solutions-grid">
      <div class="card">
        <h3>El Reto: La Falta de Tiempo</h3>
        <p>Crear material adaptado consume horas que no tienes. Buscar imágenes, editar documentos... una carga de trabajo invisible pero agotadora.</p>
        <div class="solution"><strong>Nuestra Solución:</strong> Automatización Inteligente. Reduce horas de trabajo a simples clics con plantillas pedagógicas listas para usar.</div>
      </div>
      <div class="card">
        <h3>El Reto: Conectar para Enseñar</h3>
        <p>Capturar la atención de un estudiante con NEE es el primer paso, y el más difícil. Los recursos genéricos no generan esa chispa.</p>
        <div class="solution"><strong>Nuestra Solución:</strong> El Poder del Interés. Usamos su personaje favorito como un puente directo al aprendizaje, haciendo cada actividad relevante y emocionante.</div>
      </div>
      <div class="card">
        <h3>El Reto: La Carencia de Recursos</h3>
        <p>La falta de formación especializada y de materiales adecuados te obliga a improvisar constantemente, generando estrés e incertidumbre.</p>
        <div class="solution"><strong>Nuestra Solución:</strong> Empoderamiento Docente. Te damos una herramienta profesional para crear material de alta calidad, permitiéndote aplicar tu pedagogía sin ser un experto en diseño.</div>
      </div>
    </div>
  </section>

  <!-- ======================== -->
  <!--     CÓMO FUNCIONA        -->
  <!-- ======================== -->
  <section id="como-funciona" class="section alt-bg">
    <div class="section-header">
      <h2 class="section-title">Crear es tan Fácil como Contar hasta 3</h2>
    </div>
    <div class="steps-container">
      <div class="step">
        <div class="step-number">1</div>
        <h3>Elige una Plantilla</h3>
        <p>Navega por nuestra biblioteca de actividades diseñadas por expertos.</p>
      </div>
      <div class="step">
        <div class="step-number">2</div>
        <h3>Añade la Magia</h3>
        <p>Ingresa el nombre del estudiante y su personaje. ¡El sistema hace el resto!</p>
      </div>
      <div class="step">
        <div class="step-number">3</div>
        <h3>Genera e Inspira</h3>
        <p>Descarga un PDF listo para imprimir o compartir, y observa cómo aumenta la motivación.</p>
      </div>
    </div>
  </section>
  
  <!-- Aquí irían las secciones de Testimonios y CTA Final -->
</main>

<style>
:root {
  /* --- PALETA DE COLORES PASTEL --- */
  --primary-color: #8A63D2;   /* Morado pastel principal */
  --primary-hover: #7B56BB;   /* Morado un poco más oscuro para hover */
  --accent-color:  #50C8B3;   /* Verde menta pastel para acentos */
  --text-dark:     #343A40;   /* Gris oscuro para texto principal (no negro puro) */
  --text-light:    #6C757D;   /* Gris medio para subtítulos y texto secundario */
  --bg-light:      #F7F7FA;   /* Gris muy claro para fondos alternos */
  --bg-white:      #FFFFFF;   /* Blanco puro */
  --border-color:  #EAEBEE;   /* Gris claro para bordes y separadores */
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* --- HEADER --- */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
}
.logo { display: flex; align-items: center; font-weight: bold; font-size: 1.5rem; color: var(--text-dark); }
.logo svg { margin-right: 0.5rem; color: var(--primary-color); }
.navigation a { color: var(--text-light); font-weight: 500; text-decoration: none; margin: 0 1rem; transition: color 0.2s ease; }
.navigation a:hover { color: var(--primary-color); }
.auth-buttons button { margin-left: 1rem; }

/* --- BOTONES --- */
.btn-primary { background-color: var(--primary-color); color: var(--bg-white); border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: bold; cursor: pointer; transition: background-color 0.2s ease; }
.btn-primary:hover { background-color: var(--primary-hover); }
.btn-primary.large { padding: 1rem 2.5rem; font-size: 1.1rem; }
.btn-secondary { background-color: var(--bg-white); color: var(--text-dark); border: 1px solid var(--border-color); padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.2s ease; }
.btn-secondary:hover { background-color: var(--bg-light); border-color: #d1d3d6; }

/* --- HERO SECTION --- */
.hero { text-align: center; padding: 6rem 0; }
.hero-content h1 { font-size: 3.5rem; color: var(--text-dark); margin: 1rem 0; }
.hero-content p { font-size: 1.25rem; color: var(--text-light); max-width: 700px; margin: 0 auto 2.5rem auto; line-height: 1.6; }
.hero-visualizer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 4rem;
  padding: 2rem;
  background-color: var(--bg-light);
  border-radius: 12px;
}
.visual-card {
  background: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  font-weight: 500;
  color: var(--text-light);
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}
.visual-card svg { color: var(--primary-color); margin-bottom: 0.5rem; }
.visual-arrow { font-size: 1.5rem; color: var(--text-light); }

/* --- SECCIONES --- */
.section { padding: 6rem 0; }
.section-header { text-align: center; max-width: 800px; margin: 0 auto 4rem auto; }
.section .tag {
  display: inline-block;
  color: var(--primary-color); /* CAMBIADO: Usamos el color principal */
  background-color: rgba(138, 99, 210, 0.1); /* CAMBIADO: Un fondo morado muy suave */
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  margin-bottom: 1rem;
}
.section-title { font-size: 2.5rem; color: var(--text-dark); margin: 0.5rem 0; }
.section-subtitle { font-size: 1.1rem; color: var(--text-light); line-height: 1.6; }
.alt-bg { background-color: var(--bg-light); }

/* --- SOLUTIONS GRID --- */
.solutions-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
.card { background-color: var(--bg-white); border: 1px solid var(--border-color); border-radius: 12px; padding: 2rem; transition: transform 0.2s ease, box-shadow 0.2s ease; }
.card:hover { transform: translateY(-5px); box-shadow: 0 8px 16px rgba(0,0,0,0.07); }
.card h3 { color: var(--text-dark); margin-top: 0; }
.card p { color: var(--text-light); line-height: 1.6; }
.solution { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); color: var(--text-dark); }

/* --- CÓMO FUNCIONA --- */
.steps-container { display: flex; justify-content: space-around; text-align: center; }
.step-number { width: 50px; height: 50px; background-color: var(--primary-color); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; margin: 0 auto 1.5rem auto; }
.step h3 { font-size: 1.5rem; color: var(--text-dark); }
.step p { color: var(--text-light); }

/* --- RESPONSIVE --- */
@media (max-width: 992px) {
  .solutions-grid { grid-template-columns: 1fr; }
  .hero-visualizer { flex-direction: column; gap: 1.5rem; }
  .navigation { display: none; }
}
</style>

