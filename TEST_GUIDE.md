# FunnyGame Testing & Learning Guide

This project includes comprehensive unit tests and interactive learning tools to help you understand how the game code works.

## Quick Start

### Run All Tests
```bash
npm test
```
Runs all 17 tests without any prompts. Shows pass/fail results.

### Take the Interactive Quiz
```bash
npm run quiz
```
Standalone 45-question quiz covering all 17 test topics. Tests your understanding before looking at code.

**Quiz Topics:**
- Vector2 arithmetic and normalization
- Rectangle collision detection
- GameObject hierarchy and lists
- Game state management
- Keyboard input handling
- Level data and room setup
- Animation timing systems
- Text label rendering
- Tile collision types
- Travel point linkage
- Player wall-jump mechanics
- WorldSettings level management
- WorldSettings room aliasing
- PlayingState initialization
- PlayingState room management
- PlayingState travel mechanics

### Learn Mode (Quiz + Tests)
```bash
npm run learn
```
Takes the full quiz, then runs all tests. Best for comprehensive learning.

### Interactive Tests with Prompts
```bash
set QUIZ_MODE=true && npm test
```
Runs tests with prompts asking you to explain what each test does BEFORE it runs. This helps you think actively about the mechanics.

## What Each Test Covers

### 1. **Vector2 arithmetic and normalization**
- Calculating vector length using Pythagorean theorem
- Normalizing vectors to unit length
- Adding and subtracting vectors component-wise
- Using Vector2.zero constant

**Key Concepts:** Physics vectors, magnitude, direction normalization

---

### 2. **Rectangle intersection and contains logic**
- Testing if a point is inside a rectangle
- Detecting rectangle-to-rectangle intersections
- Calculating intersection area/overlap
- AABB (axis-aligned bounding box) collision detection

**Key Concepts:** Bounding boxes, collision detection, spatial queries

---

### 3. **GameObjectList and GameObject hierarchy**
- Adding/removing objects from collections
- Parent-child relationships
- Finding objects by ID
- Maintaining object references

**Key Concepts:** Scene graphs, object management, collections

---

### 4. **GameStateManager transitions**
- Adding game states
- Retrieving states by index
- Switching between active states
- State lifecycle

**Key Concepts:** State machines, game modes (menu, playing, pause, etc.)

---

### 5. **Keyboard state management**
- Detecting continuous key down state
- Detecting single-frame key press events
- Resetting input state between frames
- Key code mappings

**Key Concepts:** Input polling, frame-based input, key bindings

---

### 6. **LevelDataManager setup registration**
- Registering room-specific setup callbacks
- Retrieving setups by level/room ID
- Fallback to default setup
- Room initialization pattern

**Key Concepts:** Dependency injection, factory patterns, level loading

---

### 7. **Animation frame timing**
- Animation frame duration
- Looping vs one-shot animations
- Current frame tracking
- Sprite sheet references

**Key Concepts:** Sprite animation, frame sequencing, timing

---

### 8. **Label text sizing**
- Measuring rendered text dimensions
- DOM element creation for measurement
- Text reset to original value
- Width/height properties

**Key Concepts:** Text rendering, DOM APIs, UI layout

---

### 9. **Tile hitbox generation**
- Solid tile hitbox creation
- Spike tile (hurt) hitbox logic
- Saw tile (circular) hitbox
- Hitbox type determination

**Key Concepts:** Collision shapes, platformer tiles, hazards

---

### 10. **Level travel points**
- Collecting travel points from all rooms
- Assigning unique IDs to points
- Linking bidirectional travel point pairs
- Level navigation

**Key Concepts:** Level transitions, waypoints, graph connections

---

### 11. **Player wall-jump mechanics**
- Detecting jump input from keyboard
- Wall-adjacent detection
- Wall-jump velocity application
- Jump direction tracking

**Key Concepts:** Platformer physics, wall-sliding, advanced movement

---

### 12. **WorldSettings level management**
- Normalizing level data structures
- Converting legacy formats to modern nested rooms
- Managing level persistence
- Fallback and default behavior

**Key Concepts:** Data normalization, backward compatibility, state management

---

### 13. **WorldSettings room aliasing**
- Synchronizing nested rooms[] with legacy room property
- ActiveRoomIndex tracking
- Bridge between formats
- Backward compatibility patterns

**Key Concepts:** API compatibility, dual representation, data sync

---

### 14. **PlayingState initialization**
- Player and enemy spawning
- Tile field management
- Projectile and music systems
- UI button creation

