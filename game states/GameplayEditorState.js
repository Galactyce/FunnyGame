function GameplayEditorState(layer) {
  powerupjs.GameObjectList.call(this, layer);

  // --- Editing state ---
  this.currentEditorLayer = 0;
  this.previousMousePosition = powerupjs.Vector2.zero;
  this.modes = ["Drawing", "Erasing", "Editing"];
  this.mode = this.modes[0];
  this.enabledModes = { Drawing: true, Erasing: true, Editing: true };
  this.editingTiles = false;
  this.swiping = false;

  // --- Scene object lists ---
  this.editorLayers = new powerupjs.GameObjectList();
  this.add(this.editorLayers);
  this.editorPlacedEnemies = new powerupjs.GameObjectList();
  this.add(this.editorPlacedEnemies);
  this.modeButtons = new powerupjs.GameObjectList();
  this.add(this.modeButtons);

  // --- World markers ---
  this.playerStartPos = new powerupjs.SpriteGameObject(
    sprites.portal,
    ID.layer_objects,
    ID.player_spawn,
  ); // draggable player start position marker
  this.playerStartPos.position = new powerupjs.Vector2(400, 400);
  this.add(this.playerStartPos);

  this.cursorEffect = new powerupjs.SpriteGameObject(
    null,
    ID.layer_overlays,
    ID.player_spawn + 2,
  ); // preview of the selected block following the cursor in drawing mode
  this.cursorEffect.visible = false; // hidden until a block sprite is selected
  this.add(this.cursorEffect);

  // --- HUD labels ---
  this.currentRoomDisplay = new powerupjs.Label(
    "Pixel",
    "20px",
    ID.layer_overlays_2,
    ID.player_spawn + 1,
    powerupjs.Color.white
  );
  this.add(this.currentRoomDisplay);

  this.currentEditorLayerDisplay = new powerupjs.Label(
    "Pixel",
    "20px",
    ID.layer_overlays,
    0,
    powerupjs.Color.white,
  );
  this.currentEditorLayerDisplay.position = new powerupjs.Vector2(95, 140);
  this.currentEditorLayerDisplay.ui = true;
  this.currentEditorLayerDisplay.text = "Layer: 1/1"; // seed a representative value so its width is measured before layout uses it
  this.add(this.currentEditorLayerDisplay);

  // --- Menus and buttons ---
  this.menuManager = new EditorMenuManager(ID.layer_overlays);
  this.objectMenu = this.menuManager.objectMenu;
  this.editingMenu = this.menuManager.editingMenu;
  this.menuManager.addTo(this);
  this.buttonManager = new EditorButtonManager(this);
}

GameplayEditorState.prototype = Object.create(
  powerupjs.GameObjectList.prototype,
);

// The tile field of the active editor layer. Derived on demand so it can never
// go stale when currentEditorLayer changes.
Object.defineProperty(GameplayEditorState.prototype, "currentField", {
  get: function () {
    return this.editorLayers.at(this.currentEditorLayer);
  },
});

// ---------------------------------------------------------------------------
// Room & level data
// ---------------------------------------------------------------------------

GameplayEditorState.prototype.getActiveRoomData = function () {
  var levelIndex = WorldSettings.currentLevelIndex;
  var levelData = window.LEVELS[levelIndex];
  if (!levelData || typeof levelData !== "object") {
    WorldSettings.createLevel(levelIndex);
    levelData = window.LEVELS[levelIndex];
  }

  levelData = WorldSettings.normalizeLevelData(levelData);
  window.LEVELS[levelIndex] = levelData;

  var runtimeLevel = WorldSettings.currentLevel;
  var roomIndex =
    runtimeLevel && typeof runtimeLevel.currentRoomIndex === "number"
      ? runtimeLevel.currentRoomIndex
      : 0;

  while (levelData.rooms.length <= roomIndex) {
    levelData.rooms.push(WorldSettings.createDefaultRoomData());
  }

  levelData.activeRoomIndex = roomIndex;
  WorldSettings.syncRoomAlias(levelData);
  return levelData.room;
};

