# Canvascape — Canva Design Showcase

A bold, colorful, dynamic, and responsive website for showcasing your Canva designs on GitHub Pages.

## Quick start

1. Clone the repo.
2. Open `index.html` directly, or serve it locally with any static server.
3. Edit `designs.json` manually or use the built-in `add-design.html` uploader page.

## Add Canva embed links (manual)

In `designs.json`, each object looks like this:

```json
{
  "title": "My Design",
  "category": "Social",
  "accent": "#08d9d6",
  "embedUrl": "https://www.canva.com/design/.../view?embed"
}
```

If `embedUrl` is empty, a placeholder card appears automatically.

## Add Canva embed links (validated uploader page)

1. Open `add-design.html` from your deployed site.
2. Choose mode:
   - **API mode**: auto-commit directly to `designs.json` (requires owner/repo/branch/token).
   - **Manual mode**: no fetch/API required; generates a ready-to-paste JSON object.
3. Fill design fields (title, category, accent, Canva embed URL).
4. Submit and follow the status message.

> Security: token is only used in browser for API requests and not stored by the page.

### If you see "Failed to fetch"

- Open uploader from GitHub Pages URL, not from `file://` local path.
- Disable aggressive browser tracker/privacy blocking for the site temporarily.
- Verify your internet and that `api.github.com` is reachable.
- Confirm owner/repo/branch values are correct.
- Use the manual fallback section that appears after submit to copy JSON and update `designs.json` in GitHub UI.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Set source to the main branch (root).
4. Save and wait for deployment.
