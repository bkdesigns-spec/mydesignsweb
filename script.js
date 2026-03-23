const fallbackDesigns = [
  {
    title: 'Brand Story Slide Deck',
    category: 'Presentation',
    accent: '#ff2e63',
    embedUrl: ''
  },
  {
    title: 'Instagram Launch Kit',
    category: 'Social',
    accent: '#08d9d6',
    embedUrl: ''
  },
  {
    title: 'Product Promo Poster',
    category: 'Print',
    accent: '#f9ed69',
    embedUrl: ''
  },
  {
    title: 'Event Invitation Series',
    category: 'Marketing',
    accent: '#7c4dff',
    embedUrl: ''
  }
];

let designs = [...fallbackDesigns];

const colorThemes = [
  ['#0e0b1f', '#17112f', '#ff2e63', '#08d9d6', '#f9ed69', '#7c4dff'],
  ['#111827', '#1f2937', '#f43f5e', '#22d3ee', '#f59e0b', '#6366f1'],
  ['#1a0f13', '#28131a', '#ff4f79', '#45f0df', '#ffe066', '#8e7dff']
];

let activeCategory = 'All';
let reducedMotion = false;

const grid = document.getElementById('designGrid');
const filters = document.querySelector('.filters');
const year = document.getElementById('year');
const shuffleBtn = document.getElementById('shuffleBtn');
const toggleMotion = document.getElementById('toggleMotion');

function getCategories() {
  return ['All', ...new Set(designs.map((item) => normalizeCategory(item?.category)))];
}

function createCard(item) {
  const article = document.createElement('article');
  article.className = 'design-card';
  article.style.borderColor = `${item.accent || '#7c4dff'}66`;
  const embedUrl = normalizeCanvaEmbedUrl(item.embedUrl);
  const category = normalizeCategory(item.category);

  const visual = embedUrl
    ? `<iframe class="design-embed" loading="lazy" src="${embedUrl}" title="${item.title}" referrerpolicy="strict-origin-when-cross-origin"></iframe>`
    : `<div class="design-placeholder"><strong>${item.title}</strong><p>Use a Canva public <code>/view?embed</code> link for this card.</p></div>`;

  article.innerHTML = `
    ${visual}
    <div class="design-meta">
      <h3>${item.title}</h3>
      <span class="tag" style="background:${item.accent || '#7c4dff'}33; border:1px solid ${item.accent || '#7c4dff'}88">${category}</span>
    </div>
  `;

  return article;
}

function normalizeCanvaEmbedUrl(url) {
  if (!url) {
    return '';
  }

  try {
    const parsed = new URL(url);
    const isCanva = parsed.hostname.includes('canva.com');
    const hasDesignPath = parsed.pathname.includes('/design/');
    if (!isCanva || !hasDesignPath) {
      return '';
    }

    if (!parsed.pathname.endsWith('/view')) {
      parsed.pathname = parsed.pathname.replace(/\/$/, '') + '/view';
    }
    parsed.searchParams.set('embed', '');
    return parsed.toString();
  } catch {
    return '';
  }
}

function normalizeCategory(category) {
  const value = String(category || '').trim();
  return value || 'Uncategorized';
}

function renderFilters() {
  filters.innerHTML = '';

  getCategories().forEach((category) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `filter-btn ${activeCategory === category ? 'active' : ''}`;
    btn.textContent = category;
    btn.addEventListener('click', () => {
      activeCategory = category;
      renderFilters();
      renderGrid();
    });
    filters.appendChild(btn);
  });
}

function renderGrid() {
  grid.innerHTML = '';
  const selected =
    activeCategory === 'All'
      ? designs
      : designs.filter((item) => normalizeCategory(item?.category) === activeCategory);

  selected.forEach((item) => grid.appendChild(createCard(item)));
}

async function loadDesigns() {
  try {
    const response = await fetch('designs.json', { cache: 'no-store' });
    if (!response.ok) {
      return;
    }

    const fileDesigns = await response.json();
    if (Array.isArray(fileDesigns) && fileDesigns.length > 0) {
      designs = fileDesigns;
    }
  } catch {
    // fallback designs are already loaded
  }
}

function applyTheme(palette) {
  const root = document.documentElement;
  root.style.setProperty('--bg', palette[0]);
  root.style.setProperty('--bg-alt', palette[1]);
  root.style.setProperty('--accent-a', palette[2]);
  root.style.setProperty('--accent-b', palette[3]);
  root.style.setProperty('--accent-c', palette[4]);
  root.style.setProperty('--accent-d', palette[5]);
}

function setupThemeShuffle() {
  shuffleBtn.addEventListener('click', () => {
    const random = colorThemes[Math.floor(Math.random() * colorThemes.length)];
    applyTheme(random);
  });
}

function setupDualCursor() {
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) {
    return;
  }

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  const easing = 0.18;

  window.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;

    dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
  });

  function animate() {
    if (!reducedMotion) {
      ringX += (mouseX - ringX) * easing;
      ringY += (mouseY - ringY) * easing;
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      requestAnimationFrame(animate);
    }
  }

  animate();

  toggleMotion.addEventListener('click', () => {
    reducedMotion = !reducedMotion;
    toggleMotion.textContent = reducedMotion ? 'Enable Motion' : 'Reduce Motion';
    if (!reducedMotion) {
      animate();
    }
  });
}

async function init() {
  year.textContent = new Date().getFullYear();
  await loadDesigns();
  renderFilters();
  renderGrid();
  setupThemeShuffle();
  setupDualCursor();
}

init();
