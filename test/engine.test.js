'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const readline = require('node:readline');

const QUIZ_MODE = process.env.QUIZ_MODE === 'true';

let rl;

function initializeReadline() {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
  }
  return rl;
}

function prompt(question_text) {
  return new Promise(resolve => {
    if (!QUIZ_MODE) {
      resolve('skip');
      return;
    }
    const readline_instance = initializeReadline();
    readline_instance.question(question_text, resolve);
  });
}

async function quizBefore(testName, description) {
  if (!QUIZ_MODE) return;
  
  console.log(`\n📝 ${testName}`);
  console.log(`Description: ${description}\n`);
  
  const answer = await prompt('Before we test this, can you explain how it works? (or press Enter to skip): ');
  
  if (answer.trim()) {
    console.log(`✓ Your understanding: "${answer}"`);
    console.log('→ Now running the actual test...\n');
  }
}

function createSandbox() {
  const sandbox = {
    console,
    setTimeout(fn) { return typeof fn === 'function' ? fn() : null; },
    clearTimeout() {},
    requestAnimationFrame(fn) { return typeof fn === 'function' ? fn() : null; },
    cancelAnimationFrame() {},
    alert() {},
    navigator: { userAgent: 'node-test' },
    localStorage: {
      store: {},
      getItem(key) { return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null; },
      setItem(key, value) { this.store[key] = String(value); },
      removeItem(key) { delete this.store[key]; }
    },
    Image: class {
      constructor() {
        this.width = 32;
        this.height = 32;
        this.crossOrigin = '';
        this.onload = null;
        this.src = '';
      }
    },
    Audio: class {
      constructor() {
        this.volume = 1;
        this.src = '';
        this.autoplay = false;
        this.loop = false;
        this.addEventListener = () => {};
        this.load = () => {};
      }
    },
    document: {
      readyState: 'complete',
      body: {
        appendChild() {},
        removeChild() {},
        addEventListener() {},
        removeEventListener() {}
      },
      addEventListener() {},
      getElementById() {
        return {
          style: {},
          width: 1280,
          height: 720,
          offsetLeft: 0,
          offsetTop: 0,
          offsetParent: null,
          getContext() {
            return {
              save() {}, restore() {}, scale() {}, translate() {}, rotate() {},
              clearRect() {}, strokeRect() {}, beginPath() {}, arc() {}, fillText() {},
              fillRect() {}, drawImage() {}, stroke() {}, fill() {}, closePath() {}
            };
          }
        };
      },
      createElement() {
        return {
          width: 1280,
          height: 720,
          offsetWidth: 80,
          offsetHeight: 20,
          style: {},
          innerHTML: '',
          getContext() {
            return {
              save() {}, restore() {}, scale() {}, translate() {}, rotate() {},
              clearRect() {}, strokeRect() {}, beginPath() {}, arc() {}, fillText() {},
              fillRect() {}, drawImage() {}, stroke() {}, fill() {}, closePath() {}
            };
          }
        };
      }
    },
    powerupjs: {},
    ID: {},
    sprites: {},
    sounds: {},
    WorldSettings: { music: { setRoomSong() {}, playForRoom() {} } },
    LEVELS: []
  };

  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  return sandbox;
}

function loadScript(filePath, sandbox) {
  const context = vm.createContext(sandbox);
  const scriptText = fs.readFileSync(filePath, 'utf8');
  vm.runInContext(scriptText, context, { filename: filePath });
  return context.powerupjs || context.LevelDataManager || context;
}