// Grow or shrink the editor layer list to the required count.
GameplayEditorState.prototype.ensureEditorLayers = function (layerCount) {
  var requiredCount = Math.max(1, layerCount || 0);

  while (this.editorLayers.length < requiredCount) {
    var field = new TileField();
    field.editorLayer = this.editorLayers.length;
    this.editorLayers.add(field);
  }

  while (this.editorLayers.length > requiredCount) {
    this.editorLayers.remove(
      this.editorLayers.at(this.editorLayers.length - 1),
    );
  }

  for (var i = 0; i < this.editorLayers.length; i++) {
    this.editorLayers.at(i).editorLayer = i;
  }

  this.currentEditorLayer = Math.max(
    0,
    Math.min(this.currentEditorLayer, this.editorLayers.length - 1),
  );
};

// Load the active room's tiles, enemies, spawn point, and camera bounds into the editor.
GameplayEditorState.prototype.loadLayers = function () {
  var roomData = this.getActiveRoomData();
  if (!Array.isArray(roomData.tiles)) roomData.tiles = [];
  if (!Array.isArray(roomData.enemies)) roomData.enemies = [];
  this.ensureEditorLayers(roomData.tiles.length);

  this.editorPlacedEnemies.clear();
  WorldSettings.currentLevel.room.enemies = roomData.enemies.slice();
  for (var e = 0; e < roomData.enemies.length; e++) {
    var editorEnemy = Enemy.fromData(roomData.enemies[e]);
    if (editorEnemy) this.editorPlacedEnemies.add(editorEnemy);
  }

  // Ensure active room backgrounds are rebuilt whenever editor loads/switches rooms.
  WorldSettings.currentLevel.room.loadBackground();

  // Room refactor: editor spawn marker reads from room-owned spawn data.
  var spawnData = roomData.playerSpawnPos;
  this.playerStartPos.position =
    spawnData.x == null
      ? new powerupjs.Vector2(400, 400)
      : new powerupjs.Vector2(spawnData.x, spawnData.y);

  // Room refactor: camera bounds are room-owned and mirrored onto WorldSettings helper.
  WorldSettings.cameraBounds = roomData.cameraBounds;
  this.syncCameraBoundsHandles();

  for (var i = 0; i < this.editorLayers.length; i++) {
    this.editorLayers.at(i).clear();
    this.editorLayers.at(i).loadTiles();
  }
};

GameplayEditorState.prototype.saveLevel = function () {
  var roomData = this.getActiveRoomData();
  if (!Array.isArray(roomData.tiles)) roomData.tiles = [];
  if (!Array.isArray(roomData.enemies)) roomData.enemies = [];
  this.ensureEditorLayers(
    Math.max(roomData.tiles.length, this.editorLayers.length),
  );

  for (var i = 0; i < this.editorLayers.length; i++) {
    this.editorLayers.at(i).saveTiles();
  }

  roomData.enemies = [];
  for (var e = 0; e < this.editorPlacedEnemies.length; e++) {
    var editorEnemy = this.editorPlacedEnemies.at(e);
    if (!editorEnemy || !editorEnemy.position) continue;
    roomData.enemies.push({
      x: editorEnemy.position.x,
      y: editorEnemy.position.y,
      sprite:
        editorEnemy.sprite && editorEnemy.sprite.image
          ? editorEnemy.sprite.image.src
          : sprites.enemy && sprites.enemy.image
            ? sprites.enemy.image.src
            : "",
    });
  }

  var activeRoom = WorldSettings.currentLevel.room;
  activeRoom.enemies = roomData.enemies.slice();
  roomData.song = typeof activeRoom.song === "string" ? activeRoom.song : "";
  roomData.eventNodes = Array.isArray(activeRoom.eventNodes)
    ? activeRoom.eventNodes.slice()
    : [];

  var spawnPosition = this.playerStartPos.position.copy();
  activeRoom.playerStartPos = spawnPosition.copy();
  roomData.playerSpawnPos = { x: spawnPosition.x, y: spawnPosition.y };
  WorldSettings.saveLevels();
};

