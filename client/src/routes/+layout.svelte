<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import '../app.css';

  /** @type {{children: import('svelte').Snippet}} */
  let { children } = $props();

  const theme = writable(null);

  onMount(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      theme.set(savedTheme);
    } else {
      theme.set(systemPrefersDark ? 'dark' : 'light');
    }

    theme.subscribe(value => {
      if (typeof window !== 'undefined' && value) {
        document.documentElement.setAttribute('data-theme', value);
        localStorage.setItem('theme', value);
      }
    });
  });

  function toggleTheme() {
    theme.update(current => (current === 'light' ? 'dark' : 'light'));
  }
</script>

<div class="layout-wrapper">
  <button on:click={toggleTheme} class="theme-toggle" aria-label="Cambiar tema">
    <svg class="sun" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
    <svg class="moon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
  </button>

  {@render children()}
</div>

<style>
  .layout-wrapper {
    width: 100%;
    min-height: 100vh;
    background: var(--bg-main);
    transition: background-color 0.3s ease;
  }

  .theme-toggle {
    position: fixed;
    top: 1rem;
    right: 1.5rem;
    z-index: 1001;
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 50%;
    width: 44px;
    height: 44px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
  }
  .theme-toggle:hover {
    transform: scale(1.1) rotate(15deg);
    border-color: var(--primary-color);
  }
  .theme-toggle svg {
    width: 22px;
    height: 22px;
    color: var(--text-light);
    transition: color 0.3s ease;
  }
   .theme-toggle:hover svg {
    color: var(--primary-color);
  }
</style>