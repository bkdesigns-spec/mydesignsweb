const form = document.getElementById('designForm');
const statusNode = document.getElementById('status');
const manualFallback = document.getElementById('manualFallback');
const manualJson = document.getElementById('manualJson');
const copyJson = document.getElementById('copyJson');
const openEditor = document.getElementById('openEditor');

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.classList.toggle('error', isError);
}

function validateCanvaEmbed(url) {
  try {
    const parsed = new URL(url);
    const isCanva = parsed.hostname.includes('canva.com');
    const hasEmbedHint = url.includes('embed') || url.includes('/view');
    return isCanva && hasEmbedHint;
  } catch {
    return false;
  }
}

function showManualFallback(jsonData, owner, repo, branch) {
  manualJson.value = JSON.stringify(jsonData, null, 2);
  openEditor.href = `https://github.com/${owner}/${repo}/edit/${branch}/designs.json`;
  manualFallback.classList.remove('hidden');
}

async function getDesignFile(owner, repo, branch) {
  const endpoint = `https://api.github.com/repos/${owner}/${repo}/contents/designs.json?ref=${branch}`;
  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/vnd.github+json'
    }
  });

  if (!response.ok) {
    throw new Error(`Unable to read designs.json (${response.status}). Check owner/repo/branch.`);
  }

  return response.json();
}

async function getLocalDesignFile() {
  const response = await fetch('designs.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Local designs.json is unavailable.');
  }

  const json = await response.json();
  if (!Array.isArray(json)) {
    throw new Error('Local designs.json must be an array.');
  }

  return json;
}

function decodeContent(base64Content) {
  const text = atob(base64Content.replace(/\n/g, ''));
  return JSON.parse(text);
}

function encodeContent(json) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(json, null, 2) + '\n')));
}

async function commitDesigns(owner, repo, branch, token, sha, nextData) {
  const endpoint = `https://api.github.com/repos/${owner}/${repo}/contents/designs.json`;
  const body = {
    message: `chore: add design - ${nextData[nextData.length - 1].title}`,
    content: encodeContent(nextData),
    sha,
    branch
  };

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Unable to commit designs.json (${response.status}). Check PAT permission contents:write.`);
  }

  return response.json();
}

function failedFetchHint() {
  return 'GitHub API request blocked. Use manual fallback below or disable strict privacy blocking for this page.';
}

copyJson.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(manualJson.value);
    setStatus('JSON copied. Open editor and paste, then commit changes in GitHub.', false);
  } catch {
    setStatus('Copy failed. Select text manually and copy.', true);
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(form);

  const owner = String(data.get('owner') || '').trim();
  const repo = String(data.get('repo') || '').trim();
  const branch = String(data.get('branch') || '').trim();
  const token = String(data.get('token') || '').trim();
  const title = String(data.get('title') || '').trim();
  const category = String(data.get('category') || '').trim();
  const accent = String(data.get('accent') || '').trim();
  const embedUrl = String(data.get('embedUrl') || '').trim();

  manualFallback.classList.add('hidden');

  if (!token) {
    setStatus('Token is required for writing to GitHub.', true);
    return;
  }

  if (!validateCanvaEmbed(embedUrl)) {
    setStatus('Please enter a valid Canva embed/view URL.', true);
    return;
  }

  const newDesign = { title, category, accent, embedUrl };

  try {
    setStatus('Valid input. Connecting to GitHub...');
    const file = await getDesignFile(owner, repo, branch);
    const currentData = decodeContent(file.content);

    if (!Array.isArray(currentData)) {
      throw new Error('designs.json is not an array.');
    }

    const nextData = [...currentData, newDesign];
    await commitDesigns(owner, repo, branch, token, file.sha, nextData);

    setStatus('Success! New design appended to designs.json and committed to your repo.');
    form.reset();
  } catch (error) {
    const localData = await getLocalDesignFile().catch(() => []);
    if (Array.isArray(localData) && localData.length > 0) {
      showManualFallback([...localData, newDesign], owner, repo, branch);
    }

    const isFailedFetch = error instanceof TypeError && error.message === 'Failed to fetch';
    setStatus(isFailedFetch ? failedFetchHint() : error.message || 'Something went wrong.', true);
  }
});
