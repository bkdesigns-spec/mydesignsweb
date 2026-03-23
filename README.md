# Canvascape — Canva Design Showcase

A bold, colorful, dynamic, and responsive website for showcasing your Canva designs on GitHub Pages.

## Quick start

1. Clone the repo.
2. Open `index.html` directly, or serve it locally with any static server.
3. Edit `script.js` and update the `designs` array.

## Add Canva embed links

In `script.js`, each item has an `embedUrl` field:

```js
{
  title: 'My Design',
  category: 'Social',
  accent: '#08d9d6',
  embedUrl: 'https://www.canva.com/design/.../view?embed'
}
```

If `embedUrl` is empty, a placeholder card appears automatically.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Set source to the main branch (root).
4. Save and wait for deployment.