// Change the room's scale, persist it, and reload everything that depends on it.
GameplayEditorState.prototype.adjustScale = function (value) {
  WorldSettings.currentLevel.room.scale += value;
  var roomData = this.getActiveRoomData();
  roomData.scale = WorldSettings.currentLevel.room.scale; // Room refactor: persist scale at room scope.
  WorldSettings.currentLevel.room.scaleCameraBounds();
  WorldSettings.currentLevel.room.loadBackground();
  this.saveLevel();
  powerupjs.GameStateManager.get(ID.game_state_editor).loadLayers();
  powerupjs.GameStateManager.get(ID.game_state_playing).loadLevel();
};

// ---------------------------------------------------------------------------
// Frame loop
// ---------------------------------------------------------------------------

GameplayEditorState.prototype.update = function (delta) {
  if (!WorldSettings.currentLevel || !WorldSettings.currentLevel.rooms) return;

  // In editor mode, only the active room should be visible and editable.
  for (var i = 0; i < WorldSettings.currentLevel.rooms.length; i++) {
    var room = WorldSettings.currentLevel.rooms.at(i);
    if (room) room.visible = i === WorldSettings.currentLevel.currentRoomIndex;
  }

  WorldSettings.currentLevel.update(delta);
  powerupjs.GameObjectList.prototype.update.call(this, delta);
  this.buttonManager.update(delta);
  this.updateEnemyPreview();
  this.menuManager.update(this.enabledModes);

  if (!this.isDraggingCameraBoundsHandle()) {
    this.syncCameraBoundsHandles();
  }

  this.currentEditorLayerDisplay.text =
    "Layer: " + (this.currentEditorLayer + 1) + "/" + this.editorLayers.length;
  this.currentRoomDisplay.text =
    "Room: " +
    (WorldSettings.currentLevel.currentRoomIndex + 1) +
    "/" +
    WorldSettings.currentLevel.rooms.length;
};

// Show a ghost of the selected enemy at the mouse while it can be placed.
GameplayEditorState.prototype.updateEnemyPreview = function () {
  var selectedBlock = WorldSettings.currentBlock;
  var shouldShowPreview =
    this.isModeEnabled("Drawing") &&
    selectedBlock &&
    selectedBlock.tab === "enemies" &&
    this.editingTiles;

  if (!shouldShowPreview) {
    if (this.previewEnemy) this.previewEnemy.visible = false;
    return;
  }

  if (!this.previewEnemy) {
    this.previewEnemy = new Enemy(selectedBlock.sprite || sprites.enemy, 0, 0);
    this.editorPlacedEnemies.add(this.previewEnemy);
  }

  this.previewEnemy.visible = true;
  this.previewEnemy.position = powerupjs.Mouse.position.copy();
  this.previewEnemy.origin = this.previewEnemy.center;
  this.previewEnemy.manageHitboxes(this.previewEnemy.sprite);
};

// Show a preview of the selected block, snapped to the grid cell under the
// mouse, while a block can actually be placed there.
GameplayEditorState.prototype.updateCursorEffect = function () {
  var selectedBlock = WorldSettings.currentBlock;
  var field = this.currentField;
  var showPreview =
    this.isModeEnabled("Drawing") &&
    this.isObjectMenuOpen() &&
    this.editingTiles && // mouse is over the world, not editor UI
    field &&
    selectedBlock &&
    selectedBlock.sprite &&
    selectedBlock.tab !== "enemies" && // enemies get their own preview (updateEnemyPreview)
    selectedBlock.objectType !== "travelPoint"; // travel points place unsnapped

  this.cursorEffect.visible = !!showPreview;
  if (!showPreview) return;

  this.cursorEffect.sprite = selectedBlock.sprite;
  this.cursorEffect.sheetIndex = selectedBlock.sheetIndex || 0;
  this.cursorEffect.origin = this.cursorEffect.center;
  this.cursorEffect.scale = field.scale;

  // Mirror addTileAt's placement: the center of the grid cell under the mouse.
  var index = field.getTileByMouse(powerupjs.Mouse.position);
  var cellWidth = field.cellWidth * field.scale;
  var cellHeight = field.cellHeight * field.scale;
  this.cursorEffect.position = new powerupjs.Vector2(
    field.worldPosition.x + index.x * cellWidth + cellWidth / 2,
    field.worldPosition.y + index.y * cellHeight + cellHeight / 2,
  );
};

