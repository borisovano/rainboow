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

The first real example, `drill-modals/hebrew-reading/`, adapts the sibling `hebrew-reading-lab` project. All friends in Earth, Moon, Rainbow and Maze use it, along with Moon bridge gates, Rainbow gates, the final gold-pot unlock to the Maze, and the Maze exit. One correct word automatically returns to the game; points, powers and unlock conditions remain owned by the game. Enemy encounters and ordinary obstacles/treasure keep their math questions.

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

Testing shortcuts (type during play; physical English letter keys also work with a Hebrew keyboard): `aba` opens the Moon route; `abubu` sets speed ×5; `powers` unlocks all powers of the current world (and replenishes their uses/cooldowns); `gates` opens its progression gates. In the Maze, `gates` allows finishing by walking to the exit without rescuing everyone or answering the exit drill. Shortcuts do not award rescue points or mark friends rescued. Powers still reset on entering another world.

Direct stage URLs: `/earth/`, `/moon/`, `/rainbow/`, `/maze/`. Each redirects to `/?stage=<name>`; select a class to start directly in that world with zero points and no powers. Unknown stage values start on Earth. These entries bypass earlier worlds, while the chosen world's own challenges stay active.

Hebrew reading follows the selected class in every world: א׳ = 2 letters, ב׳ = 3, ג׳ = 4, ד׳ = 5. All 36 words have niqqud and hints; the runner can override the length for manual exploration.

### Character Studio

Open `/character-studio/` for an independent image playground: four original characters, six head/eye accessories, and six neck/body accessories. Stack pieces, drag or adjust their fit, share a look link, and download PNGs or a look recipe. Source, original generated images, and prompts live in [`character-studio/`](character-studio/README.md). The game characters are unchanged.
