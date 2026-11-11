/**
 * Explanatory illustrations, not simulations or numerical Yang–Mills results.
 * Both interactive panels work independently and tolerate missing markup.
 */
const NS = 'http://www.w3.org/2000/svg';
const palette = {
  ink: '#06383a',
  teal: '#167f78',
  mint: '#8bd5c9',
  pale: '#dceee8',
  muted: '#61827d',
  gold: '#c89555',
};

function svgNode(tag, attributes = {}, text) {
  const node = document.createElementNS(NS, tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
}

function line(parent, x1, y1, x2, y2, attributes = {}) {
  const node = svgNode('line', { x1, y1, x2, y2, ...attributes });
  parent.append(node);
  return node;
}

function label(parent, x, y, text, attributes = {}) {
  const node = svgNode('text', {
    x, y, fill: palette.muted,
    'font-family': 'DM Sans, system-ui, sans-serif',
    'font-size': 13,
    ...attributes,
  }, text);
  parent.append(node);
  return node;
}

function rangeProgress(input) {
  if (!input) return;
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  input.style.setProperty('--range-progress', `${100 * (Number(input.value) - min) / (max - min || 1)}%`);
}

function initHero() {
  const canvas = document.querySelector('#hero-canvas');
  if (!canvas) return () => {};
  const context = canvas.getContext('2d');
  if (!context) return () => {};
  canvas.setAttribute('aria-hidden', 'true');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionToggle = document.querySelector('#motion-toggle');
  let paused = motion.matches;
  let animationTime = 0;
  let width = 0;
  let height = 0;
  let frame = 0;
  let visible = true;
  let disposed = false;

  function draw(now = 0) {
    if (!width || !height || disposed) return;
    const ctx = context;
    if (!paused) animationTime = now;
    const t = animationTime / 1000;
    ctx.clearRect(0, 0, width, height);
    const size = Math.min(width * 0.48, height * 0.50);
    const centerX = width * 0.5;
    const centerY = height * 0.48;
    const yaw = -0.64 + Math.sin(t * 0.13) * 0.025;
    const pitch = 0.40;
    const project = ([x, y, z]) => {
      const xx = x * Math.cos(yaw) + z * Math.sin(yaw);
      const zz = -x * Math.sin(yaw) + z * Math.cos(yaw);
      const yy = y * Math.cos(pitch) - zz * Math.sin(pitch);
      const depth = y * Math.sin(pitch) + zz * Math.cos(pitch);
      const perspective = 3.8 / (3.8 + depth);
      return [centerX + xx * size * perspective, centerY + yy * size * perspective, depth];
    };
    const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 1.15);
    glow.addColorStop(0, 'rgba(72,177,161,0.105)');
    glow.addColorStop(0.65, 'rgba(72,177,161,0.025)');
    glow.addColorStop(1, 'rgba(72,177,161,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    const divisions = 7;
    const segments = [];
    for (let i = 0; i <= divisions; i += 1) {
      for (let j = 0; j <= divisions; j += 1) {
        const a = -0.76 + i * 1.52 / divisions;
        const b = -0.76 + j * 1.52 / divisions;
        segments.push([project([-0.76, a, b]), project([0.76, a, b])]);
        segments.push([project([a, -0.76, b]), project([a, 0.76, b])]);
        segments.push([project([a, b, -0.76]), project([a, b, 0.76])]);
      }
    }
    segments.sort((a, b) => (b[0][2] + b[1][2]) - (a[0][2] + a[1][2]));
    for (const [a, b] of segments) {
      const opacity = Math.max(0.045, 0.19 - (a[2] + b[2]) * 0.055);
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.strokeStyle = `rgba(139,213,201,${opacity})`;
      ctx.lineWidth = 0.65;
      ctx.stroke();
    }

    // Illuminated nodes make the connection variables legible without implying field values.
    for (let i = 0; i <= divisions; i += 1) {
      for (let j = 0; j <= divisions; j += 1) {
        const p = project([-0.76 + i * 1.52 / divisions, -0.76 + j * 1.52 / divisions, -0.76]);
        ctx.beginPath();
        ctx.arc(p[0], p[1], 1.25, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(164,225,211,0.60)';
        ctx.fill();
      }
    }

    const step = 1.52 / divisions;
    const x = -0.76 + 3 * step;
    const y = -0.76 + 3 * step;
    const face = [
      project([x, y, -0.76]), project([x + step, y, -0.76]),
      project([x + step, y + step, -0.76]), project([x, y + step, -0.76]),
    ];
    ctx.beginPath();
    face.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.closePath();
    ctx.fillStyle = 'rgba(217,172,103,0.14)';
    ctx.fill();
    ctx.strokeStyle = '#d8b478';
    ctx.shadowColor = 'rgba(216,180,120,0.55)';
    ctx.shadowBlur = 15;
    ctx.lineWidth = 1.7;
    ctx.stroke();
    ctx.shadowBlur = 0;
    for (const p of face) {
      ctx.beginPath();
      ctx.arc(p[0], p[1], 2.4, 0, Math.PI * 2);
      ctx.fillStyle = '#e4c38f';
      ctx.fill();
    }
    {
      const position = (t * 0.33) % 4;
      const index = Math.floor(position);
      const fraction = position - index;
      const a = face[index];
      const b = face[(index + 1) % 4];
      ctx.beginPath();
      ctx.arc(a[0] + (b[0] - a[0]) * fraction, a[1] + (b[1] - a[1]) * fraction, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff0cf';
      ctx.fill();
    }
    // A fine callout identifies the illustrated plaquette holonomy.
    const anchor = face[1];
    const calloutX = Math.min(width - 48, anchor[0] + size * 0.43);
    const calloutY = anchor[1] - size * 0.25;
    ctx.beginPath();
    ctx.moveTo(anchor[0] + 4, anchor[1] - 3);
    ctx.lineTo(calloutX - 12, calloutY + 3);
    ctx.lineTo(calloutX + 16, calloutY + 3);
    ctx.strokeStyle = 'rgba(216,180,120,0.65)';
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.font = 'italic 18px Georgia, serif';
    ctx.fillStyle = '#e4c38f';
    ctx.fillText('Uₚ', calloutX - 3, calloutY - 5);
  }

  function animate(now) {
    frame = 0;
    if (disposed || !visible || document.hidden) return;
    draw(now);
    if (!paused) frame = requestAnimationFrame(animate);
  }

  function schedule() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (!disposed && visible && !document.hidden) frame = requestAnimationFrame(animate);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    schedule();
  }

  function updateMotionControl() {
    if (motionToggle) {
      motionToggle.setAttribute('aria-pressed', String(paused));
      motionToggle.textContent = paused ? 'Resume motion' : 'Pause motion';
    }
    schedule();
  }
  function toggleMotion() {
    paused = !paused;
    updateMotionControl();
  }
  function syncMotionPreference() {
    paused = motion.matches;
    updateMotionControl();
  }

  const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(canvas);
  const intersectionObserver = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  }, { threshold: 0 }) : null;
  intersectionObserver?.observe(canvas);
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', syncMotionPreference);
  motionToggle?.addEventListener('click', toggleMotion);
  updateMotionControl();
  resize();
  return () => {
    disposed = true;
    if (frame) cancelAnimationFrame(frame);
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', schedule);
    motion.removeEventListener('change', syncMotionPreference);
    motionToggle?.removeEventListener('click', toggleMotion);
  };
}