GameplayEditorState.prototype.draw = function () {
  if (!WorldSettings.currentLevel || !WorldSettings.currentLevel.draw) return;

  WorldSettings.currentLevel.draw();
  this.drawCameraBoundsOutline();
  powerupjs.GameObjectList.prototype.draw.call(this);
};

GameplayEditorState.prototype.drawCameraBoundsOutline = function () {
  var scaledBounds = this.getScaledCameraBounds();
  if (scaledBounds) scaledBounds.draw("cyan");
};

// ---------------------------------------------------------------------------
// Edit modes (drawing / erasing / editing are mutually exclusive)
// ---------------------------------------------------------------------------

GameplayEditorState.prototype.isModeEnabled = function (modeName) {
  if (!this.enabledModes) return true;
  if (typeof modeName !== "string") return true;
  return this.enabledModes[modeName] !== false;
};

GameplayEditorState.prototype.setMode = function (modeName) {
  if (typeof modeName !== "string") return;
  this.mode = modeName;
  this.enabledModes = {
    Drawing: modeName === "Drawing",
    Erasing: modeName === "Erasing",
    Editing: modeName === "Editing",
  };
};

// ---------------------------------------------------------------------------
// Camera bounds handles
// ---------------------------------------------------------------------------

GameplayEditorState.prototype.getCameraBoundsHandles = function () {
  return [
    this.extendCamBoundsLeft,
    this.extendCamBoundsRight,
    this.extendCamBoundsUp,
    this.extendCamBoundsDown,
  ];
};

GameplayEditorState.prototype.hasCameraBoundsHandles = function () {
  var handles = this.getCameraBoundsHandles();
  for (var i = 0; i < handles.length; i++) {
    if (!handles[i]) return false;
  }
  return true;
};

// The room's camera bounds rectangle in world (scaled) coordinates.
GameplayEditorState.prototype.getScaledCameraBounds = function () {
  var room = WorldSettings.currentLevel && WorldSettings.currentLevel.room;
  if (!room || !room.cameraBounds) return null;
  var scale =
    typeof room.scale === "number" && room.scale !== 0 ? room.scale : 1;

  return new powerupjs.Rectangle(
    room.cameraBounds.x * scale,
    room.cameraBounds.y * scale,
    room.cameraBounds.width * scale,
    room.cameraBounds.height * scale,
  );
};

// Place the four drag handles on the edges of the current camera bounds.
GameplayEditorState.prototype.syncCameraBoundsHandles = function () {
  if (!this.hasCameraBoundsHandles()) return;

  var scaled = this.getScaledCameraBounds();
  if (!scaled) return;

  var centerX = scaled.x + scaled.width / 2;
  var centerY = scaled.y + scaled.height / 2;

  this.extendCamBoundsLeft.position = new powerupjs.Vector2(scaled.x, centerY);
  this.extendCamBoundsRight.position = new powerupjs.Vector2(
    scaled.x + scaled.width,
    centerY,
  );
  this.extendCamBoundsUp.position = new powerupjs.Vector2(centerX, scaled.y);
  this.extendCamBoundsDown.position = new powerupjs.Vector2(
    centerX,
    scaled.y + scaled.height,
  );
};

GameplayEditorState.prototype.isDraggingCameraBoundsHandle = function () {
  if (!this.hasCameraBoundsHandles()) return false;

  var handles = this.getCameraBoundsHandles();
  for (var i = 0; i < handles.length; i++) {
    if (handles[i].dragging) return true;
  }
  return false;
};

