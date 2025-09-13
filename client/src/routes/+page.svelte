<script lang="ts">
  import { onMount } from 'svelte';
  import heroImage from '$lib/images/hero-image.jpg';

  onMount(() => {
    const sections = document.querySelectorAll('.section');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    sections.forEach(section => {
      observer.observe(section);
    });
  });
</script>

<div class="page-wrapper">
  <header class="header">
    <div class="logo">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shapes"><path d="M8.3 10a.7.7 0 0 1-.7.7 1.6 1.6 0 0 0-1.6 1.6.7.7 0 0 1-.7.7H4a.7.7 0 0 1-.7-.7 3 3 0 0 1 3-3 .7.7 0 0 1 .7.7Z"/><path d="M20.7 10a.7.7 0 0 1 .7.7 3 3 0 0 1-3 3 .7.7 0 0 1-.7-.7V12a.7.7 0 0 1 .7-.7 1.6 1.6 0 0 0 1.6-1.6.7.7 0 0 1 .7-.7Z"/><path d="M12.7 4a.7.7 0 0 1 .7.7 1.6 1.6 0 0 0 1.6 1.6.7.7 0 0 1 .7.7v1.4a.7.7 0 0 1-.7.7 3 3 0 0 1-3-3 .7.7 0 0 1 .7-.7Z"/><path d="m12 12-1.4 1.4a3 3 0 0 1-4.2 0 3 3 0 0 1 0-4.2L12 12Z"/></svg>
        <span>DUA-Conecta</span>
    </div>
    <nav class="navigation">
      <a href="#beneficios">Beneficios</a>
      <a href="#como-funciona">Pasos</a>
      <a href="#testimonios">Testimonios</a>
    </nav>
    <div class="auth-buttons">
      <a href="/login" class="btn-secondary">Iniciar Sesión</a>
      <a href="/register" class="btn-primary">Registrarse Gratis</a>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">✨ Para los héroes del salón de clases</div>
        <h1>Convierte la Educación en una Aventura</h1>
        <p>Crea material didáctico que tus estudiantes con NEE amarán. Usa plantillas pedagógicas y la magia de sus personajes favoritos en minutos.</p>
        <div class="hero-buttons">
          <a href="/register" class="btn-primary large">Empieza a Crear Ahora →</a>
        </div>
        <div class="social-proof">
          <p>Usado por <strong>cientos de docentes</strong> en Venezuela</p>
        </div>
      </div>
      <div class="hero-image-container">
        <div class="blob-background"></div>
        <img 
          src={heroImage} 
          alt="Profesora y estudiante usando DUA-Conecta"
          class="hero-image"
        />
      </div>
    </section>

    <section id="beneficios" class="section">
      <div class="section-header">
        <h2 class="section-title">Diseñado para ti, pensado para ellos</h2>
        <p class="section-subtitle">Hemos convertido los mayores desafíos en tus nuevas fortalezas.</p>
      </div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon" style="background-color: var(--accent-1-light);"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-1-dark)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M12 12 2.36 2.36"/><path d="M19 19 9 9"/></svg></div>
          <h3>Creación Mágica</h3>
          <p>Transforma plantillas base en actividades 100% personalizadas con solo un par de clics.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon" style="background-color: var(--accent-2-light);"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2-dark)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></div>
          <h3>Conexión Emocional</h3>
          <p>Usa el poder de los personajes favoritos de tus estudiantes para capturar su atención.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon" style="background-color: var(--accent-3-light);"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-3-dark)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg></div>
          <h3>Calidad Profesional</h3>
          <p>Genera PDFs de alta calidad listos para imprimir. Luce como un diseñador experto sin serlo.</p>
        </div>
      </div>
    </section>

    <section id="como-funciona" class="section alt-bg">
      <div class="section-header">
        <h2 class="section-title">Tu Próxima Actividad Increíble en 3 Pasos</h2>
      </div>
      <div class="steps-container">
        <div class="step-card">
          <div class="step-number">1</div>
          <h3>Elige tu Plantilla</h3>
          <p>Explora una biblioteca de recursos pedagógicos diseñados por expertos.</p>
        </div>
        <div class="step-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </div>
        <div class="step-card">
          <div class="step-number">2</div>
          <h3>Personaliza</h3>
          <p>Indica el nombre del estudiante y su personaje. ¡La magia sucede aquí!</p>
        </div>
         <div class="step-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </div>
        <div class="step-card">
          <div class="step-number">3</div>
          <h3>Descarga y Sorprende</h3>
          <p>Obtén un PDF listo para usar y observa cómo se ilumina el rostro de tu estudiante.</p>
        </div>
      </div>
    </section>

    <section id="testimonios" class="section">
      <div class="section-header">
        <h2 class="section-title">Lo que dicen los Docentes</h2>
      </div>
      <div class="testimonial-card">
          <img src="https://placehold.co/80x80/E2E8F0/4A5568?text= profe" alt="Foto de una profesora"/>
          <blockquote>
              "DUA-Conecta ha cambiado mi forma de planificar. Lo que antes me tomaba toda la tarde del domingo, ahora lo hago en 15 minutos. Mis niños están más enganchados que nunca."
          </blockquote>
          <cite>
              <strong>Ana María Pérez</strong><br>
              <span>Docente de Primaria, Valencia</span>
          </cite>
      </div>
    </section>

    <section class="section cta-section">
        <div class="cta-content">
            <h2>Crea tus Actividades Ya Mismo</h2>
            <p>Únete a la comunidad de educadores que están transformando el aprendizaje.</p>
            <a href="/register" class="btn-primary large cta-button">Empezar Gratis →</a>
        </div>
    </section>
  </main>

  <footer class="main-footer">
      <div class="footer-grid">
        <div class="footer-column">
          <h3>DUA-Conecta</h3>
          <p>Creando experiencias de aprendizaje interactivas y significativas para cada estudiante.</p>
        </div>
        <div class="footer-column">
          <h4>Servicio</h4>
          <ul>
            <li><a href="#beneficios">Características</a></li>
            <li><a href="#como-funciona">Cómo funciona</a></li>
            <li><a href="#testimonios">Testimonios</a></li>
          </ul>
        </div>
        <div class="footer-column">
          <h4>Recursos</h4>
          <ul>
            <li><a href="#_">Manual de Usuario</a></li>
            <li><a href="#_">FAQ</a></li>
            <li><a href="#_">Contacto</a></li>
          </ul>
        </div>
        <div class="footer-column">
          <h4>Legal</h4>
          <ul>
            <li><a href="#_">Términos del Servicio</a></li>
            <li><a href="#_">Política de Privacidad</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; {new Date().getFullYear()} DUA-Conecta. Todos los derechos reservados.</p>
      </div>
  </footer>

