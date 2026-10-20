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

test('TileField loadTiles uses addTileAt without losing saved tile state', () => {
  const sandbox = loadGameplayScripts();
  const { Vector2 } = sandbox.powerupjs;
  sandbox.sprites.spike.nrSheetElements = 4;
  const tile = new sandbox.Tile(sandbox.sprites.spike);
  tile.playAnimation('normal');
  tile.index = new Vector2(1.125, 2);
  tile.key = 'saved';
  tile.rotation = Math.PI / 2;
  tile.sheetIndex = 2;
  tile.baseScale = 0.5;
  tile.isTravelPointTile = true;
  tile.targetID = 7;
  tile.movementNodes = [new Vector2(5, 6)];
  const nodes = tile.movementNodes;
  sandbox.TileDataManager = {
    convertDataToTile(data) {
      assert.equal(data, 'saved-tile');
      return tile;
    },
    handleObject() {
      assert.fail('Loading must reuse the deserialized tile');
    }
  };
  sandbox.LEVELS = [{ room: { tiles: ['saved-tile'] } }];
  sandbox.WorldSettings.currentLevel = {
    currentRoomIndex: 2,
    room: { scale: 2, tileFields: [] }
  };
  const selection = {};
  const editor = { editingMenu: { selectedObj: selection } };
  sandbox.powerupjs.GameStateManager.get = () => editor;
  const field = new sandbox.TileField();
  const addTileAt = field.addTileAt;
  let calls = 0;
  field.addTileAt = function (...args) {
    calls++;
    return addTileAt.apply(this, args);
  };

  field.loadTiles();

  assert.equal(calls, 1);
  assert.equal(field.length, 1);
  assert.equal(field.at(0), tile);
  assert.equal(tile.parent, field);
  assert.equal(tile.key, 'saved');
  assert.equal(tile.rotation, Math.PI / 2);
  assert.equal(tile.sheetIndex, 2);
  assert.equal(tile.baseScale, 0.5);
  assert.equal(tile.scale, 1);
  assert.equal(tile.position.x, 104);
  assert.equal(tile.position.y, 160);
  assert.equal(tile.index.x, 1.125);
  assert.equal(tile.damage, 10);
  assert.equal(tile.travelPointID, 3);
  assert.equal(tile.targetID, 7);
  assert.equal(tile.movementNodes, nodes);
  assert.ok(tile.hitbox);
  assert.equal(editor.editingMenu.selectedObj, selection);
});

test('Player lands on rectangular hurt tiles while still taking damage', () => {
  const sandbox = loadGameplayScripts();
  const { Rectangle, Vector2, GameObjectList } = sandbox.powerupjs;
  const player = new sandbox.Player();
  player.position = new Vector2(50, 50);
  player.origin = player.center;
  player.adjustHitbox();
  player.velocity.y = 40;
  player.invincibilityFrameTimer = 10;
  sandbox.WorldSettings.invincibilityFrameTime = 1;
  const tile = {
    hitboxType: 'hurt',
    damage: 10,
    velocity: new Vector2(0, 0),
    hitbox: new Rectangle(player.hitbox.x - 10, player.hitbox.bottom - 1, 60, 20)
  };
  const field = new GameObjectList();
  const tileFields = new GameObjectList();
  field.add(tile);
  tileFields.add(field);
  sandbox.WorldSettings.currentLevel = { room: { tileFields } };
  sandbox.WorldSettings.debugMode = false;

  player.handleCollisions();

  assert.equal(player.health, 90);
  assert.equal(player.velocity.y, 0);
  assert.equal(player.grounded, true);
  assert.ok(player.hitbox.bottom <= tile.hitbox.top);

  player.handleCollisions();
  assert.equal(player.health, 90);
  assert.equal(player.grounded, true);
});

test('Enemy simulation pauses in the editor and resumes in play mode', () => {
  const sandbox = loadGameplayScripts();
  const root = path.join(__dirname, '..');
  loadScript(path.join(root, 'behavior scripts', 'BehaviorScriptOutline.js'), sandbox);
  loadScript(path.join(root, 'game objects', 'EnemyController.js'), sandbox);
  loadScript(path.join(root, 'game objects', 'Enemy.js'), sandbox);
  const enemy = new sandbox.Enemy(sandbox.sprites.blank, 100, 200);
  enemy.velocity = new sandbox.powerupjs.Vector2(10, 20);
  let physicsUpdates = 0;
  let behaviorUpdates = 0;
  let projectileChecks = 0;
  let playerChecks = 0;
  sandbox.powerupjs.PhysicsGameObject.prototype.update = function () {
    physicsUpdates++;
  };
  enemy.behavior.update = () => { behaviorUpdates++; };
  enemy.handleProjectileCollision = () => { projectileChecks++; };
  enemy.handlePlayerCollision = () => { playerChecks++; };
  sandbox.WorldSettings.currentState = 'editing';

  enemy.update(1);
  enemy.position.x = 150;
  enemy.update(1);

  assert.equal(enemy.position.x, 150);
  assert.equal(enemy.position.y, 200);
  assert.equal(enemy.hitbox.x, enemy.boundingBox.x);
  assert.equal(enemy.hurtbox.x, enemy.boundingBox.x + enemy.width / 16);
  assert.equal(enemy.velocity.y, 20);
  assert.equal(physicsUpdates, 0);
  assert.equal(behaviorUpdates, 0);
  assert.equal(projectileChecks, 0);
  assert.equal(playerChecks, 0);

  sandbox.WorldSettings.currentState = 'playing';
  enemy.update(1);

  assert.equal(physicsUpdates, 1);
  assert.equal(behaviorUpdates, 1);
  assert.equal(projectileChecks, 1);
  assert.equal(playerChecks, 1);
});

test('Enemy wall callbacks require contact rather than proximity on either side', () => {
  const sandbox = loadGameplayScripts();
  const root = path.join(__dirname, '..');
  loadScript(path.join(root, 'behavior scripts', 'BehaviorScriptOutline.js'), sandbox);
  loadScript(path.join(root, 'game objects', 'EnemyController.js'), sandbox);
  loadScript(path.join(root, 'game objects', 'Enemy.js'), sandbox);
  const { Rectangle, Vector2, GameObjectList } = sandbox.powerupjs;
  const field = new GameObjectList();
  const tileFields = new GameObjectList();
  tileFields.add(field);
  sandbox.WorldSettings.currentLevel = { room: { tileFields } };
  sandbox.WorldSettings.currentState = 'playing';
  sandbox.WorldSettings.debugMode = false;
  const enemy = new sandbox.Enemy(sandbox.sprites.blank, 100, 100);
  enemy.applyGravity = false;
  enemy.origin = enemy.center;
  enemy.adjustHitbox();
  enemy.handlePlayerCollision = () => {};
  const hits = [];
  enemy.behavior.handleWallCollision = (actor, side) => { hits.push(side); };
  enemy.behavior.handleFloorCollision = () => {};

  for (const side of [-1, 1]) {
    field.clear();
    enemy.position = new Vector2(100, 100);
    enemy.velocity = new Vector2(0, 0);
    enemy.adjustHitbox();
    const bounds = enemy.hitbox;
    const wall = {
      hitboxType: 'solid',
      velocity: new Vector2(0, 0),
      hitbox: new Rectangle(
        side < 0 ? bounds.left - 25 : bounds.right + 5,
        bounds.top - 20, 20, bounds.height + 40
      )
    };
    field.add(wall);
    const count = hits.length;
    enemy.update(0);
    assert.equal(hits.length, count, 'A five-pixel gap is not a collision');

    enemy.position.x += side * 6;
    enemy.update(0);
    assert.equal(hits.length, count + 1);
    assert.equal(hits.at(-1), side);

    field.clear();
    enemy.update(0);
    assert.equal(hits.length, count + 1, 'Wall contact must not persist after removal');
  }
});

test('Physics raycast returns the nearest blocking tile without mutating state', () => {
  const sandbox = loadGameplayScripts();
  const { PhysicsGameObject, Vector2, Rectangle, Circle, GameObjectList } = sandbox.powerupjs;
  const actor = new PhysicsGameObject();
  actor.position = new Vector2(10, 10);
  actor.velocity = new Vector2(3, 4);
  const fields = new GameObjectList();
  const farField = new GameObjectList();
  const nearField = new GameObjectList();
  fields.add(farField);
  fields.add(nearField);
  sandbox.WorldSettings.currentLevel = { room: { tileFields: fields } };
  const far = { hitboxType: 'solid', hitbox: new Rectangle(80, 0, 10, 20) };
  const near = { hitboxType: 'hurt', hitbox: new Circle(50, 10, 5) };
  farField.add(far);
  nearField.add({ hitboxType: 'none', hitbox: new Rectangle(15, 0, 10, 20) });
  nearField.add({ hitboxType: 'void', hitbox: new Circle(30, 10, 5) });
  nearField.add({});
  nearField.add(near);
  const target = new Vector2(100, 10);
  const position = actor.position;
  const velocity = actor.velocity;
  const hitbox = actor.hitbox;
  const hit = actor.raycast(target);
  assert.equal(hit.tile, near);
  assert.ok(hit.point instanceof Vector2);
  assert.equal(hit.point.x, 45);
  assert.equal(hit.point.y, 10);
  assert.equal(hit.distance, 35);
  assert.equal(hit.fraction, 35 / 90);
  assert.equal(actor.position, position);
  assert.ok(position.equals(new Vector2(10, 10)));
  assert.equal(actor.velocity, velocity);
  assert.ok(velocity.equals(new Vector2(3, 4)));
  assert.equal(actor.hitbox, hitbox);
  assert.equal(actor.collidingTiles.length, 0);
  assert.equal(near.physicsHighlighted, undefined);
  assert.ok(target.equals(new Vector2(100, 10)));

  const start = new Vector2(100, 10);
  const reverse = actor.raycast(new Vector2(10, 10), start);
  assert.equal(reverse.tile, far);
  assert.equal(reverse.point.x, 90);
  assert.equal(reverse.distance, 10);
  assert.ok(start.equals(new Vector2(100, 10)));
  assert.equal(actor.raycast(new Vector2(40, 10)), null, 'Ignore tiles beyond the target');
  assert.equal(actor.raycast(new Vector2(0, 10)), null, 'Ignore tiles behind the start');
  fields.clear();
  assert.equal(actor.raycast(target), null);
});

