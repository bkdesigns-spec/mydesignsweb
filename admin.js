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
  const endpoint = `https://api.github.com/repos/${owner}/${repo}/contents/designs.json?ref=${branch}`;
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json'
    }
  });

  if (!response.ok) {
    throw new Error(`Unable to read designs.json (${response.status})`);
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
    throw new Error(`Unable to commit designs.json (${response.status})`);
  }

  return response.json();
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
    const file = await getDesignFile(owner, repo, branch, token);
    const currentData = decodeContent(file.content);

    if (!Array.isArray(currentData)) {
      throw new Error('designs.json is not an array.');
    }

    const nextData = [...currentData, newDesign];
    await commitDesigns(owner, repo, branch, token, file.sha, nextData);

    setStatus('Success! New design appended to designs.json and committed to your repo.');
    form.reset();
  } catch (error) {
    setStatus(error.message || 'Something went wrong while appending design data.', true);
  }
});