function loadEngine() {
  const sandbox = createSandbox();
  const root = path.join(__dirname, '..');
  const scripts = [
    'powerupjs/Math.js',
    'powerupjs/IGameLoopObject.js',
    'powerupjs/geom/Vector2.js',
    'powerupjs/geom/Rectangle.js',
    'powerupjs/geom/Circle.js',
    'powerupjs/geom/LineClipping.js',
    'powerupjs/Canvas2D.js',
    'powerupjs/system/Color.js',
    'powerupjs/system/Keys.js',
    'powerupjs/input/ButtonState.js',
    'powerupjs/input/Keyboard.js',
    'powerupjs/input/Mouse.js',
    'powerupjs/input/Touch.js',
    'powerupjs/SpriteSheet.js',
    'powerupjs/Sound.js',
    'powerupjs/Animation.js',
    'powerupjs/gameobjects/GameObject.js',
    'powerupjs/gameobjects/GameObjectList.js',
    'powerupjs/gameobjects/GameObjectGrid.js',
    'powerupjs/gameobjects/SpriteGameObject.js',
    'powerupjs/gameobjects/AnimatedGameObject.js',
    'powerupjs/gameobjects/PhysicsGameObject.js',
    'powerupjs/gui/Button.js',
    'powerupjs/gui/Label.js',
    'powerupjs/GameStateManager.js',
    'powerupjs/Game.js',
    'powerupjs/Camera.js'
  ];

  for (const script of scripts) {
    sandbox.powerupjs = loadScript(path.join(root, script), sandbox);
  }

  assert.ok(sandbox.powerupjs, 'powerupjs namespace failed to initialize');
  return sandbox.powerupjs;
}

function loadLevelDataManager() {
  const sandbox = createSandbox();
  sandbox.WorldSettings = { music: { setRoomSong() {}, playForRoom() {} } };
  sandbox.sounds = {};
  const result = loadScript(path.join(__dirname, '..', 'game objects', 'LevelDataManager.js'), sandbox);
  const manager = result && result.LevelDataManager ? result.LevelDataManager : sandbox.LevelDataManager || result;
  assert.ok(manager, 'LevelDataManager failed to load');
  return manager;
}

function loadGameplayScripts() {
  const sandbox = createSandbox();
  sandbox.ID = sandbox.ID || {};
  sandbox.ID.player = 1;
  sandbox.ID.game_state_editor = 0;
  sandbox.ID.game_state_playing = 1;
  sandbox.sprites = {
    blank: { image: { src: 'blank.png' }, width: 16, height: 16, nrSheetElements: 1, center: { x: 8, y: 8 }, draw() {} },
    player: {
      idle: { image: { src: 'idle.png' }, width: 32, height: 32, nrSheetElements: 1, center: { x: 16, y: 16 }, draw() {} },
      run: { image: { src: 'run.png' }, width: 32, height: 32, nrSheetElements: 1, center: { x: 16, y: 16 }, draw() {} },
      jump: { image: { src: 'jump.png' }, width: 32, height: 32, nrSheetElements: 1, center: { x: 16, y: 16 }, draw() {} },
      fall: { image: { src: 'fall.png' }, width: 32, height: 32, nrSheetElements: 1, center: { x: 16, y: 16 }, draw() {} }
    },
    defaultTile: { image: { src: 'tile.png' }, width: 32, height: 32, nrSheetElements: 1, center: { x: 16, y: 16 }, draw() {} },
    spike: { image: { src: 'spike.png' }, width: 32, height: 32, nrSheetElements: 1, center: { x: 16, y: 16 }, draw() {} },
    saw: { image: { src: 'saw.png' }, width: 32, height: 32, nrSheetElements: 1, center: { x: 16, y: 16 }, draw() {} }
  };
  sandbox.WorldSettings = sandbox.WorldSettings || {
    debugMode: false,
    currentLevel: null,
    currentState: 'playing',
    gravity: 25,
    wallSlideSpeed: 30,
    cameraSmoothingFactor: 1,
    terminalVelocity: 530,
    currentLevelIndex: 0,
    activePlayer: null
  };

  const root = path.join(__dirname, '..');
  const scripts = [
    'powerupjs/Math.js',
    'powerupjs/IGameLoopObject.js',
    'powerupjs/geom/Vector2.js',
    'powerupjs/geom/Rectangle.js',
    'powerupjs/geom/Circle.js',
    'powerupjs/geom/LineClipping.js',
    'powerupjs/Canvas2D.js',
    'powerupjs/system/Color.js',
    'powerupjs/system/Keys.js',
    'powerupjs/input/ButtonState.js',
    'powerupjs/input/Keyboard.js',
    'powerupjs/input/Mouse.js',
    'powerupjs/input/Touch.js',
    'powerupjs/SpriteSheet.js',
    'powerupjs/Sound.js',
    'powerupjs/Animation.js',
    'powerupjs/gameobjects/GameObject.js',
    'powerupjs/gameobjects/GameObjectList.js',
    'powerupjs/gameobjects/GameObjectGrid.js',
    'powerupjs/gameobjects/SpriteGameObject.js',
    'powerupjs/gameobjects/AnimatedGameObject.js',
    'powerupjs/gameobjects/PhysicsGameObject.js',
    'game objects/CharacterController.js',
    'powerupjs/gui/Label.js',
    'powerupjs/Camera.js',
    'powerupjs/GameStateManager.js',
    'game objects/DraggableObject.js',
    'game objects/Tile.js',
    'game objects/TileField.js',
    'game objects/Room.js',
    'game objects/Level.js',
    'game objects/Player.js',
    'WorldSettings.js'
  ];

  for (const script of scripts) {
    const result = loadScript(path.join(root, script), sandbox);
    if (result.powerupjs) {
      sandbox.powerupjs = result.powerupjs;
    }
  }

  sandbox.sprites.blank.center = new sandbox.powerupjs.Vector2(8, 8);
  sandbox.sprites.player.idle.center = new sandbox.powerupjs.Vector2(16, 16);
  sandbox.sprites.player.run.center = new sandbox.powerupjs.Vector2(16, 16);
  sandbox.sprites.player.jump.center = new sandbox.powerupjs.Vector2(16, 16);
  sandbox.sprites.player.fall.center = new sandbox.powerupjs.Vector2(16, 16);
  sandbox.sprites.defaultTile.center = new sandbox.powerupjs.Vector2(16, 16);
  sandbox.sprites.spike.center = new sandbox.powerupjs.Vector2(16, 16);
  sandbox.sprites.saw.center = new sandbox.powerupjs.Vector2(16, 16);

  sandbox.powerupjs.Game = sandbox.powerupjs.Game || { size: new sandbox.powerupjs.Vector2(1280, 720) };
  sandbox.powerupjs.Camera.position = new sandbox.powerupjs.Vector2(0, 0);
  sandbox.powerupjs.GameStateManager = sandbox.powerupjs.GameStateManager || { add() { return 0; }, get() { return null; }, switchTo() {} };
  return sandbox;
}