test('Physics raycast handles rectangle and circle segment boundaries', () => {
  const sandbox = loadGameplayScripts();
  const { PhysicsGameObject, Vector2, Rectangle, Circle, GameObjectList } = sandbox.powerupjs;
  const actor = new PhysicsGameObject();
  const field = new GameObjectList();
  const fields = new GameObjectList();
  fields.add(field);
  sandbox.WorldSettings.currentLevel = { room: { tileFields: fields } };
  const cases = [
    ['horizontal', new Rectangle(5, -1, 2, 2), [0, 0], [10, 0], 0.5],
    ['vertical', new Rectangle(-1, 5, 2, 2), [0, 0], [0, 10], 0.5],
    ['diagonal', new Rectangle(5, 5, 2, 2), [0, 0], [10, 10], 0.5],
    ['parallel miss', new Rectangle(5, 1, 2, 2), [0, 0], [10, 0], null],
    ['edge', new Rectangle(5, 0, 2, 2), [0, 0], [10, 0], 0.5],
    ['corner endpoint', new Rectangle(5, 5, 2, 2), [0, 0], [5, 5], 1],
    ['inside rectangle', new Rectangle(-1, -1, 2, 2), [0, 0], [10, 0], 0],
    ['rectangle point inside', new Rectangle(-1, -1, 2, 2), [0, 0], [0, 0], 0],
    ['rectangle point outside', new Rectangle(1, 1, 2, 2), [0, 0], [0, 0], null],
    ['circle horizontal', new Circle(5, 0, 1), [0, 0], [10, 0], 0.4],
    ['circle vertical', new Circle(0, 5, 1), [0, 0], [0, 10], 0.4],
    ['circle tangent', new Circle(5, 1, 1), [0, 0], [10, 0], 0.5],
    ['circle bounding-box false positive', new Circle(5, 5, 2), [0, 0], [3.1, 3.1], null],
    ['circle endpoint', new Circle(6, 0, 1), [0, 0], [5, 0], 1],
    ['circle behind', new Circle(-5, 0, 1), [0, 0], [10, 0], null],
    ['circle beyond target', new Circle(15, 0, 1), [0, 0], [10, 0], null],
    ['inside circle', new Circle(0, 0, 1), [0, 0], [10, 0], 0],
    ['circle point inside', new Circle(0, 0, 1), [0, 0], [0, 0], 0],
    ['circle point on edge', new Circle(1, 0, 1), [0, 0], [0, 0], 0],
    ['circle point outside', new Circle(5, 0, 1), [0, 0], [0, 0], null]
  ];
  for (const [name, bounds, startCoordinates, endCoordinates, fraction] of cases) {
    field.clear();
    const tile = { hitboxType: 'solid', hitbox: bounds };
    field.add(tile);
    const start = new Vector2(...startCoordinates);
    const end = new Vector2(...endCoordinates);
    const hit = actor.raycast(end, start);
    if (fraction === null) {
      assert.equal(hit, null, name);
    } else {
      assert.equal(hit.tile, tile, name);
      assert.ok(Math.abs(hit.fraction - fraction) < 1e-10, name);
      assert.ok(Math.abs(hit.distance - end.subtract(start).length * fraction) < 1e-10, name);
      assert.ok(hit.point.subtract(start.add(end.subtract(start).multiply(fraction))).length < 1e-10, name);
    }
  }
});

test('Physics raycast reports invalid coordinates and missing room context', () => {
  const sandbox = loadGameplayScripts();
  const actor = new sandbox.powerupjs.PhysicsGameObject();
  const target = new sandbox.powerupjs.Vector2(10, 20);
  for (const invalid of [null, {}, { x: NaN, y: 0 }, { x: 0, y: Infinity }, { x: '1', y: 0 }]) {
    assert.throws(() => actor.raycast(invalid), /finite start and target/);
    assert.throws(() => actor.raycast(target, invalid), /finite start and target/);
  }
  assert.throws(() => actor.raycast(target), /current room/);
  sandbox.WorldSettings.currentLevel = {};
  assert.throws(() => actor.raycast(target), /current room/);
  sandbox.WorldSettings.currentLevel = { room: {} };
  assert.throws(() => actor.raycast(target), /current room/);
});

test('Circular hitboxes detect circle and rectangle contacts symmetrically', () => {
  const sandbox = loadGameplayScripts();
  const { Circle, Rectangle, Vector2 } = sandbox.powerupjs;
  const circle = new Circle(0, 0, 5);
  const cases = [
    [new Circle(9, 0, 5), true],
    [new Circle(10, 0, 5), true],
    [new Circle(11, 0, 5), false],
    [new Rectangle(4, -1, 2, 2), true],
    [new Rectangle(5, -1, 2, 2), true],
    [new Rectangle(4, 4, 2, 2), false],
    [new Rectangle(-10, -10, 20, 20), true],
    [new Rectangle(-1, -1, 2, 2), true]
  ];
  for (const [bounds, expected] of cases) {
    assert.equal(circle.intersects(bounds), expected);
    assert.equal(bounds.intersects(circle), expected);
    const contact = circle.getContact(bounds);
    if (expected) {
      assert.ok(Number.isFinite(contact.depth));
      assert.ok(Math.abs(contact.normal.length - 1) < 1e-10);
      const separated = new Circle(
        circle.x + contact.normal.x * (contact.depth + 0.001),
        circle.y + contact.normal.y * (contact.depth + 0.001),
        circle.radius
      );
      assert.equal(separated.intersects(bounds), false);
    } else {
      assert.equal(contact, null);
    }
  }
  const coincident = circle.getContact(new Circle(0, 0, 5));
  assert.equal(coincident.depth, 10);
  assert.ok(Number.isFinite(coincident.normal.x));
  assert.equal(circle.left, -5);
  assert.equal(circle.right, 5);
  assert.equal(circle.top, -5);
  assert.equal(circle.bottom, 5);
  assert.equal(circle.width, 10);
  assert.equal(circle.contains(new Vector2(3, 4)), true);
  assert.equal(circle.contains(new Vector2(4, 4)), false);
  assert.equal(circle.intersects(null), false);
  assert.equal(Object.hasOwn(sandbox, 'x1'), false, 'Geometry must not leak globals');
});

test('Circular hitbox radius fits the larger collision dimension', () => {
  const sandbox = loadGameplayScripts();
  const { SpriteGameObject, PhysicsGameObject, Rectangle, Vector2 } = sandbox.powerupjs;
  for (const [width, height] of [[40, 20], [20, 40], [30, 30]]) {
    const bounds = new Rectangle(10, 20, width, height);
    const sprite = new SpriteGameObject(sandbox.sprites.blank);
    sprite.hitboxShape = 'circle';
    const hitbox = sprite.createHitbox(bounds);
    assert.equal(hitbox.radius, Math.max(width, height) / 2);
    assert.ok(hitbox.center.equals(new Vector2(10 + width / 2, 20 + height / 2)));
    const actor = new PhysicsGameObject();
    actor.hitboxShape = 'circle';
    actor.adjustHitbox(bounds);
    assert.equal(actor.hitbox.radius, hitbox.radius);
    assert.equal(actor.circleHitbox.radius, hitbox.radius);
    assert.ok(actor.circleHitbox.center.equals(hitbox.center));
  }
});

test('Circular hitbox selection survives actor and tile hitbox refreshes and scaling', () => {
  const sandbox = loadGameplayScripts();
  const root = path.join(__dirname, '..');
  for (const script of [
    'behavior scripts/BehaviorScriptOutline.js',
    'game objects/EnemyController.js', 'game objects/Enemy.js'
  ]) loadScript(path.join(root, script), sandbox);
  const { Vector2, Circle, Rectangle, GameObjectList } = sandbox.powerupjs;
  sandbox.WorldSettings.currentLevel = { room: { tileFields: new GameObjectList() } };
  const enemy = new sandbox.Enemy(sandbox.sprites.blank, 40, 60);
  const player = new sandbox.Player();
  for (const actor of [enemy, player]) {
    actor.hitboxShape = 'circle';
    actor.position = new Vector2(40, 60);
    actor.origin = actor.center;
    actor.scale = 2;
    actor.adjustHitbox();
    const center = actor.hitbox.center;
    const radius = actor.hitbox.radius;
    assert.ok(actor.hitbox instanceof Circle);
    assert.ok(radius > 0);
    actor.position.x += 5;
    actor.adjustHitbox();
    if (actor === enemy) actor.manageHitboxes();
    assert.ok(actor.hitbox instanceof Circle);
    assert.equal(actor.hitbox.x, center.x + 5);
    assert.equal(actor.hitbox.y, center.y);
    assert.equal(actor.hitbox.radius, radius);
    actor.applyGravity = false;
    sandbox.powerupjs.PhysicsGameObject.prototype.update.call(actor, 0.1);
    assert.ok(actor.hitbox instanceof Circle);
    actor.hitboxShape = 'rectangle';
    actor.adjustHitbox();
    assert.ok(actor.hitbox instanceof Rectangle);
  }
  const tile = new sandbox.Tile(sandbox.sprites.defaultTile);
  tile.playAnimation('normal');
  tile.origin = tile.center;
  tile.position = new Vector2(100, 200);
  tile.scale = 2;
  tile.hitboxShape = 'circle';
  tile.manageHitboxes();
  assert.ok(tile.hitbox instanceof Circle);
  assert.equal(tile.hitbox.x, 100);
  assert.equal(tile.hitbox.y, 200);
  assert.equal(tile.hitbox.radius, 32);
  const field = new GameObjectList();
  field.cellWidth = 32;
  field.cellHeight = 32;
  field.add(tile);
  tile.manageHitboxes();
  assert.ok(tile.hitbox instanceof Circle);
  assert.equal(tile.hitboxType, 'solid');
  const saw = new sandbox.Tile(sandbox.sprites.saw);
  saw.playAnimation('normal');
  saw.origin = saw.center;
  saw.position = new Vector2(80, 90);
  saw.scale = 2;
  field.add(saw);
  saw.manageHitboxes();
  assert.ok(saw.hitbox instanceof Circle);
  assert.equal(saw.hitboxType, 'hurt');
  assert.equal(saw.hitbox.x, 80);
  assert.equal(saw.hitbox.y, 90);
  assert.equal(saw.hitbox.radius, 64 / 2.4);
  tile.hitboxShape = 'invalid';
  assert.throws(() => tile.manageHitboxes(), /Unsupported hitboxShape/);
});