// While a handle is dragged, resize the room's camera bounds to follow it
// (never smaller than one viewport). Returns whether anything changed.
GameplayEditorState.prototype.applyCameraBoundsFromHandles = function () {
  var room = WorldSettings.currentLevel && WorldSettings.currentLevel.room;
  if (!room || !room.cameraBounds) return false;

  var scale =
    typeof room.scale === "number" && room.scale !== 0 ? room.scale : 1;
  var scaled = this.getScaledCameraBounds();
  if (!scaled) return false;

  var left = scaled.x;
  var right = scaled.x + scaled.width;
  var top = scaled.y;
  var bottom = scaled.y + scaled.height;

  var minWidth =
    powerupjs.Camera && powerupjs.Camera.viewWidth
      ? powerupjs.Camera.viewWidth
      : powerupjs.Game.size.x;
  var minHeight =
    powerupjs.Camera && powerupjs.Camera.viewHeight
      ? powerupjs.Camera.viewHeight
      : powerupjs.Game.size.y;

  var changed = false;
  if (this.extendCamBoundsLeft.dragging) {
    left = Math.min(this.extendCamBoundsLeft.position.x, right - minWidth);
    changed = true;
  }
  if (this.extendCamBoundsRight.dragging) {
    right = Math.max(this.extendCamBoundsRight.position.x, left + minWidth);
    changed = true;
  }
  if (this.extendCamBoundsUp.dragging) {
    top = Math.min(this.extendCamBoundsUp.position.y, bottom - minHeight);
    changed = true;
  }
  if (this.extendCamBoundsDown.dragging) {
    bottom = Math.max(this.extendCamBoundsDown.position.y, top + minHeight);
    changed = true;
  }

  if (!changed) return false;

  room.cameraBounds.x = left / scale;
  room.cameraBounds.y = top / scale;
  room.cameraBounds.width = (right - left) / scale;
  room.cameraBounds.height = (bottom - top) / scale;
  this.persistRoomCameraBounds();

  return true;
};

// Mirror the room's live camera bounds into the persisted room data.
GameplayEditorState.prototype.persistRoomCameraBounds = function () {
  var roomData = this.getActiveRoomData();
  if (!roomData || !roomData.cameraBounds) return;

  var liveBounds = WorldSettings.currentLevel.room.cameraBounds;
  roomData.cameraBounds.x = liveBounds.x;
  roomData.cameraBounds.y = liveBounds.y;
  roomData.cameraBounds.width = liveBounds.width;
  roomData.cameraBounds.height = liveBounds.height;
};

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

GameplayEditorState.prototype.handleInput = function (delta) {
  powerupjs.GameObjectList.prototype.handleInput.call(this, delta);
  if (!WorldSettings.currentLevel || !WorldSettings.currentLevel.handleInput)
    return;

  WorldSettings.currentLevel.handleInput(delta);
  this.handleDebugHotkeys();
  this.handleCameraBoundsHandleDrag();

  this.swiping = this.buttonManager.swipeCheckBox.checked;
  if (this.buttonManager.swipeCheckBox.pressed) {
    return; // toggling the checkbox shouldn't also count as a world click
  }

  if (powerupjs.Keyboard.pressed(powerupjs.Keys.A)) {
    if (confirm("Clear all Tiles?")) this.currentField.clear();
  }

  this.buttonManager.handleInput();
  this.menuManager.handleInput();

  this.editingTiles = !this.isMouseOverEditorButton();

  var clicked =
    powerupjs.Mouse.left.pressed || (this.swiping && powerupjs.Mouse.left.down);
  if (clicked && this.editingTiles) {
    this.handleWorldEditClick();
  }

  this.panCameraWithMiddleMouse();
  this.updateCursorEffect();

  this.previousMousePosition = powerupjs.Mouse.screenPosition.copy();
  this.editingTiles = true;
};

// Hold D to dump layer info to the console (once per press).
GameplayEditorState.prototype.handleDebugHotkeys = function () {
  var debugKeyDown = powerupjs.Keyboard.down(powerupjs.Keys.D);
  if (debugKeyDown && !this._debugLayerLogHotkeyHeld) {
    this.logLayerDebugInfo();
  }
  this._debugLayerLogHotkeyHeld = debugKeyDown;
};

// Resize camera bounds while a handle is dragged; save once on release.
GameplayEditorState.prototype.handleCameraBoundsHandleDrag = function () {
  var dragging = this.isDraggingCameraBoundsHandle();
  if (dragging) {
    this.applyCameraBoundsFromHandles();
  }
  if (this.wasDraggingCameraBoundsHandle && !dragging) {
    this.saveLevel();
  }
  this.wasDraggingCameraBoundsHandle = dragging;
};

GameplayEditorState.prototype.panCameraWithMiddleMouse = function () {
  if (!powerupjs.Mouse.middle.down) return;

  // Move the camera opposite to the mouse movement since the last frame.
  powerupjs.Camera.position.addTo(
    powerupjs.Mouse.screenPosition
      .subtractFrom(this.previousMousePosition)
      .multiplyWith(-1),
  );
};