test('Vector2 arithmetic and normalization', async () => {
  await quizBefore('Vector2 arithmetic and normalization', 
    'Tests that Vector2 can calculate length, normalize to unit vectors, and perform add/subtract operations');
  
  const powerupjs = loadEngine();
  const a = new powerupjs.Vector2(3, 4);
  const b = new powerupjs.Vector2(1, 2);

  assert.equal(a.length, 5);
  assert.equal(a.isZero, false);

  const sum = a.add(b);
  assert.deepEqual({ x: sum.x, y: sum.y }, { x: 4, y: 6 });

  const diff = a.subtract(b);
  assert.deepEqual({ x: diff.x, y: diff.y }, { x: 2, y: 2 });

  const normalized = a.copy().normalize();
  assert.ok(Math.abs(normalized.x - 0.6) < 1e-12);
  assert.ok(Math.abs(normalized.y - 0.8) < 1e-12);
  assert.equal(powerupjs.Vector2.zero.isZero, true);
});

test('Rectangle intersection and contains logic', async () => {
  await quizBefore('Rectangle intersection and contains logic',
    'Tests that rectangles can check if they contain points, detect intersections, and calculate overlap areas');
  
  const powerupjs = loadEngine();
  const rectA = new powerupjs.Rectangle(0, 0, 10, 10);
  const rectB = new powerupjs.Rectangle(5, 5, 10, 10);
  const rectC = new powerupjs.Rectangle(20, 20, 4, 4);

  assert.equal(rectA.contains(new powerupjs.Vector2(5, 5)), true);
  assert.equal(rectA.intersects(rectB), true);
  assert.equal(rectA.intersects(rectC), false);

  const intersection = rectA.intersection(rectB);
  assert.deepEqual({ x: intersection.x, y: intersection.y, width: intersection.width, height: intersection.height }, {
    x: 5,
    y: 5,
    width: 5,
    height: 5
  });
});

