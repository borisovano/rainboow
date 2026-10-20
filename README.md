# Moon & Rainbow Math Adventure

A Hebrew 3D learning adventure with Earth, Moon, Rainbow, and Maze worlds. All game code, assets, drills, and tests are in this repository. The game uses Three.js and Tone.js; contributed drills can use plain HTML, CSS, and JavaScript.

## Run locally

Requires Node.js 18 or newer. No package installation is required:

```sh
npm start
npm test
npm run build
```

Open [the game](http://127.0.0.1:8765/), [the command center](http://127.0.0.1:8765/control-center/), or [the maze](http://127.0.0.1:8765/?stage=maze). Set `PORT=8874 npm start` if the port is occupied. Use HTTP localhost or HTTPS, rather than opening files directly.

The 3D game includes its matching Three.js renderer locally and loads Tone.js, Tailwind, and a font from external CDNs. The command center runs locally; speech recognition may require an online browser service and microphone permission. No Mac Accessibility permission is needed.

## Contribute a drill

Start with [CONTRIBUTING.md](CONTRIBUTING.md). A contribution is a folder in `drill-modals/` containing **your HTML/CSS/JS, `drill.json` metadata, and unit tests**. Shared `helpers/` and `styles/` support each drill. [The runner guide](drill-modals/README.md) explains parameterized manual testing and the game output contract. There is no mandatory component structure. The host handles opening/closing; the drill reports completion through a tiny message bridge.

The first real example, `drill-modals/word-reading/`, adapts the sibling `hebrew-reading-lab` project. All friends in Earth, Moon, Rainbow and Maze use it, along with Moon bridge gates, Rainbow gates, the final gold-pot unlock to the Maze, and the Maze exit. One correct word automatically returns to the game; points, powers and unlock conditions remain owned by the game. Enemy encounters and ordinary obstacles/treasure keep their math questions.

## Source map

| Location | Purpose |
| --- | --- |
| `dist/index.html` | Main game, worlds, controls, scoring and rescue integration |
| `dist/maze.js` | Maze generation, powers and gameplay |
| `dist/features/` | Feature registry, browser settings, and the four optional Blender game avatars |
| `dist/control-center/` | Global settings, features, drills, character editors, manual testing and results |
| `drill-modals/` | Separate drill folders, shared helpers/styles, runner and unit tests |
| `build/` | Generated publishable website (ignored by Git) |
| `dist/assets/` | Game assets |
| `tests/` | Gameplay, metadata and drill lifecycle checks |
| `scripts/` | Dependency-free development server and test runner |

`dist/` contains the game source; `drill-modals/` contains independent drill source. `npm start` serves both directly. `npm run build` packages them into `build/` and excludes drill tests and documentation.

Run a drill’s tests on their own with `npm run test:drill -- word-reading` or `npm run test:drill -- math`. Open `/drills/?drill=word-reading` to edit inputs and inspect the resulting game payload.

## Push to GitHub

This folder is already a Git repository. Create an empty repository in your GitHub account, then run from this folder, replacing the URL:

```sh
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

No GitHub remote has been configured for you. The tracked `.openai/hosting.json` identifies the existing Sites publication; it contains no credentials. To host elsewhere, run `npm run build` and publish the contents of `build/` using any static host.

Testing shortcuts (type during play; physical English letter keys also work with a Hebrew keyboard): `aba` opens the Moon route; `abubu` sets speed ×5; `bibi` adds exactly 1,000 points (ignoring score multipliers); `powers` unlocks all powers of the current world (and replenishes their uses/cooldowns); `gates` opens its progression gates. In the Maze, `gates` allows finishing by walking to the exit without rescuing everyone or answering the exit drill. The points shortcut grants testing points without marking friends rescued or granting their powers. Other shortcuts do not award points. In the Maze, a lone `B` waits two seconds to distinguish the hammer command from `bibi`; its on-screen hammer button remains immediate. Powers still reset on entering another world.

Super-jump doubles horizontal movement while airborne on Earth and Moon, creating a longer leap without changing its height. Ground movement and ordinary jumps keep their existing speed; the leap multiplier also stacks with the testing speed shortcut.

Math encounters open immediately with an optional breathing bonus button. Pressing it shows the breathing child over the answers for ten seconds by default while leaving the equation visible. Answers and the countdown pause, then the encounter's full time allowance restarts (including the Rainbow clock bonus). The question and previous mistakes remain unchanged. Untimed questions stay untimed.

Direct stage URLs: `/earth/`, `/moon/`, `/rainbow/`, `/maze/`. Each redirects to `/?stage=<name>`; select a class to start directly in that world with zero points and no powers. Unknown stage values start on Earth. These entries bypass earlier worlds, while the chosen world's own challenges stay active.

Hebrew reading follows the selected class in every world: א׳ = 2 letters, ב׳ = 3, ג׳ = 4, ד׳ = 5. All 36 words have niqqud and hints; the runner can override the length for manual exploration.

### Character Studio

Open `/character-studio/` for an independent image playground: four original characters, six head/eye accessories, and six neck/body accessories. Stack pieces, drag or adjust their fit, share a look link, and download PNGs or a look recipe. Source, original generated images, and prompts live in [`character-studio/`](character-studio/README.md).

The command center includes both image and 3D character editors. Under **Characters → 3D models**, preview **Pip, Moss, Sunny, and Luna**, each with idle, walk, jump, and wave animations. Pip now has a nearly round cross-section: body depth 2.62 versus width 2.8. Each character has an animated GLB, editable Blender project, rendered preview, and shared reproducible build script. See the [3D asset workflow](character-studio/3d/README.md). Direct `/character-studio/` and `/character-studio/3d/` links remain available.

### Command center

Open `/control-center/` for all configuration and testing:

- **Global parameters**: starting world and selected character.
- **Global features**: starting 3D character toggle and the character-customization unlock.
- **Drills**: catalog and metadata filters. Each drill has **Main**, **Parameters**, and **Features** only when it defines features. Main includes standalone testing, examples, metadata and returned results. Math's design examples are available here too.
- **Characters**: image/accessory editor and 3D models, embedded in the same command center. **Use in game** selects a model and enables 3D characters.

`/feature-flags/`, `/drills/`, and all `/drills/workshop` variants redirect here. The workshop is no longer a separate catalog. Query parameters are preserved. Deep links include `?section=global-parameters`, `?section=global-features`, `?section=drills`, `?section=characters`, `?section=characters&part=images`, and `?drill=math&part=features`.

Settings are browser-local under `moon-rainbow.features.v1`, and update ordinary open game tabs through storage events. Saved starting-world changes apply when a new game starts. This public testing page does not change every player's defaults. Reset affects only these settings.

The **3D characters** flag keeps its original stable ID `pipCharacter` (default **off**) for compatibility. Choose the model under Global parameters. A shared game link pins the world, character, flags and validated drill settings (`dp.<drillId>` JSON). For example, `/?stage=moon&character=luna&ff.pipCharacter=1` starts the Moon with Luna. Explicit URL values override browser defaults for that tab. If storage is unavailable, copy a game link to carry the setup.

**In-game customization** is controlled by `characterCustomization`, enabled by default. The HUD shows progress toward 200 points; at 200 or more it opens a four-character picker. Choosing Pip, Moss, Sunny or Luna enables that 3D model for the current run, including when the starting-character flag is off or pinned by a testing link. This does not spend points or overwrite browser defaults. The game, powers, and maze-map countdown pause while the picker is open. Escape or Cancel resumes without changing the character. Disabling the feature closes the picker and restores the configured starting appearance. The command center remains available for development independently of gameplay unlocks.

**Design Studio at 300 points** upgrades that picker to a live, rotatable 3D editor. Its `designStudio` feature is enabled by default and requires `characterCustomization`. Choose any of the four characters, one of six head/eye wearables, and one of six neck/chest wearables; either slot can be empty. Apply resumes play in the outfit; Cancel leaves the previous outfit intact. Editing pauses the game and all gameplay timers. The studio uses the same fitted GLBs as the game, attached to the animated body control. Cosmetic meshes do not alter collision size, speed, or jump physics, and become translucent with the cloak power. Turning this feature off removes wearables while keeping character selection available.

Open **Command center → Characters → Design studio** (`/control-center/?section=characters&part=wardrobe`) to design without playing. `/character-studio/wardrobe/` is the standalone editor. Saving stores a design in this browser under `moon-rainbow.wardrobe.v1`; it is offered the next time the game studio is opened. This never bypasses the 300-point unlock on a new run or changes the global starting-character setting. `bibi` adds 1,000 testing points to try the unlock. The existing image editor and model inspector are still available in the same command center.

The twelve accessories were remodeled as real 3D meshes from the 2D concepts, with four sets fitted to each character. Editable Blender sources and the headless rebuild script live in `character-studio/3d/source/`; the four `*-wearables.glb` files contain one named root per accessory. The shared `wearables.js` catalog validates slots and attaches them. Game/studio messages require the expected origin, iframe, active editor session and a valid design; rewards and unlocks remain owned by the game.

Characters share the same player position, collision radius, growth, jumping, stage transitions, powers, and death logic. Each is loaded only when selected and enabled; loading or failed assets retain the classic character. Loaded models are cached, and switching during loading always honors the most recent selection. Idle/walk/jump follow actual movement; the exported vertical hop is removed so physics remains authoritative. New-power screens play Wave. Cloaking affects all model materials.

Game-wide flags live in `dist/features/flags.js`. Drill-owned features belong in that drill’s `drill.json`; the control center nests each toggle and its parameters under its owner. Math owns `math.breathing` (on by default), with `durationSeconds: 10` and a validated range of 1–60 seconds. Changes update open game tabs; an active standalone drill keeps the configuration it started with. A breathing pause already in progress finishes at its original duration.

For a game-wide flag, register its stable `id`, title, category, description, and boolean default in `dist/features/flags.js`. The controller and link builder render that registry automatically. Use `GameFeatures.enabled(id)` at the integration point, and `GameFeatures.subscribe(callback)` for live changes. See `tests/feature-flags.cjs` and `tests/pip-avatar.cjs` for storage/URL behavior and actual r128 GLB animation checks.
