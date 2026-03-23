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
  }
];

const colorThemes = [
  ['#0e0b1f', '#17112f', '#ff2e63', '#08d9d6', '#f9ed69', '#7c4dff'],
  ['#111827', '#1f2937', '#f43f5e', '#22d3ee', '#f59e0b', '#6366f1'],
  ['#1a0f13', '#28131a', '#ff4f79', '#45f0df', '#ffe066', '#8e7dff']
];

let designs = [];
let activeCategory = 'All';
let reducedMotion = false;

const grid = document.getElementById('designGrid');
const filters = document.querySelector('.filters');
const year = document.getElementById('year');
const shuffleBtn = document.getElementById('shuffleBtn');
const toggleMotion = document.getElementById('toggleMotion');

async function loadDesigns() {
  try {
    const response = await fetch('designs.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load data (${response.status})`);
    }

    const json = await response.json();
    if (!Array.isArray(json)) {
      throw new Error('designs.json must be an array');
    }

    designs = json;
  } catch (error) {
    designs = fallbackDesigns;
    console.warn('Using fallback design data.', error);
  }
}

function getCategories() {
  return ['All', ...new Set(designs.map((item) => item.category))];
}

function createCard(item) {
  const article = document.createElement('article');
  article.className = 'design-card';
  article.style.borderColor = `${item.accent}66`;

  const visual = item.embedUrl
    ? `<iframe class="design-embed" loading="lazy" src="${item.embedUrl}" title="${item.title}"></iframe>`
    : `<div class="design-placeholder"><strong>${item.title}</strong><p>Add Canva embed URL in add page for this card.</p></div>`;

  article.innerHTML = `
    ${visual}
    <div class="design-meta">
      <h3>${item.title}</h3>
      <span class="tag" style="background:${item.accent}33; border:1px solid ${item.accent}88">${item.category}</span>
    </div>
  `;

  return article;
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
    activeCategory === 'All' ? designs : designs.filter((item) => item.category === activeCategory);

  selected.forEach((item) => grid.appendChild(createCard(item)));
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