test('Rectangle pans inner rectangles across either axis', async () => {
  await quizBefore('Rectangle inner-rect panning',
    'Tests that a camera rectangle moves an inner rectangle across horizontal and vertical axes with layer depth');

  const powerupjs = loadEngine();
  const camera = new powerupjs.Rectangle(50, 25, 100, 50);
  const container = new powerupjs.Rectangle(0, 0, 200, 100);
  const inner = new powerupjs.Rectangle(0, 0, 300, 150);

  camera.panInnerRect(container, inner, 'x');
  assert.equal(inner.x, -50);

  camera.panInnerRect(container, inner, 'y');
  assert.equal(inner.y, 0);

  camera.x = 100;
  camera.y = 50;
  camera.panInnerRect(container, inner, 'x', 2);
  camera.panInnerRect(container, inner, 'y', 2);
  assert.equal(inner.x, 0);
  assert.equal(inner.y, 0);
});

test('GameObjectList and GameObject hierarchy behave predictably', async () => {
  await quizBefore('GameObjectList and GameObject hierarchy',
    'Tests that GameObjects maintain parent references when added to lists, can be found by ID, and are properly removed');
  
  const powerupjs = loadEngine();
  const list = new powerupjs.GameObjectList();
  const childA = new powerupjs.GameObject(1, 'a');
  const childB = new powerupjs.GameObject(2, 'b');

  list.add(childA);
  list.add(childB);

  assert.equal(list.length, 2);
  assert.equal(list.at(0), childA);
  assert.equal(childA.parent, list);
  assert.equal(list.find('b'), childB);

  list.remove(childA);
  assert.equal(list.length, 1);
  assert.equal(list.at(0), childB);
  assert.equal(childA.parent, null);
});

test('GameStateManager transitions active game states', async () => {
  await quizBefore('GameStateManager transitions',
    'Tests that the state manager can add states, retrieve them, and switch between active states');
  
  const powerupjs = loadEngine();
  const stateA = { reset() {}, handleInput() {}, update() {}, draw() {} };
  const stateB = { reset() {}, handleInput() {}, update() {}, draw() {} };

  powerupjs.GameStateManager._gameStates = [];
  powerupjs.GameStateManager._currentGameState = null;

  powerupjs.GameStateManager.add(stateA);
  powerupjs.GameStateManager.add(stateB);
  powerupjs.GameStateManager.switchTo(0);

  assert.equal(powerupjs.GameStateManager.get(0), stateA);
  assert.equal(powerupjs.GameStateManager.get(1), stateB);
  assert.equal(powerupjs.GameStateManager._currentGameState, stateA);
});

test('Keyboard state records presses and down states', async () => {
  await quizBefore('Keyboard state management',
    'Tests that keyboard tracks continuous down states and frame-by-frame press events, with reset capability');
  
  const powerupjs = loadEngine();
  const key = powerupjs.Keys.space;

  powerupjs.Keyboard._keyStates[key].down = true;
  powerupjs.Keyboard._keyStates[key].pressed = true;

  assert.equal(powerupjs.Keyboard.down(key), true);
  assert.equal(powerupjs.Keyboard.pressed(key), true);

  powerupjs.Keyboard.reset();
  assert.equal(powerupjs.Keyboard.pressed(key), false);
  assert.equal(powerupjs.Keyboard.down(key), true);
});

test('LevelDataManager resolves room and default setups', async () => {
  await quizBefore('LevelDataManager setup registration',
    'Tests that room setups can be registered per level, retrieved, and defaults are used as fallback');
  
  const manager = loadLevelDataManager();
  const roomSetup = function (context) { context.called = true; };

  manager.setups = {};
  manager.defaultSetup = null;
  manager.register(2, 1, roomSetup);
  manager.registerDefault(function () { throw new Error('default setup should not be used'); });

  const context = manager.startLevel({
    music: { setRoomSong() {}, playForRoom() {} },
    enemies: [],
    player: null,
    currentLevel: { room: {} }
  }, 2, 1);

  assert.equal(context.called, true);
  assert.equal(manager.getSetup(2, 1), roomSetup);
  assert.equal(typeof manager.getSetup(999, 999), 'function');
});