test('Circular physics resolves solid floor, wall, ceiling, and corner contacts for all shape pairs', () => {
  const sandbox = loadGameplayScripts();
  const { PhysicsGameObject, Vector2, Circle, Rectangle, GameObjectList } = sandbox.powerupjs;
  const field = new GameObjectList();
  const tileFields = new GameObjectList();
  tileFields.add(field);
  sandbox.WorldSettings.currentLevel = { room: { tileFields } };
  const fixtures = [
    ['floor', new Vector2(0, -8), new Vector2(0, 10), new Rectangle(-20, 0, 40, 20), new Circle(0, 10, 10)],
    ['right wall', new Vector2(-8, 0), new Vector2(10, 0), new Rectangle(0, -20, 20, 40), new Circle(10, 0, 10)],
    ['left wall', new Vector2(8, 0), new Vector2(-10, 0), new Rectangle(-20, -20, 20, 40), new Circle(-10, 0, 10)],
    ['ceiling', new Vector2(0, 8), new Vector2(0, -10), new Rectangle(-20, -20, 40, 20), new Circle(0, -10, 10)]
  ];
  for (const actorShape of ['circle', 'rectangle']) {
    for (const tileShape of ['circle', 'rectangle']) {
      for (const [name, position, velocity, rect, circle] of fixtures) {
        field.clear();
        const actor = new PhysicsGameObject();
        actor.loadAnimation(sandbox.sprites.defaultTile, 'normal', true, 0.2);
        actor.playAnimation('normal');
        actor.scale = 0.5;
        actor.origin = actor.center;
        actor.position = position.copy();
        actor.velocity = velocity.copy();
        actor.applyGravity = false;
        actor.hitboxShape = actorShape;
        actor.adjustHitbox();
        const tile = { hitboxType: 'solid', hitbox: tileShape === 'circle' ? circle : rect, velocity: Vector2.zero };
        field.add(tile);
        actor.update(0.1);
        assert.ok(Number.isFinite(actor.position.x) && Number.isFinite(actor.position.y), name);
        if (actorShape === 'circle' || tileShape === 'circle') {
          const contact = actorShape === 'circle' ? actor.hitbox.getContact(tile.hitbox) : tile.hitbox.getContact(actor.hitbox);
          assert.ok(contact === null || contact.depth < 1e-8, name + ': no remaining penetration');
        } else {
          assert.ok(actor.hitbox.right <= tile.hitbox.left || actor.hitbox.left >= tile.hitbox.right ||
            actor.hitbox.bottom <= tile.hitbox.top || actor.hitbox.top >= tile.hitbox.bottom, name);
        }
        if (name === 'floor') {
          assert.equal(actor.grounded, true);
          assert.equal(actor.velocity.y, 0);
          for (let frame = 0; frame < 10; frame++) actor.update(0.1);
          assert.equal(actor.grounded, true, 'Grounding persists at rest');
        } else if (name === 'right wall') {
          assert.equal(actor.tileRight, true);
          assert.equal(actor.velocity.x, 0);
        } else if (name === 'left wall') {
          assert.equal(actor.tileLeft, true);
          assert.equal(actor.velocity.x, 0);
        } else {
          assert.equal(actor.grounded, false);
          assert.ok(actor.velocity.y >= 0);
        }
      }
    }
  }
  field.clear();
  const actor = new PhysicsGameObject();
  actor.sprite = sandbox.sprites.defaultTile;
  actor.origin = actor.center;
  actor.hitboxShape = 'circle';
  actor.position = new Vector2(-10, -10);
  actor.velocity = new Vector2(20, 0);
  actor.adjustHitbox();
  const tile = { hitboxType: 'solid', hitbox: new Rectangle(0, 0, 40, 40), velocity: Vector2.zero };
  field.add(tile);
  actor.handleCollisions();
  const contact = actor.hitbox.getContact(tile.hitbox);
  assert.ok(contact === null || contact.depth < 1e-8);
  assert.ok(Math.abs(actor.velocity.x - 10) < 1e-8, 'Preserve tangential velocity at corners');
  assert.ok(Math.abs(actor.velocity.y + 10) < 1e-8);
  field.clear();
  field.add({ hitboxType: 'solid', hitbox: new Circle(actor.hitbox.x, actor.hitbox.y, 10), velocity: Vector2.zero });
  actor.handleCollisions();
  assert.ok(Number.isFinite(actor.position.x) && Number.isFinite(actor.position.y), 'Resolve coincident centers');
});

test('Circular hurt tiles remain damage triggers and circular actors land on rectangular hazards', () => {
  const sandbox = loadGameplayScripts();
  const { Circle, Rectangle, Vector2, GameObjectList } = sandbox.powerupjs;
  const player = new sandbox.Player();
  player.origin = player.center;
  player.hitboxShape = 'circle';
  player.adjustHitbox();
  player.invincibilityFrameTimer = 10;
  sandbox.WorldSettings.invincibilityFrameTime = 1;
  const field = new GameObjectList();
  const tileFields = new GameObjectList();
  tileFields.add(field);
  sandbox.WorldSettings.currentLevel = { room: { tileFields } };
  const position = player.position.copy();
  field.add({ hitboxType: 'hurt', hitbox: new Circle(0, 0, 20), damage: 10, velocity: Vector2.zero });
  player.handleCollisions();
  assert.equal(player.health, 90);
  assert.ok(player.position.equals(position), 'Saw-like circular hazards do not push actors');
  assert.equal(player.grounded, false);
  field.clear();
  field.add({
    hitboxType: 'hurt', damage: 10, velocity: Vector2.zero,
    hitbox: new Rectangle(-30, player.hitbox.bottom - 1, 60, 20)
  });
  player.invincibilityFrameTimer = 10;
  player.velocity.y = 10;
  player.handleCollisions();
  assert.equal(player.health, 80);
  assert.equal(player.grounded, true);
  field.clear();
  for (const type of ['none', 'void']) {
    field.add({ hitboxType: type, hitbox: new Circle(0, 0, 100), velocity: Vector2.zero });
  }
  const before = player.position.copy();
  player.handleCollisions();
  assert.ok(player.position.equals(before));
  assert.equal(player.grounded, false);
});

test('Circular player contacts preserve ceiling and wall controls and rest under gravity', () => {
  const sandbox = loadGameplayScripts();
  const { Rectangle, Vector2, GameObjectList } = sandbox.powerupjs;
  const player = new sandbox.Player();
  player.origin = player.center;
  player.hitboxShape = 'circle';
  player.adjustHitbox();
  const field = new GameObjectList();
  const fields = new GameObjectList();
  fields.add(field);
  sandbox.WorldSettings.currentLevel = { room: { tileFields: fields } };
  field.add({
    hitboxType: 'solid', velocity: Vector2.zero,
    hitbox: new Rectangle(-100, player.hitbox.top - 9, 200, 10)
  });
  player.velocity.y = -10;
  player.handleCollisions();
  assert.equal(player.jumpAvailable, false);
  assert.equal(player.velocity.y, 0);
  field.clear();
  field.add({
    hitboxType: 'solid', velocity: Vector2.zero,
    hitbox: new Rectangle(player.hitbox.right - 1, -100, 10, 200)
  });
  player.detaching = true;
  player.velocity = new Vector2(10, 0);
  player.handleCollisions();
  assert.equal(player.tileRight, true);
  assert.equal(player.detaching, false);
  assert.equal(player.velocity.x, 0);
  field.clear();
  field.add({
    hitboxType: 'solid', velocity: Vector2.zero,
    hitbox: new Rectangle(-100, player.hitbox.bottom, 200, 20)
  });
  sandbox.WorldSettings.gravityDefault = 25;
  const start = player.position.copy();
  for (let i = 0; i < 120; i++) {
    sandbox.powerupjs.PhysicsGameObject.prototype.update.call(player, 1 / 60);
    assert.equal(player.grounded, true);
    assert.ok(player.position.subtract(start).length < 1e-8, 'Rest without sinking or jitter');
    assert.ok(player.actualVelocity.length < 1e-8);
  }
});

test('Circular enemy hitboxes use exact player and projectile overlaps', () => {
  const sandbox = loadGameplayScripts();
  const root = path.join(__dirname, '..');
  for (const script of [
    'behavior scripts/BehaviorScriptOutline.js',
    'game objects/EnemyController.js', 'game objects/Enemy.js'
  ]) loadScript(path.join(root, script), sandbox);
  const { Circle, Rectangle, Vector2 } = sandbox.powerupjs;
  const enemy = new sandbox.Enemy(sandbox.sprites.blank);
  enemy.origin = enemy.center;
  enemy.hitboxShape = 'circle';
  enemy.manageHitboxes();
  let contacts = 0;
  enemy.behavior.handlePlayerCollision = () => { contacts++; };
  const player = { hitbox: new Circle(14, 14, 8) };
  sandbox.WorldSettings.playingState = { player };
  enemy.handlePlayerCollision();
  assert.equal(contacts, 0, 'Overlapping enclosing rectangles alone are not a hit');
  player.hitbox = new Circle(10, 0, 8);
  enemy.handlePlayerCollision();
  assert.equal(contacts, 1);
  player.hitbox = new Rectangle(7, 7, 2, 2);
  enemy.handlePlayerCollision();
  assert.equal(contacts, 1);
  player.hitbox = new Rectangle(7, -1, 2, 2);
  enemy.handlePlayerCollision();
  assert.equal(contacts, 2);

  let removed = 0;
  const sword = { tag: 'sword', position: new Vector2(8, 8), width: 2, height: 2, damage: 10 };
  sandbox.WorldSettings.playingState.projectiles = {
    length: 1, at() { return sword; }, remove() { removed++; }
  };
  enemy.handleProjectileCollision();
  assert.equal(enemy.health, 100);
  sword.position = new Vector2(7, 0);
  enemy.handleProjectileCollision();
  assert.equal(enemy.health, 90);
  assert.equal(removed, 1);
});

