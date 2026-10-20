https://htmlpreview.github.io/?https://raw.githubusercontent.com/Galactyce/FunnyGame/master/index.html

## VS Code Run Note

Run this project from a local server in VS Code (Terminal), not by opening `index.html` with `file://`.

### Quick start (Python)

1. Open the VS Code terminal in this project folder.
2. Run:

```bash
python -m http.server 8080
```

3. Open:

http://localhost:8080/

This avoids browser file-origin security errors and ensures assets load correctly.

## Controls

- Move left/right: **A/D** or **Left/Right Arrow**. These controls do not clear saves or reload the page.
- Reset saved data: press **Y** on the title screen. This deletes local saves and reloads the game.

## Enemy placement

Enemy placements retain their registered type, sprite, and behavior when saving,
reopening the editor, or starting a level. Registered enemy sprites (including the
slime) do not need to be part of the tile palette to load correctly. Older
placements with only a matching registered sprite can still resolve their type.

`Enemy.create` calls `loadAnimations()` after assigning the enemy's behavior,
including when loading saved placements. Override `loadAnimations(enemy)` on a
behavior script to register and play its animations before the origin and hitboxes
are finalized.
