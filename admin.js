const form = document.getElementById('designForm');
const statusNode = document.getElementById('status');

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

async function getDesignFile(owner, repo, branch, token) {
  const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
    repo
  )}/contents/designs.json?ref=${encodeURIComponent(branch)}`;
  const response = await fetchGitHub(endpoint, token, 'read designs.json');

  if (!response.ok) {
    let details = '';
    try {
      const errorData = await response.json();
      details = errorData.message ? `: ${errorData.message}` : '';
    } catch {
      // no-op: keep generic response status only
    }
    throw new Error(`Unable to read designs.json (${response.status})${details}`);
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
  const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
    repo
  )}/contents/designs.json`;
  const body = {
    message: `chore: add design - ${nextData[nextData.length - 1].title}`,
    content: encodeContent(nextData),
    sha,
    branch
  };

  const response = await fetchGitHub(endpoint, token, 'commit designs.json', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let details = '';
    try {
      const errorData = await response.json();
      details = errorData.message ? `: ${errorData.message}` : '';
    } catch {
      // no-op: keep generic response status only
    }
    throw new Error(`Unable to commit designs.json (${response.status})${details}`);
  }

  return response.json();
}

async function fetchGitHub(endpoint, token, action, options = {}) {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        ...(options.headers || {})
      }
    });
    return response;
  } catch (error) {
    throw new Error(
      `${action} failed before reaching GitHub (Failed to fetch). Check internet connection, browser extensions/VPN/proxy, and verify this page is served over http(s), not blocked by local browser security settings.`
    );
  }
}

async function appendDesignWithConflictRetry(owner, repo, branch, token, newDesign) {
  const maxAttempts = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const file = await getDesignFile(owner, repo, branch, token);
    const currentData = decodeContent(file.content);

    if (!Array.isArray(currentData)) {
      throw new Error('designs.json is not an array.');
    }

    const alreadyExists = currentData.some(
      (item) => item?.title === newDesign.title && item?.embedUrl === newDesign.embedUrl
    );
    if (alreadyExists) {
      return { duplicated: true };
    }

    const nextData = [...currentData, newDesign];

    try {
      await commitDesigns(owner, repo, branch, token, file.sha, nextData);
      return { duplicated: false };
    } catch (error) {
      lastError = error;
      const isConflict = String(error?.message || '').includes('(409)');
      if (!isConflict || attempt === maxAttempts) {
        throw error;
      }
      setStatus('Detected concurrent update. Fetching latest file and retrying...');
    }
  }

  throw lastError || new Error('Unable to append design data after retry.');
}

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

  if (!validateCanvaEmbed(embedUrl)) {
    setStatus('Please enter a valid Canva embed/view URL.', true);
    return;
  }

  const newDesign = { title, category, accent, embedUrl };

  try {
    setStatus('Valid input. Connecting to GitHub...');
    const result = await appendDesignWithConflictRetry(owner, repo, branch, token, newDesign);
    setStatus(
      result.duplicated
        ? 'This design already exists in designs.json; no commit was needed.'
        : 'Success! New design appended to designs.json and committed to your repo.'
    );
    form.reset();
  } catch (error) {
    setStatus(error.message || 'Something went wrong while appending design data.', true);
  }
});