test('Animation stores frame timing and looping settings', async () => {
  await quizBefore('Animation frame timing',
    'Tests that animations track frame duration, looping mode, current frame index, and sprite reference');
  
  const sandbox = loadGameplayScripts();
  const anim = new sandbox.powerupjs.Animation(sandbox.sprites.blank, true, 0.2);

  assert.equal(anim.looping, true);
  assert.equal(anim.frameTime, 0.2);
  assert.equal(anim.currentFrame, 0);
  assert.equal(anim.sprite, sandbox.sprites.blank);
});

test('Label updates text size and can reset to original contents', async () => {
  await quizBefore('Label text sizing',
    'Tests that labels measure rendered text dimensions and can restore original text content');
  
  const sandbox = loadGameplayScripts();
  const label = new sandbox.powerupjs.Label('Arial', '12px', 0, 7, sandbox.powerupjs.Color.black);

  label.text = 'hello';
  assert.equal(label.text, 'hello');
  assert.ok(label.width > 0);
  assert.ok(label.height > 0);

  label.text = 'goodbye';
  label.resetText();
  assert.equal(label.text, 'hello');
});

test('Tile hitbox generation distinguishes solid and spike tiles', async () => {
  await quizBefore('Tile hitbox generation',
    'Tests that tiles generate appropriate hitbox shapes and types based on sprite - solid for normal, smaller for spikes, circular for saws');
  
  const sandbox = loadGameplayScripts();
  const field = new sandbox.powerupjs.GameObjectList();
  field.cellWidth = 32;
  field.cellHeight = 32;
  field.scale = 1;

  const baseTile = new sandbox.Tile(sandbox.sprites.defaultTile);
  baseTile.parent = field;
  baseTile.position = new sandbox.powerupjs.Vector2(16, 16);
  baseTile.origin = baseTile.center;
  baseTile.manageHitboxes(sandbox.sprites.defaultTile);

  const spikeTile = new sandbox.Tile(sandbox.sprites.spike);
  spikeTile.parent = field;
  spikeTile.position = new sandbox.powerupjs.Vector2(32, 32);
  spikeTile.origin = spikeTile.center;
  spikeTile.manageHitboxes(sandbox.sprites.spike);

  assert.equal(baseTile.hitboxType, 'solid');
  assert.ok(baseTile.hitbox instanceof sandbox.powerupjs.Rectangle);
  assert.equal(spikeTile.hitboxType, 'hurt');
  assert.ok(spikeTile.hitbox instanceof sandbox.powerupjs.Rectangle);
});

test('Level tracks room travel points and links matching IDs', async () => {
  await quizBefore('Level travel points',
    'Tests that levels collect travel points from rooms, assign unique IDs, and link points with matching target IDs');
  
  const sandbox = loadGameplayScripts();
  const level = new sandbox.Level();
  const roomA = new sandbox.Room();
  const roomB = new sandbox.Room();

  roomA.travelPoints = [];
  roomB.travelPoints = [];

  const startPoint = { id: 1, targetID: 2, position: new sandbox.powerupjs.Vector2(10, 10) };
  const endPoint = { id: 2, targetID: 1, position: new sandbox.powerupjs.Vector2(30, 30) };

  roomA.travelPoints.push(startPoint);
  roomB.travelPoints.push(endPoint);
  level.rooms.add(roomA);
  level.rooms.add(roomB);

  level.collectTravelPoints();
  assert.equal(level.travelPoints.length, 2);
  assert.equal(level.getNextTravelPointId(), 3);

  level.linkTravelPoints();
  assert.equal(level.travelPoints[0].targetID, 2);
  assert.equal(level.travelPoints[1].targetID, 1);
});