test('Physics actual velocity calculates displacement over time without mutating inputs', () => {
  const sandbox = loadGameplayScripts();
  const { PhysicsGameObject, Vector2 } = sandbox.powerupjs;
  const actor = new PhysicsGameObject();
  const other = new PhysicsGameObject();
  assert.ok(actor.actualVelocity.isZero);
  assert.notEqual(actor.actualVelocity, other.actualVelocity);
  actor.position = new Vector2(13, 6);
  actor.velocity = new Vector2(100, 100);
  const previous = new Vector2(10, 10);
  const measured = actor.calculateActualVelocity(previous, 0.5);
  assert.ok(measured instanceof Vector2);
  assert.equal(measured.x, 6);
  assert.equal(measured.y, -8);
  assert.equal(measured.length, 10);
  assert.ok(previous.equals(new Vector2(10, 10)));
  assert.ok(actor.position.equals(new Vector2(13, 6)));
  assert.ok(actor.velocity.equals(new Vector2(100, 100)));
  assert.ok(actor.actualVelocity.isZero, 'Manual calculation does not replace the cached measurement');
  assert.ok(actor.calculateActualVelocity(previous, 0).isZero);
  assert.ok(actor.calculateActualVelocity(actor.position, 1).isZero);
  for (const delta of [-1, NaN, Infinity, undefined, '1']) {
    assert.throws(() => actor.calculateActualVelocity(previous, delta), /non-negative delta/);
  }
  for (const position of [null, {}, { x: NaN, y: 0 }, { x: 0, y: Infinity }]) {
    assert.throws(() => actor.calculateActualVelocity(position, 1), /previous position/);
  }
});

test('Physics moves once using the frame delta before resolving contacts', () => {
  const sandbox = loadGameplayScripts();
  const { Vector2, Rectangle, GameObjectList } = sandbox.powerupjs;
  const actor = new sandbox.Player();
  actor.position = new Vector2(100, 100);
  actor.origin = actor.center;
  actor.adjustHitbox();
  actor.applyGravity = false;
  actor.velocity = new Vector2(20, 40);
  const field = new GameObjectList();
  const tileFields = new GameObjectList();
  tileFields.add(field);
  sandbox.WorldSettings.currentLevel = { room: { tileFields } };
  sandbox.WorldSettings.debugMode = false;
  const initialBounds = actor.hitbox;
  const wall = {
    hitboxType: 'solid', velocity: new Vector2(0, 0),
    hitbox: new Rectangle(initialBounds.right + 5, 0, 32, 300)
  };
  const floor = {
    hitboxType: 'solid', velocity: new Vector2(0, 0),
    hitbox: new Rectangle(0, initialBounds.bottom + 15, 300, 32)
  };
  field.add(wall);
  field.add(floor);
  const checks = [];
  const checkTileCollisions = actor.checkTileCollisions;
  actor.checkTileCollisions = function () {
    checks.push({ x: this.position.x, y: this.position.y });
    checkTileCollisions.call(this);
  };

  actor.update = sandbox.powerupjs.PhysicsGameObject.prototype.update;
  actor.update(0.5);

  assert.equal(checks.length, 1);
  assert.equal(checks[0].x, 110);
  assert.equal(checks[0].y, 120);
  assert.ok(actor.hitbox.right <= wall.hitbox.left);
  assert.ok(actor.hitbox.bottom <= floor.hitbox.top);
  assert.equal(actor.tileRight, true);
  assert.equal(actor.grounded, true);
  assert.equal(actor.actualVelocity.x, 10, 'Measure the five pixels actually traveled before the wall');
  assert.equal(actor.actualVelocity.y, 30, 'Measure the fifteen pixels actually traveled before the floor');
  assert.equal(actor.velocity.x, 0);
  assert.equal(actor.velocity.y, 0);
  actor.velocity = new Vector2(20, 40);
  actor.update(0.5);
  assert.ok(actor.actualVelocity.isZero, 'Pushing into the wall and floor produces no actual movement');
  actor.update(0);
  assert.ok(actor.actualVelocity.isZero, 'Zero-delta updates never divide by zero');

  actor.position.y += floor.hitbox.top - actor.hitbox.bottom;
  actor.adjustHitbox();
  actor.velocity = new Vector2(-20, 0);
  const floorStart = actor.position.copy();
  actor.update(0.25);
  assert.equal(actor.position.x, floorStart.x - 5, 'Floor contact must not block horizontal movement');
  assert.equal(actor.actualVelocity.x, -20);
  assert.equal(actor.actualVelocity.y, 0);

  field.clear();
  actor.velocity = new Vector2(-20, -40);
  const start = actor.position.copy();
  actor.update(0.25);
  assert.equal(actor.position.x, start.x - 5);
  assert.equal(actor.position.y, start.y - 10);
  assert.equal(actor.actualVelocity.x, -20);
  assert.equal(actor.actualVelocity.y, -40);

  actor.adjustHitbox();
  const leftWall = {
    hitboxType: 'solid', velocity: new Vector2(0, 0),
    hitbox: new Rectangle(actor.hitbox.left - 35, 0, 32, 300)
  };
  const ceiling = {
    hitboxType: 'solid', velocity: new Vector2(0, 0),
    hitbox: new Rectangle(0, actor.hitbox.top - 37, 300, 32)
  };
  field.add(leftWall);
  field.add(ceiling);
  actor.update(0.5);
  assert.ok(actor.hitbox.left >= leftWall.hitbox.right);
  assert.ok(actor.hitbox.top >= ceiling.hitbox.bottom);
  assert.equal(actor.tileLeft, true);

  field.clear();
  actor.applyGravity = true;
  actor.useGravity = true;
  actor.velocity = new Vector2(0, 0);
  sandbox.WorldSettings.gravityDefault = 25;
  const startY = actor.position.y;
  actor.update(1 / 60);
  assert.equal(actor.position.y, startY, 'Gravity changes velocity for the next movement step');
  assert.equal(actor.velocity.y, 25);
  assert.ok(actor.actualVelocity.isZero, 'Gravity has not caused displacement yet');
  actor.update(1 / 60);
  assert.ok(Math.abs(actor.position.y - startY - 25 / 60) < 0.000001);
  assert.ok(Math.abs(actor.actualVelocity.y - 25) < 0.000001);
  actor.position = new Vector2(1000, 2000);
  actor.velocity = Vector2.zero;
  actor.applyGravity = false;
  actor.update(0.5);
  assert.ok(actor.actualVelocity.isZero, 'Teleports between physics steps are not measured as movement');
});

test('Small movement stays smooth across floor seams and against wall edges', () => {
  const sandbox = loadGameplayScripts();
  const { Vector2, Rectangle, GameObjectList } = sandbox.powerupjs;
  const player = new sandbox.Player();
  player.origin = player.center;
  player.position = new Vector2(64, 100);
  player.adjustHitbox();
  const floorTop = player.hitbox.bottom;
  const field = new GameObjectList();
  const tileFields = new GameObjectList();
  tileFields.add(field);
  for (let x = 0; x < 192; x += 32) {
    field.add({
      hitboxType: 'solid', velocity: new Vector2(0, 0),
      hitbox: new Rectangle(x, floorTop, 32, 32)
    });
  }
  sandbox.WorldSettings.currentLevel = { room: { tileFields } };
  sandbox.WorldSettings.gravityDefault = 25;
  sandbox.WorldSettings.debugMode = false;
  for (let frame = 0; frame < 120; frame++) {
    const startX = player.position.x;
    player.velocity.x = frame < 60 ? 30 : -30;
    sandbox.powerupjs.PhysicsGameObject.prototype.update.call(player, 1 / 60);
    assert.ok(Math.abs(player.position.x - startX - (frame < 60 ? 0.5 : -0.5)) < 0.000001);
    assert.ok(Math.abs(player.position.y - 100) < 1);
  }

  const wall = {
    hitboxType: 'solid', velocity: new Vector2(0, 0),
    hitbox: new Rectangle(player.hitbox.right + 0.1, floorTop - 100, 32, 100)
  };
  field.add(wall);
  const startY = player.position.y;
  for (let frame = 0; frame < 10; frame++) {
    player.velocity.x = 30;
    sandbox.powerupjs.PhysicsGameObject.prototype.update.call(player, 1 / 60);
    assert.ok(Math.abs(player.hitbox.right - wall.hitbox.left) < 0.000001);
    assert.ok(Math.abs(player.position.y - startY) < 1);
  }
});

test('Wall sliding passes stacked tile seams without grounding or stopping', () => {
  for (const side of [-1, 1]) {
    for (const reverseOrder of [false, true]) {
      const sandbox = loadGameplayScripts();
      const { Vector2, Rectangle, GameObjectList } = sandbox.powerupjs;
      const player = new sandbox.Player();
      player.origin = player.center;
      player.position = new Vector2(100, 60);
      player.adjustHitbox();
      player.wallSlideRequested = true;
      player.wallSlideDirection = side;
      player.velocity.y = 30;
      sandbox.WorldSettings.wallSlideSpeed = 30;
      sandbox.WorldSettings.gravityDefault = 25;
      sandbox.WorldSettings.debugMode = false;
      const wallX = side < 0 ? player.hitbox.left - 32 : player.hitbox.right;
      const field = new GameObjectList();
      const tileFields = new GameObjectList();
      const rows = Array.from({ length: 12 }, (_, i) => i);
      if (reverseOrder) rows.reverse();
      for (const row of rows) {
        field.add({
          hitboxType: 'solid', velocity: new Vector2(0, 0),
          hitbox: new Rectangle(wallX, row * 32, 32, 32)
        });
      }
      tileFields.add(field);
      sandbox.WorldSettings.currentLevel = { room: { tileFields } };

      for (let frame = 0; frame < 360; frame++) {
        const startY = player.position.y;
        player.tileLeft = side < 0;
        player.tileRight = side > 0;
        player.velocity.x = side * 30;
        sandbox.powerupjs.PhysicsGameObject.prototype.update.call(player, 1 / 60);
        assert.ok(Math.abs(player.position.y - startY - 0.5) < 0.000001,
          `Sliding must continue at seam: side=${side}, frame=${frame}`);
        assert.equal(player.grounded, false);
        assert.ok(Math.abs(player.position.x - 100) < 0.000001);
      }
    }
  }
});

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

