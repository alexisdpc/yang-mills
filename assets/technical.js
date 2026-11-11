/* Navigation only: all technical content and equations load independently. */
(() => {
  const toggle = document.querySelector('#menu-toggle');
  const nav = document.querySelector('#main-nav');
  const closeMenu = () => {
    toggle?.setAttribute('aria-expanded', 'false');
    nav?.classList.remove('is-open');
  };
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    nav?.classList.toggle('is-open', open);
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 601px)').addEventListener('change', closeMenu);

  const contents = document.querySelector('.technical-toc details');
  const compact = window.matchMedia('(max-width: 850px)');
  if (contents && compact.matches) contents.open = false;
  compact.addEventListener('change', event => {
    if (contents) contents.open = !event.matches;
  });
  const links = [...document.querySelectorAll('.technical-toc a[href^="#"]')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href')));
  links.forEach(link => link.addEventListener('click', () => {
    if (compact.matches && contents) contents.open = false;
  }));
  const progress = document.querySelector('#reading-progress');
  let scheduled = false;
  const update = () => {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${available > 0 ? Math.min(100, Math.max(0, window.scrollY / available * 100)) : 0}%`;
    let current = 0;
    sections.forEach((section, index) => {
      if (section && section.getBoundingClientRect().top <= 150) current = index;
    });
    links.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    scheduled = false;
  };
  const schedule = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule, { once: true });
  update();
})();
