const form = document.getElementById('designForm');
const statusNode = document.getElementById('status');
const manualFallback = document.getElementById('manualFallback');
const manualJson = document.getElementById('manualJson');
const copyJson = document.getElementById('copyJson');
const openEditor = document.getElementById('openEditor');
const repoBlock = document.getElementById('repoBlock');

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

function buildDesign(data) {
  return {
    title: String(data.get('title') || '').trim(),
    category: String(data.get('category') || '').trim(),
    accent: String(data.get('accent') || '').trim(),
    embedUrl: String(data.get('embedUrl') || '').trim()
  };
}

function showManualFallback(design, owner, repo, branch) {
  manualJson.value = `${JSON.stringify(design, null, 2)},`;
  if (owner && repo && branch) {
    openEditor.href = `https://github.com/${owner}/${repo}/edit/${branch}/designs.json`;
  }
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

function setMode(mode) {
  const isApi = mode === 'api';
  repoBlock.classList.toggle('dimmed', !isApi);
  for (const input of repoBlock.querySelectorAll('input')) {
    input.required = isApi;
  }
}

function failedFetchHint() {
  return 'GitHub API request blocked. Switched to manual mode block below; copy JSON object and paste into designs.json.';
}

copyJson.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(manualJson.value);
    setStatus('JSON object copied. Paste it into designs.json and commit.', false);
  } catch {
    setStatus('Copy failed. Select text manually and copy.', true);
  }
});

for (const radio of form.querySelectorAll('input[name="mode"]')) {
  radio.addEventListener('change', () => setMode(radio.value));
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(form);

  const mode = String(data.get('mode') || 'api');
  const owner = String(data.get('owner') || '').trim();
  const repo = String(data.get('repo') || '').trim();
  const branch = String(data.get('branch') || '').trim();
  const token = String(data.get('token') || '').trim();
  const design = buildDesign(data);

  manualFallback.classList.add('hidden');

  if (!validateCanvaEmbed(design.embedUrl)) {
    setStatus('Please enter a valid Canva embed/view URL.', true);
    return;
  }

  if (mode === 'manual') {
    showManualFallback(design, owner, repo, branch || 'main');
    setStatus('Manual block generated. Paste it into designs.json and commit.', false);
    return;
  }

  if (!owner || !repo || !branch || !token) {
    setStatus('API mode needs owner, repo, branch, and token.', true);
    return;
  }

  try {
    setStatus('Valid input. Connecting to GitHub...');
    const file = await getDesignFile(owner, repo, branch);
    const currentData = decodeContent(file.content);

    if (!Array.isArray(currentData)) {
      throw new Error('designs.json is not an array.');
    }

    const nextData = [...currentData, design];
    await commitDesigns(owner, repo, branch, token, file.sha, nextData);

    setStatus('Success! New design appended to designs.json and committed to your repo.');
    form.reset();
    setMode('api');
  } catch (error) {
    showManualFallback(design, owner, repo, branch || 'main');
    const isFailedFetch = error instanceof TypeError && error.message === 'Failed to fetch';
    setStatus(isFailedFetch ? failedFetchHint() : `${error.message} Use manual block below.`, true);
  }
});

setMode('api');