// True when the mouse is over any editor UI (buttons, menus, drag handles),
// meaning a click should not edit the world.
GameplayEditorState.prototype.isMouseOverEditorButton = function () {
  var mouseScreen = powerupjs.Mouse.screenPosition;
  var mouseWorld = powerupjs.Mouse.position;

  var screenButtons = [
    this.buttonManager.nextRoomButton,
    this.buttonManager.previousRoomButton,
    this.buttonManager.addRoomButton,
    this.buttonManager.playButton,
    this.buttonManager.saveButton,
    this.buttonManager.swipeCheckBox,
    this.movePageLeftButton,
    this.movePageRightButton,
    this.buttonManager.nextLayerButton,
    this.buttonManager.previousLayerButton,
    this.buttonManager.musicButton,
    this.buttonManager.drawingButton,
    this.buttonManager.editingButton,
    this.buttonManager.removeButton,
  ].concat(this.getCameraBoundsHandles());

  for (var i = 0; i < screenButtons.length; i++) {
    if (containsPoint(screenButtons[i], mouseScreen)) return true;
  }

  for (var m = 0; m < this.modeButtons.length; m++) {
    if (containsPoint(this.modeButtons.at(m), mouseScreen)) return true;
  }

  if (this.menuManager.isMouseOver(mouseScreen)) return true;

  // World-space handles: camera bounds and travel point resize grips.
  var worldHandles = this.getCameraBoundsHandles();
  var activeRoom =
    WorldSettings.currentLevel && WorldSettings.currentLevel.room;
  if (activeRoom && Array.isArray(activeRoom.travelPoints)) {
    for (var tp = 0; tp < activeRoom.travelPoints.length; tp++) {
      var travelPoint = activeRoom.travelPoints[tp];
      if (!travelPoint || !travelPoint.handles) continue;
      for (var side in travelPoint.handles) {
        if (travelPoint.handles.hasOwnProperty(side)) {
          worldHandles.push(travelPoint.handles[side]);
        }
      }
    }
  }

  for (var h = 0; h < worldHandles.length; h++) {
    if (containsPoint(worldHandles[h], mouseWorld)) return true;
  }

  return false;

  function containsPoint(object, point) {
    return !!(
      object &&
      object.visible &&
      object.boundingBox &&
      object.boundingBox.contains(point)
    );
  }
};

GameplayEditorState.prototype.handleWorldEditClick = function () {
  if (this.isModeEnabled("Drawing")) return this.handleDrawingClick();
  if (this.isModeEnabled("Erasing")) {
    this.handleErasingClick();
    return false;
  }
  if (this.isModeEnabled("Editing")) this.handleEditingClick();
  return false;
};

GameplayEditorState.prototype.isObjectMenuOpen = function () {
  return !!(
    this.objectMenu &&
    (this.objectMenu.visible || this.objectMenu.menu.isOpen)
  );
};

GameplayEditorState.prototype.handleDrawingClick = function () {
  // Only place blocks while the object menu is open — clicks with it closed
  // shouldn't silently draw whatever block was last selected.
  if (!this.isObjectMenuOpen()) return false;

  var selectedBlock = WorldSettings.currentBlock;

  if (selectedBlock && selectedBlock.tab === "enemies") {
    this.placeEnemy(selectedBlock);
    this.reopenObjectMenu();
    return true;
  }

  if (selectedBlock && selectedBlock.objectType === "travelPoint") {
    this.objectMenu.placeTravelPointFromMenu(powerupjs.Mouse.position);
    this.reopenObjectMenu();
    return true;
  }

  // addTileAt already replaces any tile occupying the target cell (removeTilesAtIndex);
  // don't use the bounding-box lookup here or neighbors overlapping this cell get deleted.
  var field = this.currentField;
  field.addTileAt(
    field.getTileByMouse(powerupjs.Mouse.position),
    "#",
    selectedBlock,
  );
  this.reopenObjectMenu();
  return false;
};

