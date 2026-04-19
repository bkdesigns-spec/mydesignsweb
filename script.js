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

let activeCategory = 'all';
let reducedMotion = false;

const grid = document.getElementById('designGrid');
const filters = document.querySelector('.filters');
const year = document.getElementById('year');
const shuffleBtn = document.getElementById('shuffleBtn');
const toggleMotion = document.getElementById('toggleMotion');

function removePublicAddDesignLinks() {
  const navLinks = document.querySelectorAll('.topnav a');
  navLinks.forEach((link) => {
    const label = String(link.textContent || '').trim().toLowerCase();
    const href = String(link.getAttribute('href') || '').trim().toLowerCase();
    if (label === 'add design' || href.includes('add-design.html')) {
      link.remove();
    }
  });
}

function getCategories() {
  const options = [{ key: 'all', label: 'All' }];
  const seen = new Set(['all']);
  const visibleDesigns = designs.filter((item) => Boolean(normalizeCanvaEmbedUrl(item?.embedUrl)));

  visibleDesigns.forEach((item) => {
    const label = normalizeCategory(item?.category);
    const key = getCategoryKey(label);
    if (!seen.has(key)) {
      seen.add(key);
      options.push({ key, label });
    }
  });

  return options;
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

  const actions = document.createElement('div');
  actions.className = 'card-actions';

  const previewBtn = document.createElement('button');
  previewBtn.type = 'button';
  previewBtn.className = 'ghost-btn preview-btn';
  previewBtn.textContent = 'Preview';
  previewBtn.addEventListener('click', () => openPreviewModal(embedUrl, item.title));
  actions.appendChild(previewBtn);

  article.appendChild(actions);

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
  const value = String(category || '').trim().toLowerCase();
  if (!value) {
    return 'Uncategorized';
  }
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getCategoryKey(categoryLabel) {
  return String(categoryLabel || 'uncategorized').trim().toLowerCase();
}

function renderFilters() {
  filters.innerHTML = '';

  getCategories().forEach((category) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `filter-btn ${activeCategory === category.key ? 'active' : ''}`;
    btn.textContent = category.label;
    btn.addEventListener('click', () => {
      activeCategory = category.key;
      renderFilters();
      renderGrid();
    });
    filters.appendChild(btn);
  });
}

function renderGrid() {
  grid.innerHTML = '';
  const visibleDesigns = designs.filter((item) => Boolean(normalizeCanvaEmbedUrl(item?.embedUrl)));
  const selected =
    activeCategory === 'all'
      ? visibleDesigns
      : visibleDesigns.filter(
          (item) => getCategoryKey(normalizeCategory(item?.category)) === activeCategory
        );

  if (selected.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML =
      '<strong>No templates found.</strong><p>Try a different filter or add a valid public Canva embed URL.</p>';
    grid.appendChild(empty);
    return;
  }

  selected.forEach((item) => grid.appendChild(createCard(item)));
}

function openPreviewModal(embedUrl, title) {
  if (!embedUrl) {
    return;
  }

  const modal = document.getElementById('previewModal');
  const frame = document.getElementById('previewFrame');
  const heading = document.getElementById('previewTitle');
  const openLink = document.getElementById('previewOpenLink');
  if (!modal || !frame || !heading || !openLink) {
    return;
  }

  heading.textContent = title || 'Canva Preview';
  frame.src = embedUrl;
  openLink.href = embedUrl;
  modal.classList.add('open');
}

function closePreviewModal() {
  const modal = document.getElementById('previewModal');
  const frame = document.getElementById('previewFrame');
  if (!modal || !frame) {
    return;
  }
  frame.src = '';
  modal.classList.remove('open');
}

function setupPreviewModal() {
  const modal = document.createElement('div');
  modal.id = 'previewModal';
  modal.className = 'preview-modal';
  modal.innerHTML = `
    <div class="preview-modal-inner" role="dialog" aria-modal="true" aria-label="Template preview">
      <div class="preview-modal-head">
        <h3 id="previewTitle">Canva Preview</h3>
        <button type="button" class="ghost-btn preview-close" id="previewCloseBtn">Close</button>
      </div>
      <iframe id="previewFrame" class="design-embed" loading="lazy" title="Design preview"></iframe>
      <a id="previewOpenLink" class="cta preview-open-link" target="_blank" rel="noopener noreferrer">Open in Canva</a>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closePreviewModal();
    }
  });
  document.getElementById('previewCloseBtn')?.addEventListener('click', closePreviewModal);
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
  if (!shuffleBtn) {
    return;
  }

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

  if (toggleMotion) {
    toggleMotion.addEventListener('click', () => {
      reducedMotion = !reducedMotion;
      toggleMotion.textContent = reducedMotion ? 'Enable Effects' : 'Disable Effects';
      if (!reducedMotion) {
        animate();
      }
    });
  }
}

async function init() {
  removePublicAddDesignLinks();
  year.textContent = new Date().getFullYear();
  await loadDesigns();
  renderFilters();
  renderGrid();
  setupPreviewModal();
  setupThemeShuffle();
  setupDualCursor();
}

init();
