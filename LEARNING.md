# 🎮 FunnyGame Testing & Learning Setup

## Three Ways to Learn the Code

### 1️⃣ **Run the Quiz** (No code needed)
```bash
npm run quiz
```
**30 interactive questions** covering all 11 test topics. Great way to self-assess your understanding before diving into code.

**Example:**
- Q: "What is the length of a Vector2(3, 4)?"
- Accepts: `5` ✅
- Includes hints if you're wrong

---

### 2️⃣ **Run the Tests** (Verify implementations)
```bash
npm test
```
All **17 tests pass** ✔️. Confirms that core game systems work correctly.

**What's tested:**
- ✔️ Vector2 arithmetic & normalization
- ✔️ Rectangle collision detection  
- ✔️ GameObject hierarchies & lists
- ✔️ Game state transitions
- ✔️ Keyboard input handling
- ✔️ Level/room setup registration
- ✔️ Animation frame timing
- ✔️ Text label rendering
- ✔️ Tile collision types
- ✔️ Travel point systems
- ✔️ Player wall-jump mechanics
- ✔️ **NEW:** WorldSettings level management
- ✔️ **NEW:** WorldSettings room aliasing
- ✔️ **NEW:** PlayingState initialization
- ✔️ **NEW:** PlayingState room management
- ✔️ **NEW:** PlayingState travel mechanics

---

### 3️⃣ **Interactive Test Mode** (Learn by explaining)
```bash
set QUIZ_MODE=true && npm test
```
**Before each test runs**, you're prompted to explain how it works in your own words.

Example flow:
```
📝 Vector2 arithmetic and normalization
Description: Tests that Vector2 can calculate length, normalize...

Can you explain how it works? (or press Enter to skip):
> Vectors store x,y coordinates and can be added together
→ Now running the actual test...
✔ Vector2 arithmetic and normalization (7.3ms)
```

---

### 4️⃣ **Comprehensive Learning** (Quiz + Tests)
```bash
npm run learn
```
Takes the full 30-question quiz, then runs all tests. Total learning session.

---

## File Structure

```
test/
  ├── engine.test.js      ← All 11 unit tests with quiz prompts
  └── quiz.js             ← Standalone 30-question quiz

TEST_GUIDE.md             ← Comprehensive learning guide
package.json              ← npm scripts configured
```

---

## Quick Reference: What Each Test Teaches

| Test | Key Learning |
|------|--------------|
| **Vector2** | Math: magnitude, normalization, vector ops |
| **Rectangle** | Collision: AABB, intersection, containment |
| **GameObjectList** | Design: parent-child relationships, collections |
| **GameStateManager** | Architecture: state machines, transitions |
| **Keyboard** | Input: polling, frame-based events, buffers |
| **LevelDataManager** | Design: registration patterns, callbacks |
| **Animation** | Timing: frame sequencing, sprite sheets |
| **Label** | Rendering: text measurement, DOM APIs |
| **Tile** | Collision: shape variants, hitbox generation |
| **Level** | Graphs: waypoint linking, level navigation |
| **Player** | Platformer: complex movement, wall mechanics |
| **WorldSettings** | Persistence: level saving, data normalization |
| **PlayingState** | Gameplay: room management, entity spawning |

---

## How to Use This for Learning

**As a learner:**
1. `npm run quiz` → See what you know
2. Read [TEST_GUIDE.md](TEST_GUIDE.md) → Understand each system
3. `set QUIZ_MODE=true && npm test` → Actively engage
4. Read the game code files
5. `npm run quiz` again → Verify improvement

**As an educator:**
1. Have students take `npm run quiz`
2. Have them review code before tests run
3. Use `QUIZ_MODE=true` for interactive learning
4. Check final scores with `npm run quiz`

**As a developer:**
1. Run `npm test` to verify changes
2. Add new tests following the pattern
3. Add quiz questions in `test/quiz.js`
4. Use `QUIZ_MODE=true` when learning unfamiliar systems

---

## Test Results

✅ **All 17 tests passing**
```
✔ Vector2 arithmetic and normalization
✔ Rectangle intersection and contains logic
✔ GameObjectList and GameObject hierarchy
✔ GameStateManager transitions
✔ Keyboard state management
✔ LevelDataManager registration
✔ Animation frame timing
✔ Label text sizing
✔ Tile hitbox generation
✔ Level travel points
✔ Player wall-jump mechanics
✔ WorldSettings level management
✔ WorldSettings room aliasing
✔ PlayingState initialization
✔ PlayingState room management
✔ PlayingState travel mechanics
```

**Run time:** ~110ms | **Exit code:** 0

---

## Getting Help

See [TEST_GUIDE.md](TEST_GUIDE.md) for:
- Detailed test descriptions
- Code file references
- Learning path recommendations  
- Troubleshooting tips
- Quiz scoring guide

---

**Start learning:** `npm run quiz` 🚀