**Key Concepts:** System initialization, component ownership, hierarchy

---

### 15. **PlayingState room management**
- Room visibility toggling
- Player placement and camera positioning
- Room switching mechanics
- Multi-room level navigation

**Key Concepts:** Room transitions, viewport management, level streaming

---

### 16. **PlayingState travel mechanics**
- Travel tile detection
- Teleportation logic
- Ground-snapping for spawn placement
- Repeated trigger prevention

**Key Concepts:** Spatial queries, teleportation, spawn management

---

## Quiz Question Types

The quiz includes three types of questions:

1. **Single Answer** - One specific correct answer
   ```
   Q: What is the length of a Vector2(3, 4)?
   A: 5
   ```

2. **Multiple Accepted Answers** - Several wordings accepted
   ```
   Q: What does normalizing a vector do?
   A: (accepts "makes it length 1", "unit vector", "changes length to 1")
   ```

3. **Open-Ended with Hints** - You get hints if wrong
   ```
   Q: Why do spike tiles have smaller hitboxes?
   Hint: Smaller hitboxes make spike collisions feel more precise
   ```

## Learning Path

### Beginner
1. Start with `npm run quiz` to assess baseline knowledge
2. Read test descriptions in [test/engine.test.js](test/engine.test.js)
3. Run `npm test` to see tests pass
4. Review code in corresponding files

### Intermediate
1. Run `set QUIZ_MODE=true && npm test` to engage actively
2. Before each test, try to explain the mechanics
3. Read the game code files
4. Re-take the quiz to verify understanding

### Advanced
1. Modify tests to add new cases
2. Add new quiz questions in [test/quiz.js](test/quiz.js)
3. Create integration tests combining multiple systems
4. Implement new game features and test them

## Test File Locations

- **Main Tests:** [test/engine.test.js](test/engine.test.js)
- **Interactive Quiz:** [test/quiz.js](test/quiz.js)
- **Engine Files:** [powerupjs/](powerupjs/)
- **Gameplay Files:** [game objects/](game%20objects/)

## Relevant Code Files by Topic

| Test Topic | Main Files |
|-----------|-----------|
| Vector2 | `powerupjs/geom/Vector2.js` |
| Rectangle | `powerupjs/geom/Rectangle.js` |
| GameObjectList | `powerupjs/gameobjects/GameObjectList.js` |
| GameStateManager | `powerupjs/GameStateManager.js` |
| Keyboard | `powerupjs/input/Keyboard.js`, `powerupjs/system/Keys.js` |
| LevelDataManager | `game objects/LevelDataManager.js` |
| Animation | `powerupjs/Animation.js` |
| Label | `powerupjs/gui/Label.js` |
| Tile | `game objects/Tile.js` |
| Level | `game objects/Level.js` |
| Player | `game objects/Player.js` |
| WorldSettings | `WorldSettings.js` |
| PlayingState | `game states/PlayingState.js` |

## Scoring Guide

Your quiz score indicates comprehension level:

- **100%** - Perfect! Deep understanding of all systems
- **80-99%** - Excellent! Most systems well understood
- **60-79%** - Good! Basic understanding, some gaps
- **Below 60%** - Review code and retake to improve

## Tips for Understanding the Code

1. **Follow Vector Math** - Many game systems depend on Vector2 operations
2. **Trace Object Flow** - Follow how objects are created, added to lists, and accessed
3. **Think in Frames** - Game logic runs every frame; understand frame-based timing
4. **Test in Isolation** - Each test exercises one specific feature
5. **Read Game Objects First** - Then understand engine dependencies

## Adding More Tests

To add coverage for other game systems:

1. Add test case to [test/engine.test.js](test/engine.test.js)
2. Add quiz questions to [test/quiz.js](test/quiz.js)
3. Follow the pattern: `test('Name', async () => { await quizBefore(...) })`
4. Run tests with `npm test`

## Notes

- All tests run in Node.js with a browser-like sandbox environment
- No actual browser needed to test game logic
- Tests focus on core mechanics, not rendering or UI
- Quiz accepts flexible answers (case-insensitive, partial matches)

## Troubleshooting

**Tests not running?**
```bash
npm install    # Ensure dependencies
node --version # Verify Node.js LTS installed
```

**Quiz not prompting?**
```bash
set QUIZ_MODE=true && npm test  # For Windows PowerShell
QUIZ_MODE=true npm test          # For bash/Linux
```

**Want to skip quiz?**
```bash
npm test     # Runs without prompts
```

---

Happy learning! Understand how your game engine works from the ground up. 🎮