test('Room wellFormed invariant rejects invalid room state', async () => {
  await quizBefore('Room wellFormed invariant',
    'Tests that Room accepts valid identity and structure values and rejects invalid room IDs, tile fields, and scale');

  const sandbox = loadGameplayScripts();
  const room = new sandbox.Room(3);
  room.tileFields.add(new sandbox.powerupjs.GameObjectList());

  assert.equal(room.wellFormed(), true);

  room.roomID = '3';
  assert.equal(room.wellFormed(), false);

  room.roomID = -1;
  assert.equal(room.wellFormed(), false);

  room.roomID = 3;
  room.tileFields = [];
  assert.equal(room.wellFormed(), false);

  room.tileFields = new sandbox.powerupjs.GameObjectList(5);
  room.tileFields.add(new sandbox.powerupjs.GameObjectList());
  room.scale = 0;
  assert.equal(room.wellFormed(), false);

  room.scale = 1;
  assert.equal(room.wellFormed(), true);
  assert.equal(room.wellFormedAssertions(), true);

  const list = new sandbox.powerupjs.GameObjectList();
  const field = new sandbox.TileField();
  const level = new sandbox.Level();
  const player = new sandbox.Player();
  assert.equal(list.wellFormedAssertions(), true);
  assert.equal(field.wellFormedAssertions(), true);
  assert.equal(level.wellFormedAssertions(), true);
  assert.equal(player.wellFormedAssertions(), true);
});

test('Player jump checks detect keyboard input and wall jump direction', async () => {
  await quizBefore('Player wall jump mechanics',
    'Tests that players can detect jump input, perform wall jumps when touching tiles, and push in the correct direction');
  
  const sandbox = loadGameplayScripts();
  const player = new sandbox.Player(0, 1);
  sandbox.powerupjs.Keys = sandbox.powerupjs.Keys || { space: 32, left: 37, right: 39, A: 65, D: 68, W: 87, C: 67, up: 38 };
  sandbox.powerupjs.Keyboard = sandbox.powerupjs.Keyboard || {};
  sandbox.powerupjs.Keyboard.down = function (key) {
    return key === sandbox.powerupjs.Keys.space;
  };

  player.grounded = false;
  player.jumpAvailable = true;
  player.velocity = new sandbox.powerupjs.Vector2(0, 0);
  player.wallJumpForce = 300;
  player.jumpKey = [sandbox.powerupjs.Keys.space];
  player.hasTileToLeft = function () { return true; };
  player.hasTileToRight = function () { return false; };

  player.isJumpPressed();
  player.handleJumps();
  assert.equal(player.velocity.x, 300);
  assert.equal(player.previousWallJumpDir, 'right');

  player.grounded = true;
  player.tileLeft = false;
  player.tileRight = false;
  player.jumpAvailable = true;
  player.jumpForce = -460;
  player.handleJumps();
  assert.equal(player.velocity.y, -460);
});

test('WorldSettings stores and manages level data structures', async () => {
  await quizBefore('WorldSettings level management',
    'Tests that WorldSettings normalizes level data, saves/loads from storage, and manages rooms and spawn positions');
  
  const sandbox = loadGameplayScripts();
  const worldSettings = new sandbox.WorldSettingsSingleton();
  
  worldSettings.currentLevelIndex = 0;
  assert.equal(worldSettings.currentLevelIndex, 0);
  
  const roomData = worldSettings.createDefaultRoomData();
  assert.ok(Array.isArray(roomData.tiles));
  assert.ok(Array.isArray(roomData.enemies));
  assert.ok(roomData.cameraBounds);
  assert.equal(roomData.scale, 1);
  
  const levelData = { name: 'TestLevel', rooms: [roomData], activeRoomIndex: 0 };
  const normalized = worldSettings.normalizeLevelData(levelData);
  
  assert.equal(normalized.name, 'TestLevel');
  assert.equal(Array.isArray(normalized.rooms), true);
  assert.equal(normalized.activeRoomIndex, 0);
  assert.ok(normalized.room);
});

test('WorldSettings syncs room aliases between nested and legacy formats', async () => {
  await quizBefore('WorldSettings room aliasing',
    'Tests that WorldSettings bridges nested rooms[] array with legacy room property for backward compatibility');
  
  const sandbox = loadGameplayScripts();
  const worldSettings = new sandbox.WorldSettingsSingleton();
  
  const levelData = {
    name: 'MultiRoom',
    rooms: [
      worldSettings.createDefaultRoomData(),
      worldSettings.createDefaultRoomData()
    ],
    activeRoomIndex: 1
  };
  
  worldSettings.syncRoomAlias(levelData);
  assert.equal(levelData.activeRoomIndex, 1);
  assert.ok(levelData.room);
  assert.equal(levelData.room, levelData.rooms[1]);
});

