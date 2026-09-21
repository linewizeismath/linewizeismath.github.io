# KRYPTON

A static gaming website: animated wave background, blackletter title, glass search bar, a game grid powered by a JSON API in this repo, and an in-page player with reload, fullscreen and exit buttons.

No build step and no dependencies. It's plain HTML, CSS and JavaScript.

## Folder structure

```
krypton/
├── index.html
├── README.md
├── css/
│   └── style.css
├── js/
│   ├── waves.js          animated background
│   └── app.js            games list, search, player
├── api/
│   └── games.json        <- the games "API"
├── assets/
│   ├── favicon.svg
│   └── placeholder.svg   default game image
└── html/
    └── g/
        └── test.html     sample game (Snake)
```

## Adding a game

1. Put the game's HTML file in `html/g/` (for example `html/g/mygame.html`).
2. Open `api/games.json` and add an entry:

```json
{
  "games": [
    {
      "name": "test",
      "image": "assets/placeholder.svg",
      "path": "html/g/test.html"
    },
    {
      "name": "My Game",
      "image": "https://example.com/my-game.png",
      "path": "html/g/mygame.html"
    }
  ]
}
```

| Field   | What it is                                                                 |
|---------|----------------------------------------------------------------------------|
| `name`  | The game name. Shown on hover and used by the search bar.                  |
| `image` | The cover image. A full URL, or a path in your repo (e.g. `assets/x.png`). |
| `path`  | Where the game lives in your repo (e.g. `html/g/mygame.html`).             |

Notes:
- Keep a comma between entries, and no comma after the last one.
- If an image fails to load, the placeholder is used instead.
- Cards appear in the order they are listed.
- `path` can also be a full URL, as long as that site allows being embedded in an iframe.

## Running it

The site loads `api/games.json` with `fetch`, so it has to be served over HTTP. Opening `index.html` by double-clicking it won't load the games.

**Locally**

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

**On GitHub Pages**

1. Push everything to your repo.
2. Go to **Settings > Pages**.
3. Choose your branch and the `/ (root)` folder, then save.
4. Your site will be live at `https://<username>.github.io/<repo>/`.

## Changing the font

The title, search bar and all text use **Pirata One** (a blackletter font from Google Fonts). To use a different one:

1. In `index.html`, change the Google Fonts `<link>` to the font you want.
2. In `css/style.css`, change the `--font` value at the top.

Other blackletter options on Google Fonts: UnifrakturCook, UnifrakturMaguntia, Grenze Gotisch, Jacquard 24.

## Tweaking the waves

At the top of `js/waves.js`:

- `LINES`: how many wave lines are drawn
- `SPEED`: how fast they flow
- `STEP`: smoothness vs. performance (lower is smoother)

## Shortcuts

- `/` focuses the search bar
- `Esc` clears the search, or closes the player
