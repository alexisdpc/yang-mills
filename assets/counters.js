/* One request per page load: retain the provider's count, display only its total. */
(async () => {
  const badge = document.querySelector('[data-visit-counter]');
  if (!badge) return;
  const value = badge.querySelector('.visit-total-value');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(badge.dataset.counterUrl, {
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Counter unavailable');
    const data = await response.json();
    const raw = data.total_hits;
    if (typeof raw !== 'number' && !(typeof raw === 'string' && /^\d+$/.test(raw))) {
      throw new Error('Invalid counter total');
    }
    const total = Number(raw);
    if (!Number.isSafeInteger(total) || total < 0) throw new Error('Invalid counter total');
    const formatted = total.toLocaleString('en-US');
    value.textContent = formatted;
    badge.setAttribute('aria-label', `Total website visits: ${formatted}, counted by HitsCounter.dev`);
    badge.dataset.counterState = 'ready';
  } catch {
    value.textContent = '—';
    badge.setAttribute('aria-label', 'Total website visits temporarily unavailable');
    badge.title = 'The total visit count is temporarily unavailable';
    badge.dataset.counterState = 'unavailable';
  } finally {
    clearTimeout(timeout);
  }
})();