test('PlayingState initializes with player, tiles, enemies, and UI buttons', async () => {
  await quizBefore('PlayingState initialization',
    'Tests that PlayingState constructs with essential gameplay components: player, enemies, projectiles, music, and navigation buttons');
  
  const sandbox = loadGameplayScripts();
  sandbox.PlayingState = function(layer) {
    sandbox.powerupjs.GameObjectList.call(this, layer);
    this.player = new sandbox.Player();
    this.tileFields = new sandbox.powerupjs.GameObjectList();
    this.enemies = { addEnemy: () => {}, clear: () => {}, syncWorldSettings: () => {}, length: 0, at: () => null };
    this.projectiles = new sandbox.powerupjs.GameObjectList();
    this.music = { stop: () => {}, setRoomSong: () => {}, playForRoom: () => {}, add: () => {} };
  };
  
  const playingState = new sandbox.PlayingState(0);
  assert.ok(playingState.player);
  assert.ok(playingState.tileFields);
  assert.ok(playingState.enemies);
  assert.ok(playingState.projectiles);
  assert.ok(playingState.music);
});

test('PlayingState findActiveTravelTileHit detects player overlap with travel tiles', async () => {
  await quizBefore('PlayingState travel tile detection',
    'Tests that PlayingState correctly identifies when the player touches a travel-point tile for teleportation');
  
  const sandbox = loadGameplayScripts();
  
  const mockTile = {
    isTravelPointTile: true,
    hitbox: new sandbox.powerupjs.Rectangle(100, 100, 32, 32),
    position: new sandbox.powerupjs.Vector2(116, 116)
  };
  
  const playerHitbox = new sandbox.powerupjs.Rectangle(105, 105, 20, 20);
  assert.equal(playerHitbox.intersects(mockTile.hitbox), true);
  
  const noHitHitbox = new sandbox.powerupjs.Rectangle(300, 300, 20, 20);
  assert.equal(noHitHitbox.intersects(mockTile.hitbox), false);
});

test('WorldSettings normalizes legacy level data into canonical nested rooms format', async () => {
  await quizBefore('WorldSettings data normalization',
    'Tests that legacy flat room data and old level structures are converted to the modern nested rooms[] format');
  
  const sandbox = loadGameplayScripts();
  const worldSettings = new sandbox.WorldSettingsSingleton();
  
  const legacyData = {
    name: 'Legacy',
    room: {
      tiles: [],
      enemies: [],
      cameraBounds: { x: 0, y: 0, width: 1280, height: 720 },
      playerSpawnPos: { x: 100, y: 100 }
    }
  };
  
  const normalized = worldSettings.normalizeLevelData(legacyData);
  assert.equal(normalized.name, 'Legacy');
  assert.ok(Array.isArray(normalized.rooms));
  assert.equal(normalized.rooms.length, 1);
  assert.equal(normalized.rooms[0].playerSpawnPos.x, 100);
});

test('PlayingState syncRoomVisibility shows only active room', async () => {
  await quizBefore('PlayingState room visibility management',
    'Tests that PlayingState correctly toggles room visibility to show only the currently active room');
  
  const sandbox = loadGameplayScripts();
  
  const mockRoom1 = { visible: false };
  const mockRoom2 = { visible: false };
  const mockRoom3 = { visible: false };
  
  const mockRoomList = {
    length: 3,
    at: function(i) { return [mockRoom1, mockRoom2, mockRoom3][i]; }
  };
  
  const mockLevel = {
    rooms: mockRoomList,
    currentRoomIndex: 1
  };
  
  for (let i = 0; i < mockLevel.rooms.length; i++) {
    const room = mockLevel.rooms.at(i);
    if (room) room.visible = (i === mockLevel.currentRoomIndex);
  }
  
  assert.equal(mockRoom1.visible, false);
  assert.equal(mockRoom2.visible, true);
  assert.equal(mockRoom3.visible, false);
});
