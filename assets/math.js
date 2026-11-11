/* Keep static equations independent of ES modules and interactive app startup.
 * Classic deferred scripts execute in order: KaTeX, auto-render, then this file.
 * This also works when index.html is opened directly with a file: URL.
 */
(() => {
  const options = {
    delimiters: [
      { left: '\\[', right: '\\]', display: true },
      { left: '\\(', right: '\\)', display: false },
    ],
    ignoredClasses: ['katex'],
    throwOnError: false,
    strict: 'warn',
    trust: false,
  };
  let reportedMissingRenderer = false;

  function typeset(root = document.body) {
    if (!root) return false;
    if (typeof window.renderMathInElement !== 'function') {
      document.documentElement.dataset.mathStatus = 'unavailable';
      if (!reportedMissingRenderer) {
        console.error('The local equation renderer could not load. Check the assets/vendor/katex files.');
        reportedMissingRenderer = true;
      }
      return false;
    }
    window.renderMathInElement(root, options);
    reportedMissingRenderer = false;
    document.documentElement.dataset.mathStatus = 'ready';
    return true;
  }

  window.YangMillsMath = Object.freeze({ typeset });
  const renderPage = () => typeset(document.body);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderPage, { once: true });
  } else {
    renderPage();
  }
  // Recover if dependencies finish late in an embedded preview.
  document.querySelectorAll('script[data-math-dependency]').forEach(script => {
    script.addEventListener('load', renderPage, { once: true });
  });
  // Recheck pages restored from the browser's back/forward cache.
  window.addEventListener('pageshow', renderPage);
})();