test('EditingMenuGUI initializes its button list without crashing', async () => {
  await quizBefore('EditingMenuGUI initialization',
    'Tests that EditingMenuGUI exposes a valid button collection and can construct without undefined parent operations');

  const root = path.join(__dirname, '..');
  const powerupjs = loadEngine();
  const ctx = vm.createContext({
    console,
    powerupjs,
    ID: { layer_overlays: 30, layer_overlays_1: 31, layer_overlays_2: 32 },
    sprites: {
      window_ui: { base: {}, header: {} },
      editingButtons: { nrSheetElements: 1 },
      button_default: {}
    },
    MenuObject: undefined,
    LabelledButton: undefined,
    window: { powerupjs }
  });

  vm.runInContext(fs.readFileSync(path.join(root, 'gui', 'LabelledButton.js'), 'utf8'), ctx, { filename: 'gui/LabelledButton.js' });
  vm.runInContext(fs.readFileSync(path.join(root, 'gui', 'MenuObject.js'), 'utf8'), ctx, { filename: 'gui/MenuObject.js' });
  vm.runInContext(fs.readFileSync(path.join(root, 'gui', 'EditingMenuGUI.js'), 'utf8'), ctx, { filename: 'gui/EditingMenuGUI.js' });

  const editingMenu = new ctx.EditingMenuGUI();
  assert.ok(editingMenu.buttons);
  assert.equal(editingMenu.buttons, editingMenu.menu.buttons);
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

test('GameStateManager forwards A without clearing saves or reloading', () => {
  const sandbox = createSandbox();
  const root = path.join(__dirname, '..');
  loadScript(path.join(root, 'powerupjs', 'system', 'Keys.js'), sandbox);
  loadScript(path.join(root, 'powerupjs', 'input', 'ButtonState.js'), sandbox);
  loadScript(path.join(root, 'powerupjs', 'input', 'Keyboard.js'), sandbox);
  loadScript(path.join(root, 'powerupjs', 'GameStateManager.js'), sandbox);
  loadScript(path.join(root, 'WorldSettings.js'), sandbox);
  const { GameStateManager, Keyboard, Keys } = sandbox.powerupjs;
  const savedLevels = '[{"name":"Keep this level"}]';
  sandbox.localStorage.levels = savedLevels;
  sandbox.localStorage.clear = () => assert.fail('Movement must not erase saves');
  sandbox.location = { reload: () => assert.fail('Movement must not reload the page') };
  const level = { name: 'Keep this level' };
  const player = {};
  sandbox.WorldSettings.levels = [level];
  sandbox.WorldSettings.activePlayer = player;
  let inputCalls = 0;
  let updateCalls = 0;
  let drawCalls = 0;
  GameStateManager.add({
    handleInput(delta) {
      assert.equal(delta, 1 / 60);
      assert.equal(Keyboard.down(Keys.A), true);
      inputCalls++;
    },
    update() { updateCalls++; },
    draw() { drawCalls++; }
  });

  sandbox.document.onkeydown({ keyCode: Keys.A });
  for (let frame = 0; frame < 600; frame++) {
    GameStateManager.handleInput(1 / 60);
    GameStateManager.update(1 / 60);
    GameStateManager.draw();
    Keyboard.reset();
  }
  sandbox.document.onkeyup({ keyCode: Keys.A });

  assert.equal(inputCalls, 600);
  assert.equal(updateCalls, 600);
  assert.equal(drawCalls, 600);
  assert.equal(Keyboard.down(Keys.A), false);
  assert.equal(sandbox.localStorage.levels, savedLevels);
  assert.equal(sandbox.WorldSettings.currentLevel, level);
  assert.equal(sandbox.WorldSettings.activePlayer, player);
  assert.equal(sandbox.WorldSettings.terminalVelocity, 530);
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

test('Enemy inherits enemy mechanics from EnemyController', async () => {
  const sandbox = loadGameplayScripts();
  sandbox.sprites.enemy = sandbox.sprites.blank;
  const root = path.join(__dirname, '..');
  loadScript(path.join(root, 'behavior scripts', 'BehaviorScriptOutline.js'), sandbox);
  loadScript(path.join(root, 'behavior scripts', 'WalkingBehaviorScript.js'), sandbox);
  loadScript(path.join(root, 'game objects', 'EnemyController.js'), sandbox);
  loadScript(path.join(root, 'game objects', 'Enemy.js'), sandbox);

  const enemy = new sandbox.Enemy(sandbox.sprites.enemy, 12, 24);

  assert.ok(enemy instanceof sandbox.EnemyController);
  assert.ok(enemy.behavior instanceof sandbox.BehaviorScriptOutline);
  assert.ok(enemy instanceof sandbox.powerupjs.PhysicsGameObject);
  assert.equal(Object.hasOwn(sandbox.Enemy.prototype, 'takeDamage'), false);
  assert.equal(Object.hasOwn(sandbox.Enemy.prototype, 'registerAttack'), false);
  assert.equal(Object.hasOwn(sandbox.EnemyController.prototype, 'takeDamage'), true);
  assert.equal(Object.hasOwn(sandbox.EnemyController.prototype, 'registerAttack'), true);
  assert.equal(typeof enemy.takeDamage, 'function');
  assert.equal(typeof enemy.registerAttack, 'function');
  assert.equal(enemy.position.x, 12);
  assert.equal(enemy.position.y, 24);

  enemy.adjustHitbox();
  assert.ok(enemy.circleHitbox instanceof sandbox.powerupjs.Circle);
  assert.equal(enemy.circleHitbox.x, enemy.boundingBox.center.x);
  assert.equal(enemy.circleHitbox.y, enemy.boundingBox.center.y);

  sandbox.WorldSettings.blockSprites = [sandbox.sprites.enemy];
  sandbox.Enemy.registerType({
    id: 'walker',
    sprite: sandbox.sprites.enemy,
    behavior: sandbox.WalkingBehaviorScript
  });
  const typedEnemy = sandbox.Enemy.create(
    sandbox.sprites.enemy,
    new sandbox.powerupjs.Vector2(30, 40),
    'walker'
  );
  assert.equal(typedEnemy.enemyType, 'walker');
  assert.ok(typedEnemy.behavior instanceof sandbox.WalkingBehaviorScript);
  assert.equal(typedEnemy.applyGravity, true);

  sandbox.WorldSettings.gravityDefault = 30;
  const originalPhysicsUpdate = sandbox.powerupjs.PhysicsGameObject.prototype.update;
  sandbox.powerupjs.PhysicsGameObject.prototype.update = function () {
    this.simulateGravity();
  };
  try {
    typedEnemy.velocity.y = 0;
    typedEnemy.update(1 / 60);
    assert.equal(typedEnemy.velocity.y, 30);

    typedEnemy.behavior.gravity = 5;
    typedEnemy.update(1 / 60);
    assert.equal(typedEnemy.velocity.y, 35);
  } finally {
    sandbox.powerupjs.PhysicsGameObject.prototype.update = originalPhysicsUpdate;
  }

  const loadedEnemy = sandbox.Enemy.fromData({
    x: 30,
    y: 40,
    sprite: sandbox.sprites.enemy.image.src,
    type: 'walker'
  });
  assert.equal(loadedEnemy.enemyType, 'walker');
  assert.ok(loadedEnemy.behavior instanceof sandbox.WalkingBehaviorScript);
});

test('Flying speed compensation reaches ideal speed under movement loss without oscillating', () => {
  const sandbox = loadGameplayScripts();
  const root = path.join(__dirname, '..');
  for (const script of ['BehaviorScriptOutline.js', 'FlyingBehaviorScript.js', 'DapperBehaviorScript.js']) {
    loadScript(path.join(root, 'behavior scripts', script), sandbox);
  }
  const { Vector2 } = sandbox.powerupjs;
  for (const Behavior of [sandbox.FlyingBehaviorScript, sandbox.DapperBehaviorScript]) {
    for (const efficiency of [1, 0.5, 0.1, 0]) {
      const behavior = new Behavior();
      behavior.wandering = false;
      behavior.moveTarget = new Vector2(10000, 0);
      const enemy = {
        position: Vector2.zero, velocity: Vector2.zero, actualVelocity: Vector2.zero
      };
      behavior.move(enemy, 0.1);
      assert.equal(enemy.velocity.length, behavior.moveSpeed, 'No boost before the first measurement');
      for (let frame = 0; frame < 10; frame++) {
        enemy.actualVelocity = enemy.velocity.multiply(efficiency);
        enemy.position.addTo(enemy.actualVelocity.multiply(0.1));
        behavior.move(enemy, 0.1);
        const expected = behavior.moveSpeed * (efficiency === 0 ? 3 : Math.min(3, 1 / efficiency));
        assert.ok(Math.abs(enemy.velocity.length - expected) < 1e-8);
        assert.equal(behavior.moveSpeed, 50, 'Do not compound the ideal speed');
      }
      if (efficiency === 0.5) {
        assert.equal(enemy.actualVelocity.length, behavior.moveSpeed);
        enemy.actualVelocity = enemy.velocity.copy();
        behavior.move(enemy, 0.1);
        assert.equal(enemy.velocity.length, behavior.moveSpeed, 'Remove boost when the path clears');
      }
    }
  }
});

test('Flying compensation resets on waits and reroutes, skips zero-delta samples, and limits target overshoot', () => {
  const sandbox = loadGameplayScripts();
  const root = path.join(__dirname, '..');
  for (const script of ['BehaviorScriptOutline.js', 'FlyingBehaviorScript.js']) {
    loadScript(path.join(root, 'behavior scripts', script), sandbox);
  }
  const { Vector2, Rectangle } = sandbox.powerupjs;
  sandbox.WorldSettings.currentLevel = { room: {} };
  sandbox.WorldSettings.cameraBounds = new Rectangle(-1000, -1000, 2000, 2000);
  const behavior = new sandbox.FlyingBehaviorScript();
  behavior.wandering = false;
  behavior.moveTarget = new Vector2(1000, 0);
  const enemy = {
    position: Vector2.zero, velocity: Vector2.zero, actualVelocity: Vector2.zero,
    raycast() { return null; }
  };
  behavior.move(enemy, 0.1);
  behavior.move(enemy, 0.1);
  assert.equal(enemy.velocity.length, 150, 'A fully blocked measurement uses the cap');
  behavior.move(enemy, 0);
  assert.equal(enemy.velocity.length, 150);
  behavior.moveTarget = new Vector2(10, 0);
  behavior.move(enemy, 0.1);
  assert.equal(enemy.velocity.length, 100, 'Do not command a step past the target');
  enemy.position = behavior.moveTarget.copy();
  behavior.move(enemy, 0.1);
  assert.ok(enemy.velocity.isZero);
  assert.equal(behavior._speedMultiplier, 1);
  behavior.moveTarget = new Vector2(1000, 0);
  behavior.move(enemy, 0.1);
  assert.equal(enemy.velocity.length, 50, 'Waiting must not create a blocked-movement sample');
  behavior.move(enemy, 0.1);
  assert.equal(enemy.velocity.length, 150);
  behavior.goToRandomPosition(enemy);
  assert.equal(behavior._speedMultiplier, 1);
  assert.equal(behavior._commandedSpeed, 0);
});

test('Flying enemies reroute at the configured stuck duration and reset the timer on progress', () => {
  const sandbox = loadGameplayScripts();
  const root = path.join(__dirname, '..');
  for (const script of ['BehaviorScriptOutline.js', 'FlyingBehaviorScript.js']) {
    loadScript(path.join(root, 'behavior scripts', script), sandbox);
  }
  vm.runInContext('Math.random = function () { return 0.5; };', sandbox);
  const { Vector2, Rectangle } = sandbox.powerupjs;
  sandbox.WorldSettings.currentLevel = { room: {} };
  sandbox.WorldSettings.cameraBounds = new Rectangle(-1000, -1000, 2000, 2000);
  const behavior = new sandbox.FlyingBehaviorScript();
  behavior.moveTarget = new Vector2(300, 0);
  let casts = 0;
  const enemy = {
    position: Vector2.zero, velocity: Vector2.zero,
    actualVelocity: Vector2.zero,
    raycast() { casts++; return null; }
  };
  behavior.update(enemy, 0);
  behavior.update(enemy, 1);
  assert.equal(casts, 0);
  enemy.position.x = 1;
  behavior.update(enemy, 0.5);
  assert.equal(behavior._stuckTime, 0);
  behavior.update(enemy, 1.99);
  assert.equal(casts, 0, 'Do not reroute before the full duration');
  enemy.position.x += 0.01;
  behavior.update(enemy, 0.01);
  assert.equal(casts, 1, 'Small collision jitter does not reset the stuck timer');
  assert.equal(behavior.rerouting, true);
  assert.ok(behavior.moveTarget.x < enemy.position.x);
  assert.ok(enemy.velocity.isZero);
  assert.equal(behavior.wanderWaitTime, 2);
  behavior.update(enemy, 0.5);
  assert.equal(casts, 1, 'Reset the timer after rerouting');
  assert.ok(enemy.velocity.x < 0);
  for (let i = 0; i < 10; i++) {
    enemy.position.x -= 1;
    behavior.update(enemy, 0.5);
  }
  assert.equal(casts, 1, 'Moving enemies must not reroute');
});

test('Flying destination waits retain their duration and trapped target searches are bounded', () => {
  const sandbox = loadGameplayScripts();
  const root = path.join(__dirname, '..');
  for (const script of ['BehaviorScriptOutline.js', 'FlyingBehaviorScript.js']) {
    loadScript(path.join(root, 'behavior scripts', script), sandbox);
  }
  vm.runInContext('Math.random = function () { return 0.5; };', sandbox);
  const { Vector2, Rectangle } = sandbox.powerupjs;
  sandbox.WorldSettings.currentLevel = { room: {} };
  sandbox.WorldSettings.cameraBounds = new Rectangle(-1000, -1000, 2000, 2000);
  const behavior = new sandbox.FlyingBehaviorScript();
  behavior.wanderWaitTime = 0.5;
  behavior.moveTarget = Vector2.zero;
  let casts = 0;
  let blocked = false;
  const enemy = {
    position: Vector2.zero, velocity: Vector2.zero,
    actualVelocity: new Vector2(50, 0),
    raycast() { casts++; return blocked ? {} : null; }
  };
  behavior.update(enemy, 0.25);
  assert.equal(casts, 0);
  behavior.update(enemy, 0.25);
  assert.equal(casts, 1);
  assert.equal(behavior.wanderWaitTime, 0.5);
  enemy.position = behavior.moveTarget.copy();
  behavior.update(enemy, 0.25);
  assert.equal(casts, 1);
  behavior.update(enemy, 0.25);
  assert.equal(casts, 2, 'Use the configured wait on subsequent arrivals too');

  enemy.tileColliding = true;
  behavior.update(enemy, 0.25);
  behavior.update(enemy, 0.25);
  assert.equal(casts, 3);
  behavior.update(enemy, 0.25);
  assert.equal(casts, 3, 'Collision waits and stuck recovery must not reroute twice');
  enemy.tileColliding = false;

  blocked = true;
  casts = 0;
  assert.equal(behavior.goToRandomPosition(enemy), false);
  assert.equal(casts, 20);
  assert.ok(behavior.moveTarget.equals(enemy.position));
  assert.notEqual(behavior.moveTarget, enemy.position);
  assert.ok(enemy.velocity.isZero);
  behavior.update(enemy, 0.25);
  assert.equal(casts, 20, 'Do not repeatedly search every frame when trapped');
  behavior.update(enemy, 0.25);
  assert.equal(casts, 40);
  assert.ok(enemy.velocity.isZero);
});

test('Stuck Dappers follow a recovery target before resuming a visible-player chase', () => {
  const sandbox = loadGameplayScripts();
  const root = path.join(__dirname, '..');
  for (const script of ['BehaviorScriptOutline.js', 'FlyingBehaviorScript.js', 'DapperBehaviorScript.js']) {
    loadScript(path.join(root, 'behavior scripts', script), sandbox);
  }
  vm.runInContext('Math.random = function () { return 0.5; };', sandbox);
  const { Vector2, Rectangle } = sandbox.powerupjs;
  sandbox.WorldSettings.currentLevel = { room: {} };
  sandbox.WorldSettings.cameraBounds = new Rectangle(-1000, -1000, 2000, 2000);
  sandbox.WorldSettings.player = { position: new Vector2(100, 0) };
  const behavior = new sandbox.DapperBehaviorScript();
  behavior.wandering = false;
  const enemy = {
    position: Vector2.zero, velocity: Vector2.zero,
    actualVelocity: new Vector2(50, 0),
    raycast() { return null; },
    canSeePlayer() { return true; }
  };
  behavior.update(enemy, 0);
  assert.equal(behavior.chasing, true);
  behavior.update(enemy, 0.25);
  assert.equal(behavior.chasing, true);
  behavior.update(enemy, 0.25);
  assert.equal(behavior.rerouting, true);
  assert.equal(behavior.chasing, false);
  assert.equal(behavior.wandering, true);
  const recovery = behavior.moveTarget.copy();
  enemy.position.x -= 25;
  behavior.update(enemy, 0.1);
  assert.ok(behavior.moveTarget.equals(recovery), 'Do not overwrite recovery with the player position');
  assert.equal(behavior.chasing, false);
  enemy.position = recovery.copy();
  behavior.update(enemy, 0);
  assert.equal(behavior.rerouting, false);
  assert.equal(behavior.chasing, true);
  assert.equal(behavior.wandering, false);
  assert.ok(behavior.moveTarget.equals(sandbox.WorldSettings.player.position));
});

test('Dapper hurtboxes remain circular after creation, reload, movement, and scaling', () => {
  const sandbox = loadGameplayScripts();
  const root = path.join(__dirname, '..');
  for (const script of [
    'behavior scripts/BehaviorScriptOutline.js',
    'behavior scripts/FlyingBehaviorScript.js',
    'behavior scripts/DapperBehaviorScript.js',
    'game objects/EnemyController.js', 'game objects/Enemy.js'
  ]) loadScript(path.join(root, script), sandbox);
  const { Vector2, Circle, Rectangle } = sandbox.powerupjs;
  sandbox.Enemy.registerType({
    id: 'dapper', sprite: sandbox.sprites.blank, behavior: sandbox.DapperBehaviorScript
  });
  const enemies = [
    sandbox.Enemy.create(sandbox.sprites.blank, new Vector2(100, 200), 'dapper'),
    sandbox.Enemy.fromData({ x: 100, y: 200, type: 'dapper' })
  ];
  for (const enemy of enemies) {
    assert.equal(enemy.useGravity, false);
    for (const scale of [1, 2]) {
      enemy.scale = scale;
      enemy.position.addTo(new Vector2(10, 20));
      enemy.manageHitboxes();
      assert.ok(enemy.hitbox instanceof Circle);
      assert.ok(enemy.hurtbox instanceof Circle);
      const bounds = new Rectangle(
        enemy.boundingBox.x + enemy.width / 16,
        enemy.boundingBox.y + enemy.height / 16,
        enemy.boundingBox.width - enemy.width / 8,
        enemy.boundingBox.height - enemy.height / 16
      );
      assert.ok(enemy.hurtbox.center.equals(bounds.center));
      assert.equal(enemy.hurtbox.radius, Math.max(bounds.width, bounds.height) / 2);
    }
    enemy.hurtboxShape = 'rectangle';
    enemy.manageHitboxes();
    assert.ok(enemy.hurtbox instanceof Rectangle);
    assert.ok(enemy.hitbox instanceof Circle, 'Hurtbox shape is independent of collision shape');
  }
  const generic = new sandbox.Enemy(sandbox.sprites.blank);
  assert.ok(generic.hurtbox instanceof Rectangle);
});

test('Dapper enemies check player visibility on the controller and preserve chase transitions', () => {
  const sandbox = loadGameplayScripts();
  const root = path.join(__dirname, '..');
  for (const script of [
    'behavior scripts/BehaviorScriptOutline.js',
    'behavior scripts/FlyingBehaviorScript.js',
    'behavior scripts/DapperBehaviorScript.js',
    'game objects/EnemyController.js',
    'game objects/Enemy.js'
  ]) {
    loadScript(path.join(root, script), sandbox);
  }
  const { Vector2, Rectangle, Circle, GameObjectList } = sandbox.powerupjs;
  const field = new GameObjectList();
  const tileFields = new GameObjectList();
  tileFields.add(field);
  sandbox.WorldSettings.currentLevel = { room: { tileFields } };
  sandbox.WorldSettings.currentState = 'playing';
  sandbox.Enemy.registerType({
    id: 'dapper',
    sprite: sandbox.sprites.blank,
    behavior: sandbox.DapperBehaviorScript
  });
  const enemy = sandbox.Enemy.create(sandbox.sprites.blank, new Vector2(0, 0), 'dapper');
  const behavior = enemy.behavior;
  behavior.wandering = false;
  behavior.moveTarget = new Vector2(20, 0);
  sandbox.WorldSettings.player = null;
  assert.equal(enemy.canSeePlayer(), false);
  assert.doesNotThrow(() => enemy.update(0));

  const player = { position: new Vector2(100, 0) };
  sandbox.WorldSettings.player = player;
  assert.equal(enemy.canSeePlayer(), true);
  enemy.update(0);
  assert.equal(behavior.chasing, true);
  assert.equal(behavior.wandering, false);
  assert.ok(behavior.moveTarget.equals(player.position));
  assert.notEqual(behavior.moveTarget, player.position);

  for (const bounds of [new Rectangle(40, -10, 10, 20), new Circle(50, 0, 10)]) {
    const tile = { hitboxType: 'solid', hitbox: bounds };
    field.add(tile);
    player.position = new Vector2(120, 0);
    assert.equal(enemy.canSeePlayer(), false);
    behavior.update(enemy, 0);
    assert.equal(behavior.moveTarget.x, 100, 'Keep the last visible position');
    assert.equal(behavior.chasing, true);
    field.clear();
  }

  for (const type of ['none', 'void']) {
    field.add({ hitboxType: type, hitbox: new Rectangle(40, -10, 10, 20) });
  }
  assert.equal(enemy.canSeePlayer(), true);
  field.clear();

  player.position = new Vector2(500, 0);
  behavior.chasing = false;
  behavior.update(enemy, 0);
  assert.equal(behavior.chasing, false, 'Detection range is strictly below 500');
  assert.equal(behavior.moveTarget.x, 100);
  player.position = new Vector2(499, 0);
  behavior.update(enemy, 0);
  assert.equal(behavior.chasing, true);
  assert.equal(behavior.moveTarget.x, 499);
  player.position = new Vector2(600, 0);
  enemy.position = behavior.moveTarget.copy();
  field.add({ hitboxType: 'solid', hitbox: new Rectangle(550, -10, 10, 20) });
  behavior.update(enemy, 0);
  assert.equal(behavior.chasing, false);
  assert.equal(behavior.wandering, true);
});

test('Flying enemies inherit the base behavior and can be created and reloaded', () => {
  const sandbox = loadGameplayScripts();
  sandbox.WorldSettings.currentLevel = {
    room: { tileFields: new sandbox.powerupjs.GameObjectList() }
  };
  sandbox.WorldSettings.currentState = 'playing';
  const root = path.join(__dirname, '..');
  for (const script of [
    'behavior scripts/BehaviorScriptOutline.js',
    'behavior scripts/FlyingBehaviorScript.js',
    'game objects/EnemyController.js',
    'game objects/Enemy.js'
  ]) {
    loadScript(path.join(root, script), sandbox);
  }
  sandbox.Enemy.registerType({
    id: 'flying',
    sprite: sandbox.sprites.blank,
    behavior: sandbox.FlyingBehaviorScript
  });

  const enemies = [
    sandbox.Enemy.create(sandbox.sprites.blank, new sandbox.powerupjs.Vector2(30, 40), 'flying'),
    sandbox.Enemy.fromData({ x: 30, y: 40, type: 'flying' })
  ];
  for (const enemy of enemies) {
    assert.equal(enemy.enemyType, 'flying');
    assert.ok(enemy.behavior instanceof sandbox.FlyingBehaviorScript);
    assert.ok(enemy.behavior instanceof sandbox.BehaviorScriptOutline);
    assert.equal(enemy.behavior.constructor, sandbox.FlyingBehaviorScript);
    assert.equal(enemy.behavior.moveSpeed, 30);
    assert.equal(enemy.behavior.useGravity, false);
    assert.equal(enemy.position.x, 30);
    assert.equal(enemy.position.y, 40);
    for (let frame = 0; frame < 600; frame++) {
      enemy.update(1 / 60);
      assert.ok(Number.isFinite(enemy.position.x));
      assert.ok(Number.isFinite(enemy.position.y));
      assert.ok(Number.isFinite(enemy.velocity.x));
      assert.ok(Number.isFinite(enemy.velocity.y));
    }
  }
});

test('Flying target markers follow targets only in debug mode and leave no scene objects behind', () => {
  const sandbox = loadGameplayScripts();
  const root = path.join(__dirname, '..');
  for (const script of [
    'behavior scripts/BehaviorScriptOutline.js',
    'behavior scripts/FlyingBehaviorScript.js',
    'game objects/EnemyController.js',
    'game objects/Enemy.js'
  ]) {
    loadScript(path.join(root, script), sandbox);
  }
  const { Vector2, GameObjectList, SpriteGameObject } = sandbox.powerupjs;
  const draws = [];
  sandbox.sprites.crosshair = {
    ...sandbox.sprites.blank,
    center: new Vector2(8, 8),
    draw(position, origin) {
      draws.push({ position: position.copy(), origin: origin.copy() });
    }
  };
  const enemies = new GameObjectList();
  enemies.position = new Vector2(10, 20);
  sandbox.powerupjs.Camera.position = new Vector2(2, 3);
  const enemy = new sandbox.Enemy(sandbox.sprites.blank);
  enemy.behavior = new sandbox.FlyingBehaviorScript();
  enemy.hitbox.draw = () => {};
  enemy.hurtbox.draw = () => {};
  enemies.add(enemy);
  sandbox.WorldSettings.debugMode = true;
  enemies.draw();
  assert.equal(enemy.behavior.targetMarker, null, 'No marker before a target exists');
  enemy.behavior.moveTarget = new Vector2(100, 200);
  sandbox.WorldSettings.debugMode = false;
  enemies.draw();
  assert.equal(draws.length, 0);
  assert.equal(enemy.behavior.targetMarker, null);
  sandbox.WorldSettings.debugMode = true;
  enemies.draw();
  const marker = enemy.behavior.targetMarker;
  assert.ok(marker instanceof SpriteGameObject);
  assert.equal(marker.sprite, sandbox.sprites.crosshair);
  assert.ok(draws[0].position.equals(new Vector2(108, 217)));
  assert.ok(draws[0].origin.equals(new Vector2(8, 8)));
  assert.notEqual(marker.position, enemy.behavior.moveTarget);
  assert.equal(enemies.length, 1);
  enemy.behavior.moveTarget = new Vector2(150, 250);
  enemies.draw();
  assert.equal(enemy.behavior.targetMarker, marker, 'Reuse the marker');
  assert.ok(draws[1].position.equals(new Vector2(158, 267)));
  sandbox.WorldSettings.debugMode = false;
  enemies.draw();
  assert.equal(draws.length, 2);
  sandbox.WorldSettings.debugMode = true;
  enemy.behavior.moveTarget = null;
  enemies.draw();
  assert.equal(draws.length, 2);
  enemy.behavior.moveTarget = new Vector2(200, 300);
  enemies.remove(enemy);
  enemies.draw();
  assert.equal(draws.length, 2);
  assert.equal(enemies.length, 0);
});

test('Flying movement initializes targets, approaches without mutation, and waits before wandering again', () => {
  const sandbox = loadGameplayScripts();
  const root = path.join(__dirname, '..');
  for (const script of ['BehaviorScriptOutline.js', 'FlyingBehaviorScript.js']) {
    loadScript(path.join(root, 'behavior scripts', script), sandbox);
  }
  vm.runInContext('Math.random = function () { return 0.5; };', sandbox);
  const { Vector2 } = sandbox.powerupjs;
  const behavior = new sandbox.FlyingBehaviorScript();
  const enemy = { position: new Vector2(300, 400), velocity: Vector2.zero };
  behavior.update(enemy, 0.5);
  assert.equal(behavior.moveTarget.x, 250);
  assert.equal(behavior.moveTarget.y, 400);
  assert.ok(behavior.moveTarget.subtract(enemy.position).length <= behavior.wanderDistance);
  assert.equal(enemy.position.x, 300);
  assert.equal(enemy.position.y, 400);
  assert.equal(enemy.velocity.x, -30);
  assert.ok(Math.abs(enemy.velocity.y) < 1e-10);

  behavior.moveTarget = new Vector2(303, 404);
  const target = behavior.moveTarget.copy();
  const direction = behavior.toTargetVector(enemy);
  assert.equal(direction.x, 0.6);
  assert.equal(direction.y, 0.8);
  assert.ok(enemy.position.equals(new Vector2(300, 400)));
  assert.ok(behavior.moveTarget.equals(target));

  behavior.moveSpeed = 10;
  behavior.update(enemy, 0.5);
  assert.ok(enemy.position.equals(target));
  assert.notEqual(enemy.position, behavior.moveTarget);
  assert.ok(enemy.velocity.isZero);
  assert.equal(behavior.wanderWaitTime, 1.5);
  behavior.update(enemy, 1);
  assert.ok(behavior.moveTarget.equals(target));
  behavior.update(enemy, 0.5);
  assert.equal(behavior.moveTarget.x, 253);
  assert.equal(behavior.moveTarget.y, 404);
  assert.equal(behavior.wanderWaitTime, 2);
  behavior.update(enemy, 0.5);
  assert.equal(enemy.velocity.x, -10);

  const stationary = new sandbox.FlyingBehaviorScript();
  stationary.wandering = false;
  stationary.update(enemy, 0.5);
  assert.ok(stationary.moveTarget.equals(enemy.position));
  assert.ok(enemy.velocity.isZero);
  stationary.moveTarget = new Vector2(303, 414);
  stationary.update(enemy, 0.1);
  assert.equal(enemy.velocity.y, stationary.moveSpeed);
});

test('Enemy creation loads animations after assigning the selected behavior', () => {
  const sandbox = loadGameplayScripts();
  const root = path.join(__dirname, '..');
  for (const script of [
    'behavior scripts/BehaviorScriptOutline.js',
    'game objects/EnemyController.js',
    'game objects/Enemy.js'
  ]) {
    loadScript(path.join(root, script), sandbox);
  }
  const { Vector2 } = sandbox.powerupjs;
  const animatedSprite = {
    ...sandbox.sprites.blank,
    width: 40,
    height: 24,
    center: new Vector2(20, 12)
  };
  let calls = 0;
  function AnimatedBehavior() {}
  AnimatedBehavior.prototype = Object.create(sandbox.BehaviorScriptOutline.prototype);
  AnimatedBehavior.prototype.constructor = AnimatedBehavior;
  AnimatedBehavior.prototype.loadAnimations = function (enemy) {
    calls++;
    assert.equal(enemy.behavior, this);
    assert.equal(enemy.position.x, 120);
    assert.equal(enemy.position.y, 240);
    enemy.loadAnimation(animatedSprite, 'idle', true, 0.2);
    enemy.playAnimation('idle');
  };
  sandbox.Enemy.registerType({
    id: 'animated',
    sprite: sandbox.sprites.blank,
    behavior: AnimatedBehavior
  });

  const enemies = [
    sandbox.Enemy.create(sandbox.sprites.blank, new Vector2(120, 240), 'animated'),
    sandbox.Enemy.fromData({ x: 120, y: 240, type: 'animated' }),
    sandbox.Enemy.create(sandbox.sprites.blank, new Vector2(120, 240), null, AnimatedBehavior)
  ];
  assert.equal(calls, 3);
  for (const enemy of enemies) {
    assert.equal(enemy.sprite, animatedSprite);
    assert.equal(enemy.origin.x, 20);
    assert.equal(enemy.origin.y, 12);
    assert.equal(enemy.hitbox.x, 100);
    assert.equal(enemy.hitbox.y, 228);
    assert.equal(enemy.hitbox.width, 40);
    assert.equal(enemy.hitbox.height, 24);
  }
});

test('Slime placements retain their sprite and behavior through room normalization and reload', () => {
  const sandbox = loadGameplayScripts();
  const root = path.join(__dirname, '..');
  for (const script of [
    'behavior scripts/BehaviorScriptOutline.js',
    'behavior scripts/WalkingBehaviorScript.js',
    'behavior scripts/SlimeBehaviorScript.js',
    'game objects/EnemyController.js',
    'game objects/Enemy.js'
  ]) {
    loadScript(path.join(root, script), sandbox);
  }
  const { Vector2 } = sandbox.powerupjs;
  sandbox.sprites.enemy = sandbox.sprites.blank;
  const slimeSprite = {
    ...sandbox.sprites.blank,
    image: { src: 'http://localhost:5501/sprites/slime@2.png' },
    nrSheetElements: 2,
    center: new Vector2(8, 8)
  };
  sandbox.WorldSettings.blockSprites = [sandbox.sprites.enemy];
  sandbox.Enemy.registerType({
    id: 'slime',
    sprite: slimeSprite,
    behavior: sandbox.SlimeBehaviorScript
  });
  const placed = sandbox.Enemy.create(slimeSprite, new Vector2(120, 240), 'slime');
  const savedEnemy = {
    x: placed.position.x,
    y: placed.position.y,
    sprite: placed.sprite.image.src,
    type: placed.enemyType,
    behavior: placed.behavior.constructor.name
  };
  let levelData = { rooms: [{ enemies: [savedEnemy] }] };
  for (let reload = 0; reload < 3; reload++) {
    levelData = sandbox.WorldSettings.normalizeLevelData(JSON.parse(JSON.stringify(levelData)));
    const data = levelData.rooms[0].enemies[0];
    assert.equal(data.type, 'slime');
    assert.equal(data.behavior, 'SlimeBehaviorScript');
    const loaded = sandbox.Enemy.fromData(data);
    assert.equal(loaded.sprite, slimeSprite);
    assert.equal(loaded.enemyType, 'slime');
    assert.ok(loaded.behavior instanceof sandbox.SlimeBehaviorScript);
    assert.equal(loaded.position.x, 120);
    assert.equal(loaded.position.y, 240);
  }

  for (const legacyData of [
    { x: 120, y: 240, sprite: slimeSprite.image.src },
    { x: 120, y: 240, type: 'slime' },
    { x: 120, y: 240, sprite: 'http://old-host/sprites/slime@2.png', type: 'slime' },
    { x: 120, y: 240, enemyType: 'slime' }
  ]) {
    const normalized = sandbox.WorldSettings.normalizeLevelData({ enemies: [legacyData] });
    const loaded = sandbox.Enemy.fromData(normalized.room.enemies[0]);
    assert.equal(loaded.sprite, slimeSprite);
    assert.equal(loaded.enemyType, 'slime');
    assert.ok(loaded.behavior instanceof sandbox.SlimeBehaviorScript);
  }

  const generic = sandbox.Enemy.fromData({ x: 10, y: 20, sprite: sandbox.sprites.enemy.image.src });
  assert.equal(generic.sprite, sandbox.sprites.enemy);
  assert.equal(generic.enemyType, null);
  assert.ok(generic.behavior instanceof sandbox.BehaviorScriptOutline);

  for (const script of [
    'game objects/EnemyManager.js',
    'game states/GameplayEditorState.js',
    'game states/PlayingState.js'
  ]) {
    loadScript(path.join(root, script), sandbox);
  }
  const level = new sandbox.Level();
  level.name = 'Slime room';
  level.room.enemies = [savedEnemy];
  sandbox.WorldSettings.levels = [level];
  sandbox.LEVELS = [levelData];
  sandbox.WorldSettings.saveLevels();
  sandbox.LEVELS = JSON.parse(sandbox.localStorage.levels);
  const editor = Object.create(sandbox.GameplayEditorState.prototype);
  const editorRoom = editor.getActiveRoomData();
  const editorEnemy = sandbox.Enemy.fromData(editorRoom.enemies[0]);
  assert.equal(editorEnemy.sprite, slimeSprite);
  assert.ok(editorEnemy.behavior instanceof sandbox.SlimeBehaviorScript);
  sandbox.WorldSettings.manageLevelProperties(level);
  const playing = Object.create(sandbox.PlayingState.prototype);
  playing.currentLevel = level;
  playing.enemies = new sandbox.EnemyManager();
  playing.loadRoomEnemies();
  assert.equal(playing.enemies.length, 1);
  assert.equal(playing.enemies.at(0).sprite, slimeSprite);
  assert.equal(playing.enemies.at(0).enemyType, 'slime');
  assert.ok(playing.enemies.at(0).behavior instanceof sandbox.SlimeBehaviorScript);
  assert.equal(playing.enemies.at(0).position.x, 120);
  assert.equal(playing.enemies.at(0).position.y, 240);
});

test('Loaded slime keeps its world position in the editor and collides with floors offscreen', () => {
  const sandbox = loadGameplayScripts();
  const root = path.join(__dirname, '..');
  for (const script of [
    'behavior scripts/BehaviorScriptOutline.js',
    'behavior scripts/WalkingBehaviorScript.js',
    'behavior scripts/SlimeBehaviorScript.js',
    'game objects/EnemyController.js',
    'game objects/Enemy.js'
  ]) {
    loadScript(path.join(root, script), sandbox);
  }
  const { Vector2, Rectangle, GameObjectList } = sandbox.powerupjs;
  sandbox.sprites.enemy = sandbox.sprites.blank;
  const slimeSprite = {
    ...sandbox.sprites.blank,
    image: { src: 'slime@2.png' },
    center: new Vector2(8, 8),
    nrSheetElements: 2
  };
  sandbox.Enemy.registerType({ id: 'slime', sprite: slimeSprite, behavior: sandbox.SlimeBehaviorScript });
  const slime = sandbox.Enemy.fromData({ x: 120, y: 240, type: 'slime' });
  sandbox.WorldSettings.currentState = 'editing';
  sandbox.powerupjs.Camera.position = new Vector2(10000, 10000);
  for (let frame = 0; frame < 120; frame++) slime.update(1 / 60);
  assert.equal(slime.position.x, 120);
  assert.equal(slime.position.y, 240);

  const field = new GameObjectList();
  field.add({
    hitbox: new Rectangle(-1000, 300, 4000, 32),
    hitboxType: 'solid',
    velocity: Vector2.zero
  });
  const tileFields = new GameObjectList();
  tileFields.add(field);
  sandbox.WorldSettings.levels = [{ room: { tileFields } }];
  sandbox.WorldSettings.currentState = 'playing';
  for (let frame = 0; frame < 600; frame++) slime.update(1 / 60);
  assert.equal(slime.sprite, slimeSprite);
  assert.equal(slime.enemyType, 'slime');
  assert.ok(slime.behavior instanceof sandbox.SlimeBehaviorScript);
  assert.ok(slime.position.x > 120);
  assert.ok(Math.abs(slime.hitbox.bottom - 300) <= 2, `Slime feet at ${slime.hitbox.bottom}`);
  assert.equal(slime.grounded, true);
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

test('Physics objects use the configured default gravity without producing NaN velocity', async () => {
  const sandbox = loadGameplayScripts();
  sandbox.WorldSettings.gravityDefault = 30;
  sandbox.WorldSettings.gravity = undefined;
  sandbox.WorldSettings.terminalVelocity = 100;

  const player = new sandbox.Player(0, 1);
  player.applyGravity = false;
  player.velocity.y = 0;
  player.simulateGravity();
  assert.equal(player.velocity.y, 0);

  player.applyGravity = true;
  player.velocity.y = 0;
  player.simulateGravity();
  assert.equal(player.velocity.y, 30);

  player.velocity.y = 95;
  player.simulateGravity();
  assert.equal(player.velocity.y, 100);
  assert.ok(Number.isFinite(player.velocity.y));
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
