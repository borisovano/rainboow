# Moon & Rainbow Math Adventure

A Hebrew 3D learning adventure with Earth, Moon, Rainbow, and Maze worlds. All game code, assets, drills, and tests are in this repository. The game uses Three.js and Tone.js; contributed drills can use plain HTML, CSS, and JavaScript.

## Run locally

Requires Node.js 18 or newer. No package installation is required:

```sh
npm start
npm test
npm run build
```

Open [the game](http://127.0.0.1:8765/), [the standalone drill runner](http://127.0.0.1:8765/drills/), or [the maze](http://127.0.0.1:8765/?stage=maze). Set `PORT=8874 npm start` if the port is occupied. Use HTTP localhost or HTTPS, rather than opening files directly.

The 3D game loads Three.js, Tone.js, Tailwind, and a font from external CDNs. The drill workshop is local; speech recognition may require an online browser service and microphone permission. No Mac Accessibility permission is needed.

## Contribute a drill

Start with [CONTRIBUTING.md](CONTRIBUTING.md). A contribution is a folder in `drill-modals/` containing **your HTML/CSS/JS, `drill.json` metadata, and unit tests**. Shared `helpers/` and `styles/` support each drill. [The runner guide](drill-modals/README.md) explains parameterized manual testing and the game output contract. There is no mandatory component structure. The host handles opening/closing; the drill reports completion through a tiny message bridge.

The first real example, `drill-modals/hebrew-reading/`, adapts the sibling `hebrew-reading-lab` project. Level 1 friends open it. Read one word successfully, then choose to release the friend; points and powers remain owned by the game. Canceling grants nothing and allows another attempt. Other encounters keep their math questions.

## Source map

| Location | Purpose |
| --- | --- |
| `dist/index.html` | Main game, worlds, controls, scoring and rescue integration |
| `dist/maze.js` | Maze generation, powers and gameplay |
| `drill-modals/` | Separate drill folders, shared helpers/styles, runner and unit tests |
| `build/` | Generated publishable website (ignored by Git) |
| `dist/assets/` | Game assets |
| `tests/` | Gameplay, metadata and drill lifecycle checks |
| `scripts/` | Dependency-free development server and test runner |

`dist/` contains the game source; `drill-modals/` contains independent drill source. `npm start` serves both directly. `npm run build` packages them into `build/` and excludes drill tests and documentation.

Run a drill’s tests on their own with `npm run test:drill -- hebrew-reading` or `npm run test:drill -- arithmetic`. Open `/drills/?drill=hebrew-reading` to edit inputs and inspect the resulting game payload.

## Push to GitHub

This folder is already a Git repository. Create an empty repository in your GitHub account, then run from this folder, replacing the URL:

```sh
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

No GitHub remote has been configured for you. The tracked `.openai/hosting.json` identifies the existing Sites publication; it contains no credentials. To host elsewhere, run `npm run build` and publish the contents of `build/` using any static host.