// Spawn the enemy both in the playing state (runtime) and in the editor preview list.
GameplayEditorState.prototype.placeEnemy = function (selectedBlock) {
  var playingState = powerupjs.GameStateManager.get(ID.game_state_playing);
  if (
    !playingState ||
    !playingState.enemies ||
    typeof playingState.enemies.addEnemy !== "function"
  )
    return;

  var spawnPosition = powerupjs.Mouse.position.copy();
  playingState.enemies.addEnemy(
    Enemy.create(selectedBlock.sprite, spawnPosition),
  );
  this.editorPlacedEnemies.add(
    Enemy.create(selectedBlock.sprite, spawnPosition),
  );
  if (this.previewEnemy) this.previewEnemy.visible = false;
};

GameplayEditorState.prototype.reopenObjectMenu = function () {
  this.objectMenu.menu.open();
  this.bringToFront(this.objectMenu); // keep it above any other open menu while placing objects
};

GameplayEditorState.prototype.handleErasingClick = function () {
  this.currentField.removeTileAt(powerupjs.Mouse.position);

  var enemy = this.findEnemyUnderMouse();
  if (enemy) this.editorPlacedEnemies.remove(enemy);

  var travelPoint = this.findTravelPointUnderMouse();
  if (travelPoint) {
    WorldSettings.currentLevel.room.removeTravelPoint(travelPoint);
  }
};

GameplayEditorState.prototype.handleEditingClick = function () {
  // Later checks win: travel points over enemies over tiles.
  var tile = this.currentField.getTileAt(powerupjs.Mouse.position);
  if (tile != null) this.editingMenu.selectedObj = tile;

  var enemy = this.findEnemyUnderMouse();
  if (enemy) this.editingMenu.selectedObj = enemy;

  var travelPoint = this.findTravelPointUnderMouse();
  if (travelPoint) this.editingMenu.selectedObj = travelPoint;
};

GameplayEditorState.prototype.findEnemyUnderMouse = function () {
  for (var e = this.editorPlacedEnemies.length - 1; e >= 0; e--) {
    var enemy = this.editorPlacedEnemies.at(e);
    if (!enemy || !enemy.position) continue;
    if (enemy.boundingBox.contains(powerupjs.Mouse.position)) return enemy;
  }
  return null;
};

GameplayEditorState.prototype.findTravelPointUnderMouse = function () {
  var activeRoom =
    WorldSettings.currentLevel && WorldSettings.currentLevel.room;
  if (!activeRoom || !Array.isArray(activeRoom.travelPoints)) return null;

  for (var t = activeRoom.travelPoints.length - 1; t >= 0; t--) {
    var travelPoint = activeRoom.travelPoints[t];
    if (
      travelPoint &&
      travelPoint.boundingBox.contains(powerupjs.Mouse.position)
    ) {
      return travelPoint;
    }
  }
  return null;
};

// ---------------------------------------------------------------------------
// Debugging
// ---------------------------------------------------------------------------

GameplayEditorState.prototype.logLayerDebugInfo = function () {
  var level = WorldSettings.currentLevel;
  var levelIndex = WorldSettings.currentLevelIndex;
  if (!level || !window.LEVELS[levelIndex]) {
    console.warn("[LayerDebug] No active level data.");
    return;
  }

  var roomData = this.getActiveRoomData();
  if (!roomData) {
    console.warn("[LayerDebug] No active room data.");
    return;
  }

  var savedLayers = Array.isArray(roomData.tiles) ? roomData.tiles : [];
  var nonEmptySavedLayerIndices = [];
  var layerTileCounts = [];

  for (var i = 0; i < savedLayers.length; i++) {
    var serialized = savedLayers[i] || "";
    if (serialized.length > 0) nonEmptySavedLayerIndices.push(i);

    var count = 0;
    var entries = serialized.length > 0 ? serialized.split("/") : [];
    for (var t = 0; t < entries.length; t++) {
      if (entries[t]) count++;
    }
    layerTileCounts.push(count);
  }

  console.log(
    "[LayerDebug] Level",
    levelIndex,
    "Room",
    typeof level.currentRoomIndex === "number" ? level.currentRoomIndex : 0,
    {
      editorLayerCount: this.editorLayers ? this.editorLayers.length : 0,
      savedLayerCount: savedLayers.length,
      activeEditorLayer: this.currentEditorLayer,
      nonEmptySavedLayerIndices: nonEmptySavedLayerIndices,
      layerTileCounts: layerTileCounts,
    },
  );
};
