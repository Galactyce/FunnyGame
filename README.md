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

Flying enemies choose a destination within 100 pixels of their current position,
move toward it at 30 pixels per second, and stop for two seconds before choosing
another destination. Their behavior exposes `moveSpeed` and `wanderDistance`
for tuning. Set `wandering` to `false` and assign a
`powerupjs.Vector2` to `moveTarget` to fly to a fixed destination instead.
In debug mode, each flying enemy draws a crosshair sprite centered on its current
move target. The marker follows target changes and is drawn with its enemy, so
removing the enemy also removes its marker from view.

Flying enemies reroute when they move less than half a pixel for
`wanderWaitTime` seconds while a target is still ahead. This also interrupts a
Dapper's chase: it follows the recovery target before checking for the player
again. `wanderWaitTime` is a duration (2 seconds by default, 0.5 for Dappers),
used for both destination waits and stuck recovery; it is not a countdown.
Target selection tries at most 20 candidates. If none are clear and within the
camera bounds, the enemy stops and retries after its wait instead of recursing.

Flying movement uses `actualVelocity` to compensate for lost speed. It estimates
the previous command's movement loss and boosts the next command by up to 3x,
keeping `moveSpeed` as the ideal speed. The boost adjusts back down when movement
is unobstructed and resets on arrival or target reselection. Commands are limited
to the remaining target distance for the current frame delta. Completely blocked
enemies still use stuck rerouting; compensation cannot force them through walls.

`enemy.canSeePlayer()` checks line of sight to `WorldSettings.player` using the
tile raycast and returns `false` when no player is active. Dapper enemies use it
to chase visible players less than 500 pixels away. After losing sight, they
finish approaching the last seen position before resuming wandering.

## Circular collision hitboxes

Physics objects, enemies, players, and ordinary tiles default to rectangular
hitboxes. Set `hitboxShape` to `"circle"` to use a circle centered on the
object's collision rectangle, with radius `Math.max(width, height) / 2`.
The circle matches the larger dimension and scales with the rectangle:

```js
enemy.hitboxShape = "circle";
enemy.adjustHitbox();

tile.hitboxShape = "circle";
tile.manageHitboxes();
```

For registered enemy types, set `enemy.hitboxShape` in the behavior's
`loadAnimations(enemy)` hook so each created or reloaded enemy uses that shape.
This is a runtime setting, not a new editor palette or saved tile property.

Dappers also use `hurtboxShape = "circle"`. Enemy hurtboxes default to
`"rectangle"`; `manageHitboxes()` respects this independent shape setting.
Circular hurtboxes use half the larger dimension of the existing hurtbox bounds
as their radius and stay centered on those bounds as the enemy moves or scales.

Circle-circle, circle-rectangle, and rectangle-circle overlaps work with
`hitbox.intersects(otherHitbox)`; touching shapes count as overlaps. Solid tile
contacts separate overlapping objects and remove inward velocity while
preserving tangential motion. Ground,
wall, damage, projectile, and travel-point checks use the selected hitbox.
Circle coordinates (`x`, `y`) are its center; `.left`, `.right`, `.top`, and
`.bottom` give its extents.

Circular `hurt` tiles (such as saws) remain non-solid damage triggers.
Rectangular `hurt` tiles remain solid hazards. Use `hitboxType = "solid"` for
a solid circular tile. Set `hitboxShape` back to `"rectangle"` and refresh
the hitbox to restore rectangular collisions. Like rectangular collisions,
these checks resolve discrete-frame overlaps, not continuous swept collisions.

## Actual physics velocity

`PhysicsGameObject.actualVelocity` is updated after each physics step using the
net displacement after collision resolution divided by the frame delta in seconds.
It is a `powerupjs.Vector2` in pixels per second; use `.length` for actual speed.
It starts at zero and is separate from the requested `velocity`.

For a custom measurement, save a copy of the starting position and call
`object.calculateActualVelocity(previousPosition, delta)` after moving.
This returns a new vector without changing either position or the cached
`actualVelocity`. A zero delta returns a zero vector; negative or non-finite
deltas and invalid previous positions throw an error.

Automatic measurements cover only the physics step: repositioning between
updates (such as spawning or teleporting) is excluded. When physics updates are
paused, the cached value remains the last measured velocity.

## Physics raycasts

Physics objects (including enemies and players) expose `raycast(target, start)`.
It checks the finite segment from `start` (default: the object's `position`) to
`target` against the current room's rectangular and circular tile hitboxes.
Use room coordinates, not screen coordinates.

```js
var hit = enemy.raycast(candidate);
if (hit === null) {
    this.moveTarget = candidate;
} else {
    console.log("Blocked by", hit.tile, "at", hit.point, "distance", hit.distance);
}
```

The result is `null` for a clear segment, or `{ tile, point, distance, fraction }`
for the nearest hit. `fraction` ranges from 0 at the start to 1 at the target.
Edges and tangencies count as hits; starting inside a hitbox returns distance 0.
A zero-length segment tests whether its point is inside or on a hitbox.
Tiles with hitbox type `none` or `void` are ignored; `hurt` tiles are included.
Invalid coordinates or a missing current room throw an error.

Raycasts do not move objects or change collision state. They have no width, so a
clear ray does not guarantee the whole object can fit along the path, and they
do not perform pathfinding.