function initLattice() {
  const svg = document.querySelector('#lattice-svg');
  if (!svg) return () => {};
  const range = document.querySelector('#lattice-range');
  const output = document.querySelector('#lattice-value');
  const description = document.querySelector('#lattice-description');
  const levels = [4, 8, 12, 16];
  const project = (x, y, z) => [320 + 192 * (x - y), 205 + 72 * (x + y) - 165 * z];
  const polygon = points => points.map(p => p.join(',')).join(' ');

  function render() {
    const level = Math.min(3, Math.max(0, Math.round(Number(range?.value || 0))));
    const n = levels[level];
    svg.replaceChildren();
    svg.setAttribute('viewBox', '0 0 640 380');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-labelledby', 'lattice-diagram-title lattice-desc');
    svg.append(svgNode('title', { id: 'lattice-diagram-title' }, `A fixed-size box with ${n} lattice cells along each edge`));
    svg.append(svgNode('desc', { id: 'lattice-desc' }, `The lattice spacing is L divided by ${n}. Refining the lattice adds degrees of freedom while keeping the physical box fixed. The gold square marks an elementary plaquette. This drawing shows three spatial directions as an illustration of a four-dimensional Euclidean lattice.`));
    const defs = svgNode('defs');
    const arrow = svgNode('marker', { id: 'lattice-arrow', viewBox: '0 0 8 8', refX: 6, refY: 4, markerWidth: 4, markerHeight: 4, orient: 'auto-start-reverse' });
    arrow.append(svgNode('path', { d: 'M 1 1 L 7 4 L 1 7 z', fill: palette.gold }));
    defs.append(arrow);
    svg.append(defs);
    const faces = [
      { points: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], fill: '#eef7f2' },
      { points: [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], fill: '#e2efea' },
      { points: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], fill: '#d4e8e0' },
    ];
    for (const face of faces) {
      svg.append(svgNode('polygon', { points: polygon(face.points.map(p => project(...p))), fill: face.fill, stroke: '#94bdb1', 'stroke-width': 1.3, 'stroke-linejoin': 'round' }));
    }
    const grid = svgNode('g', { stroke: '#7ba89b', 'stroke-opacity': n > 8 ? 0.51 : 0.66, 'stroke-width': 0.7 });
    svg.append(grid);
    function segment(a, b) {
      const p = project(...a);
      const q = project(...b);
      line(grid, p[0], p[1], q[0], q[1]);
    }
    for (let i = 1; i < n; i += 1) {
      const s = i / n;
      segment([s, 0, 1], [s, 1, 1]);
      segment([0, s, 1], [1, s, 1]);
      segment([s, 1, 0], [s, 1, 1]);
      segment([0, 1, s], [1, 1, s]);
      segment([1, s, 0], [1, s, 1]);
      segment([1, 0, s], [1, 1, s]);
    }
    const x = Math.floor(n * 0.50) / n;
    const y = Math.floor(n * 0.26) / n;
    const a = 1 / n;
    const plaquette = [project(x, y, 1), project(x + a, y, 1), project(x + a, y + a, 1), project(x, y + a, 1)];
    svg.append(svgNode('polygon', { points: polygon(plaquette), fill: '#e4b66f', 'fill-opacity': 0.54, stroke: palette.gold, 'stroke-width': 2 }));
    for (let i = 0; i < 4; i += 1) {
      const p = plaquette[i];
      const q = plaquette[(i + 1) % 4];
      const start = [p[0] * 0.78 + q[0] * 0.22, p[1] * 0.78 + q[1] * 0.22];
      const end = [p[0] * 0.27 + q[0] * 0.73, p[1] * 0.27 + q[1] * 0.73];
      line(svg, start[0], start[1], end[0], end[1], { stroke: palette.gold, 'stroke-width': 1.5, 'marker-end': 'url(#lattice-arrow)' });
      svg.append(svgNode('circle', { cx: p[0], cy: p[1], r: n > 8 ? 1.9 : 2.5, fill: palette.gold }));
    }
    const anchor = plaquette[1];
    svg.append(svgNode('path', { d: `M ${anchor[0] + 5} ${anchor[1] - 4} L 486 44 L 568 44`, fill: 'none', stroke: palette.gold, 'stroke-width': 0.9 }));
    label(svg, 486, 34, 'One plaquette', { fill: '#986e36', 'font-size': 16 });
    label(svg, 486, 64, 'links carry Uℓ ∈ G', { 'font-size': 14 });
    label(svg, 40, 37, `a = L/${n}`, { fill: palette.ink, 'font-family': 'Georgia, serif', 'font-size': 23 });
    label(svg, 40, 60, 'LATTICE SPACING', { 'font-size': 12, 'letter-spacing': 1.2 });
    label(svg, 40, 333, 'L fixed', { fill: palette.ink, 'font-family': 'Georgia, serif', 'font-size': 20 });
    label(svg, 40, 355, 'PHYSICAL BOX SIZE', { 'font-size': 12, 'letter-spacing': 0.8 });
    label(svg, 603, 355, '3D illustration of a 4D lattice', { 'text-anchor': 'end', 'font-size': 13 });
    if (output) output.textContent = `a = L/${n}`;
    if (description) description.textContent = `${n} cells per edge. The physical box stays the same size as the spacing shrinks. In four dimensions, a box with this resolution has ${new Intl.NumberFormat('en').format(n ** 4)} elementary cells. A continuum construction must control the limit as a → 0.`;
    range?.setAttribute('aria-valuetext', `${n} cells per edge; lattice spacing L divided by ${n}`);
    rangeProgress(range);
  }
  range?.addEventListener('input', render);
  render();
  return () => range?.removeEventListener('input', render);
}

let disposeVisuals = () => {};

/** Initialize once after the markup exists; calling again safely replaces listeners. */
export function initVisuals() {
  disposeVisuals();
  const cleanups = [initHero(), initLattice()];
  disposeVisuals = () => cleanups.forEach(cleanup => cleanup());
  return disposeVisuals;
}
