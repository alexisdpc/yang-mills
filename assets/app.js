import { initVisuals } from './visuals.js';

function initNavigation() {
  const toggle = document.querySelector('#menu-toggle');
  const nav = document.querySelector('#main-nav');
  const closeMenu = () => { toggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { closeMenu(); toggle.focus(); }
  });
  window.matchMedia('(min-width: 601px)').addEventListener('change', closeMenu);
  const progress = document.querySelector('#reading-progress');
  let scheduled = false;
  const updateProgress = () => {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${available > 0 ? Math.min(100, Math.max(0, window.scrollY / available * 100)) : 0}%`;
    scheduled = false;
  };
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();
}

function initRoute() {
  const map = document.querySelector('#proof-map');
  const tabs = [...document.querySelectorAll('[data-step]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  if (!map || !tabs.length || panels.some(panel => !panel)) return;
  function selectStep(index, focus = false) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) tabs[index].focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectStep(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectStep(next, true); }
    });
  });
  selectStep(0);
  map.dataset.enhanced = 'true';
}

async function loadReferences() {
  const container = document.querySelector('#reference-list');
  try {
    const response = await fetch(new URL('./references.json', import.meta.url));
    if (!response.ok) throw new Error(`Reference list: ${response.status}`);
    const references = await response.json();
    const fragment = document.createDocumentFragment();
    references.forEach((reference, index) => {
      const link = document.createElement('a');
      link.className = 'reference-row';
      link.href = reference.localPath;
      link.target = '_blank';
      link.rel = 'noopener';
      const number = document.createElement('span');
      number.className = 'reference-number';
      number.textContent = `[${index + 1}]`;
      const body = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = reference.title;
      const metadata = document.createElement('p');
      metadata.className = 'reference-meta';
      metadata.textContent = `${reference.authors} · ${reference.year}`;
      const description = document.createElement('p');
      description.className = 'reference-description';
      description.textContent = reference.description;
      body.append(title, metadata, description);
      const hint = document.createElement('p');
      hint.className = 'reading-hint';
      hint.textContent = reference.readingHint;
      const arrow = document.createElement('span');
      arrow.className = 'reference-arrow';
      arrow.textContent = '↗';
      arrow.setAttribute('aria-hidden', 'true');
      link.append(number, body, hint, arrow);
      fragment.append(link);
    });
    container.replaceChildren(fragment);
  } catch (error) {
    // Keep the useful static reference links if fetching is unavailable.
    console.warn('Using the static reading list.', error);
  }
}

initNavigation();
initRoute();
initVisuals();
loadReferences();