</div>

<style>
/* ======================== */
/* ESTILOS ESPECÍFICOS DEL HOME */
/* ======================== */
.page-wrapper, main { width: 100%; }
main { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; max-width: 1100px; margin: 0 auto; position: sticky; top: 0; z-index: 1000; animation: fadeInUp 0.5s ease-out; }
.header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--header-bg); backdrop-filter: blur(10px); z-index: -1; border-bottom: 1px solid var(--border-color); transition: background-color 0.3s ease, border-color 0.3s ease; }
.logo { display: flex; align-items: center; font-weight: 600; font-size: 1.25rem; }
.logo svg { color: var(--primary-color); margin-right: 0.5rem; }
.navigation { display: none; }
.auth-buttons { display: flex; gap: 0.75rem; }
.hero { padding: 4rem 1.5rem 6rem 1.5rem; }
.hero-content { animation: fadeInUp 0.8s ease-out; margin: 0 auto 3rem auto; text-align: center; }
.hero-badge { display: inline-block; background-color: var(--bg-section); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: 20px; font-weight: 700; font-size: 0.9rem; margin-bottom: 1.5rem; }
.hero-content h1 { font-size: 2.8rem; font-weight: 800; margin: 0 0 1.5rem 0; line-height: 1.2; background: linear-gradient(45deg, var(--text-dark), var(--primary-color)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.hero-content p { font-size: 1.1rem; color: var(--text-light); max-width: 600px; margin: 0 auto 2.5rem auto; line-height: 1.7; }
.social-proof { margin-top: 2rem; color: var(--text-light); }
.social-proof strong { color: var(--text-dark); }
.hero-image-container { position: relative; display: flex; justify-content: center; align-items: center; animation: float 6s ease-in-out infinite; }
.blob-background { position: absolute; width: 100%; height: 100%; max-width: 500px; background: linear-gradient(45deg, var(--accent-1-light), var(--bg-section)); z-index: -1; animation: blob-morph 10s ease-in-out infinite; }
.hero-image { width: 100%; max-width: 450px; border-radius: 24px; padding: 8px; background: var(--bg-card); box-shadow: 0 25px 50px -12px rgba(160, 132, 232, 0.15); }
.section { padding: 6rem 0; }
.section-header { text-align: center; max-width: 700px; margin: 0 auto 4rem auto; }
.section-title { font-size: 2.5rem; font-weight: 700; color: var(--text-dark); margin: 0.5rem 0; }
.section-subtitle { font-size: 1.1rem; color: var(--text-light); line-height: 1.7; }
.alt-bg { background-color: var(--bg-section); border-radius: 30px; margin: 0 -1.5rem; padding: 6rem 1.5rem; }
.features-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; }
.feature-card { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; padding: 2.5rem 2rem; text-align: center; transition: all 0.3s ease; }
.feature-card:hover { transform: translateY(-10px); box-shadow: 0 15px 30px rgba(160, 132, 232, 0.1); border-color: var(--primary-color); }
.feature-icon { width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; transition: transform 0.3s ease; }
.feature-card:hover .feature-icon { transform: rotate(10deg) scale(1.1); }
.feature-card h3 { color: var(--text-dark); margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 600; }
.feature-card p { color: var(--text-light); line-height: 1.6; }
.steps-container { display: flex; flex-direction: column; align-items: center; gap: 2rem; }
.step-card { text-align: center; max-width: 280px; }
.step-number { width: 50px; height: 50px; background: linear-gradient(45deg, var(--primary-color), var(--primary-hover)); color: var(--text-on-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 700; margin: 0 auto 1.5rem auto; box-shadow: 0 5px 15px rgba(160, 132, 232, 0.4); }
.step-card h3 { font-size: 1.25rem; font-weight: 600; color: var(--text-dark); }
.step-card p { color: var(--text-light); }
.step-arrow { color: var(--border-color); transform: rotate(90deg); margin: 1rem 0; }
.testimonial-card { background: linear-gradient(135deg, var(--primary-color), var(--primary-hover)); border-radius: 24px; padding: 2rem; max-width: 700px; margin: 0 auto; text-align: center; color: var(--text-on-primary); box-shadow: 0 20px 40px rgba(160, 132, 232, 0.3); }
.testimonial-card img { width: 80px; height: 80px; border-radius: 50%; margin-bottom: 1.5rem; border: 4px solid var(--bg-card); }
.testimonial-card blockquote { font-size: 1.1rem; font-weight: 500; line-height: 1.6; margin: 0 0 1.5rem 0; border: none; }
.testimonial-card cite { font-style: normal; opacity: 0.8; }
.testimonial-card cite strong { display: block; opacity: 1; font-weight: 600; }
.cta-section { background: var(--bg-section); color: var(--text-dark); padding: 6rem 1.5rem; text-align: center; }
.cta-content h2 { font-size: 2.5rem; font-weight: 800; margin: 0 0 1rem 0; }
.cta-content p { font-size: 1.1rem; opacity: 0.9; max-width: 500px; margin: 0 auto 2rem auto; color: var(--text-light); }
.main-footer { background-color: var(--text-dark); color: var(--text-light); padding: 4rem 1.5rem 2rem 1.5rem; }
.footer-grid { display: grid; grid-template-columns: 1fr; gap: 2.5rem; max-width: 1100px; margin: 0 auto; }
.footer-column h3, .footer-column h4 { color: var(--bg-card); margin-bottom: 1rem; }
.footer-column p { margin: 0; }
.footer-column ul { list-style: none; padding: 0; margin: 0; }
.footer-column ul li { margin-bottom: 0.75rem; }
.footer-column ul a { color: var(--text-light); text-decoration: none; transition: color 0.3s ease; }
.footer-column ul a:hover { color: var(--primary-color); }
.footer-bottom { border-top: 1px solid var(--border-color); margin-top: 3rem; padding-top: 2rem; text-align: center; color: var(--text-light); font-size: 0.9rem; }
@media (min-width: 576px) { .footer-grid { grid-template-columns: 2fr 1fr; } }
@media (min-width: 768px) {
    .navigation { display: flex; gap: 1.5rem; }
    .navigation a { color: var(--text-light); text-decoration: none; font-weight: 600; transition: color 0.3s ease; }
    .navigation a:hover { color: var(--primary-color); }
    .features-grid { grid-template-columns: repeat(3, 1fr); }
    .steps-container { flex-direction: row; align-items: flex-start; justify-content: center; }
    .step-arrow { transform: translateY(3rem) rotate(0); }
    .hero-content h1 { font-size: 3.5rem; }
    .testimonial-card { padding: 3rem; }
    .testimonial-card blockquote { font-size: 1.25rem; }
    .footer-grid { grid-template-columns: 2fr 1fr 1fr 1fr; }
}
@media (min-width: 992px) {
    .hero { display: flex; flex-direction: row; align-items: center; text-align: left; gap: 4rem; }
    .hero-content { flex: 1 1 55%; margin: 0; }
    .hero-image-container { flex: 1 1 45%; }
}
@media (max-width: 767px) {
  .header { flex-direction: column; gap: 1rem; }
  .auth-buttons { margin-top: 1rem; }
  .features-grid, .steps-container { grid-template-columns: 1fr; flex-direction: column; }
  .step-arrow { transform: rotate(90deg); margin: 1rem 0; }
  .footer-grid { grid-template-columns: 1fr; }
}
</style>