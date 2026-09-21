function GameplayEditorState(layer) {
  powerupjs.GameObjectList.call(this, layer);
  this.currentEditorLayer = 0;
  this.previousMousePosition = powerupjs.Vector2.zero;
  this.modes = ["Drawing", "Erasing", "Editing"];
  this.mode = this.modes[0];
  this.editorLayers = new powerupjs.GameObjectList();
  this.editorPlacedEnemies = new powerupjs.GameObjectList();
  this.editingTiles = false;
  this.add(this.editorLayers);
  this.add(this.editorPlacedEnemies);
  this.modeButtons = new powerupjs.GameObjectList();
  this.add(this.modeButtons);

  this.playerStartPos = new powerupjs.SpriteGameObject(
    sprites.portal,
    ID.layer_objects,
    ID.player_spawn,
  ); // draggable player start position marker
  this.playerStartPos.position = new powerupjs.Vector2(400, 400);
  this.add(this.playerStartPos);

  this.currentRoomDisplay = new powerupjs.Label(
    "Arial",
    "20px",
    ID.layer_overlays_2,
    ID.player_spawn + 1,
  );
  this.add(this.currentRoomDisplay);

  this.saveButton = new LabelledButton(
    sprites.button_default,
    "Save",
    "Arial",
    "20px",
    ID.layer_overlays,
  );
  this.saveButton.position = new powerupjs.Vector2(120, 40);
  this.saveButton.ui = true;
  this.add(this.saveButton);

  this.playButton = new LabelledButton(
    sprites.button_default,
    "Return",
    "Arial",
    "20px",
    ID.layer_overlays,
  );
  this.playButton.position = new powerupjs.Vector2(900, 40);
  this.playButton.ui = true;
  this.add(this.playButton);

  this.swipeCheckBox = new CheckBox("Swipe", ID.layer_overlays);
  this.swipeCheckBox.position = new powerupjs.Vector2(120, 150);
  this.swipeCheckBox.ui = true;
  this.add(this.swipeCheckBox);

  this.currentEditorLayerDisplay = new powerupjs.Label(
    "Arial",
    "20px",
    ID.layer_overlays,
    0,
    powerupjs.Color.white,
  );
  this.currentEditorLayerDisplay.position = new powerupjs.Vector2(120, 200);
  this.currentEditorLayerDisplay.ui = true;
  this.add(this.currentEditorLayerDisplay);

  this.nextLayerButton = new powerupjs.Button(
    sprites.arrowButtons,
    ID.layer_overlays,
  );
  this.nextLayerButton.position = new powerupjs.Vector2(200, 200);
  this.nextLayerButton.sheetIndex = 1;
  this.nextLayerButton.ui = true;
  this.add(this.nextLayerButton);

  this.previousLayerButton = new powerupjs.Button(
    sprites.arrowButtons,
    ID.layer_overlays,
  );
  this.previousLayerButton.position = new powerupjs.Vector2(50, 200);
  this.previousLayerButton.sheetIndex = 0;
  this.previousLayerButton.ui = true;
  this.add(this.previousLayerButton);

  this.musicButton = new LabelledButton(
      sprites.button_default,
      "Music",
      "Arial",
      "20px",
      ID.layer_overlays,
  );
  this.musicButton.position = new powerupjs.Vector2(900, 115);
  this.musicButton.ui = true;
  this.add(this.musicButton);

  this.swiping = false;

  this.loadModeButtons(); // load mode buttons
  this.menuManager = new EditorMenuManager(ID.layer_overlays);
  this.objectMenu = this.menuManager.objectMenu;
  this.editingMenu = this.menuManager.editingMenu;
  this.menuManager.addTo(this);
  this.buttonManager = new EditorButtonManager(this);
}

GameplayEditorState.prototype = Object.create(
  powerupjs.GameObjectList.prototype,
);

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

  if (this.currentEditorLayer >= this.editorLayers.length) {
    this.currentEditorLayer = this.editorLayers.length - 1;
  }
  if (this.currentEditorLayer < 0) this.currentEditorLayer = 0;
};

GameplayEditorState.prototype.loadLayers = function () {
  var roomData = this.getActiveRoomData();
  if (!Array.isArray(roomData.tiles)) roomData.tiles = [];
  if (!Array.isArray(roomData.enemies)) roomData.enemies = [];
  this.ensureEditorLayers(roomData.tiles.length);
  this.editorPlacedEnemies.clear();
  WorldSettings.currentLevel.room.enemies = Array.isArray(roomData.enemies)
    ? roomData.enemies.slice()
    : [];
  for (var e = 0; e < roomData.enemies.length; e++) {
    var editorEnemy = Enemy.fromData(roomData.enemies[e]);
    if (editorEnemy) this.editorPlacedEnemies.add(editorEnemy);
  }
  // Ensure active room backgrounds are rebuilt whenever editor loads/switches rooms.
  WorldSettings.currentLevel.room.loadBackground();
  // Room refactor: editor spawn marker reads from room-owned spawn data.
  var spawnData = roomData.playerSpawnPos;
  if (spawnData.x == null) {
    this.playerStartPos.position = new powerupjs.Vector2(400, 400);
  } else {
    this.playerStartPos.position = new powerupjs.Vector2(
      spawnData.x,
      spawnData.y,
    );
  }
  // Room refactor: camera bounds are room-owned and mirrored onto WorldSettings helper.
  WorldSettings.cameraBounds = roomData.cameraBounds;
  this.syncCameraBoundsHandles();

  for (var i = 0; i < this.editorLayers.length; i++) {
    this.editorLayers.at(i).clear();
    this.editorLayers.at(i).loadTiles(); // load tiles for each editor layer
  }
};

GameplayEditorState.prototype.loadModeButtons = function () {
  for (var i = 0; i < this.modes.length; i++) {
    var button = new LabelledButton(
      sprites.button_default,
      this.modes[i],
      "Arial",
      "20px",
      ID.layer_overlays,
    ); // create button for each mode
    button.position = new powerupjs.Vector2(250, 650 + i * 60);
    button.ui = true;
    this.modeButtons.add(button);
  }
};

GameplayEditorState.prototype.update = function (delta) {
  if (!WorldSettings.currentLevel || !WorldSettings.currentLevel.rooms) return;

  // In editor mode, only the active room should be visible and editable.
  for (var i = 0; i < WorldSettings.currentLevel.rooms.length; i++) {
    var room = WorldSettings.currentLevel.rooms.at(i);
    if (room) room.visible = i === WorldSettings.currentLevel.currentRoomIndex;
  }
  WorldSettings.currentLevel.update(delta);
  powerupjs.GameObjectList.prototype.update.call(this, delta);

  this.currentEditorLayerDisplay.text =
    "Layer: " + (this.currentEditorLayer + 1) + "/" + this.editorLayers.length;
  this.updateEnemyPreview();

  this.menuManager.update(this.mode);

  if (!this.isDraggingCameraBoundsHandle()) {
    this.syncCameraBoundsHandles();
  }

  this.currentRoomDisplay.text =
    "Room: " +
    (WorldSettings.currentLevel.currentRoomIndex + 1) +
    "/" +
    WorldSettings.currentLevel.rooms.length;
};

GameplayEditorState.prototype.updateEnemyPreview = function () {
  var selectedBlock = WorldSettings.currentBlock;
  var shouldShowPreview =
    this.mode === "Drawing" &&
    selectedBlock &&
    selectedBlock.tab === "enemies" &&
    this.editingTiles;

  if (!shouldShowPreview) {
    if (this.previewEnemy) {
      this.previewEnemy.visible = false;
    }
    return;
  }

  if (!this.previewEnemy) {
    this.previewEnemy = new Enemy(selectedBlock.sprite || sprites.enemy, 0, 0);
    this.previewEnemy.visible = true;
    this.editorPlacedEnemies.add(this.previewEnemy);
  }

  this.previewEnemy.visible = true;
  this.previewEnemy.position = powerupjs.Mouse.position.copy();
  this.previewEnemy.origin = this.previewEnemy.center;
  this.previewEnemy.manageHitboxes(this.previewEnemy.sprite);
};

GameplayEditorState.prototype.draw = function () {
  if (!WorldSettings.currentLevel || !WorldSettings.currentLevel.draw) return;

  WorldSettings.currentLevel.draw();
  this.drawCameraBoundsOutline();
  powerupjs.GameObjectList.prototype.draw.call(this);
};

GameplayEditorState.prototype.drawCameraBoundsOutline = function () {
  var room = WorldSettings.currentLevel && WorldSettings.currentLevel.room;
  if (!room || !room.cameraBounds) return;

  var scale = typeof room.scale === "number" && room.scale !== 0 ? room.scale : 1;
  var bounds = room.cameraBounds;
  var scaledBounds = new powerupjs.Rectangle(
    bounds.x * scale,
    bounds.y * scale,
    bounds.width * scale,
    bounds.height * scale,
  );

  scaledBounds.draw("cyan");
};

GameplayEditorState.prototype.saveLevel = function () {
  var roomData = this.getActiveRoomData();
  if (!Array.isArray(roomData.tiles)) roomData.tiles = [];
  if (!Array.isArray(roomData.enemies)) roomData.enemies = [];
  this.ensureEditorLayers(Math.max(roomData.tiles.length, this.editorLayers.length));

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
      sprite: editorEnemy.sprite && editorEnemy.sprite.image
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

GameplayEditorState.prototype.adjustScale = function (value) {
  // Adjust the scale of the current room and update related properties
  WorldSettings.currentLevel.room.scale += value;
  var roomData = this.getActiveRoomData();
  // Room refactor: persist scale at room scope.
  roomData.scale = WorldSettings.currentLevel.room.scale; // Adjust scale
  WorldSettings.currentLevel.room.scaleCameraBounds();
  WorldSettings.currentLevel.room.loadBackground(); // Reload everything
  this.saveLevel(); // Save level data
  powerupjs.GameStateManager.get(ID.game_state_editor).loadLayers(); // load editor layers
  powerupjs.GameStateManager.get(ID.game_state_playing).loadLevel(); // load level in playing state
};

GameplayEditorState.prototype.getScaledCameraBounds = function () {
  // Get the camera bounds rectangle scaled by the room's scale factor
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

GameplayEditorState.prototype.syncCameraBoundsHandles = function () {
  if (!this.extendCamBoundsLeft || !this.extendCamBoundsRight ||
      !this.extendCamBoundsUp || !this.extendCamBoundsDown) return;

  // Sync the positions of the camera bounds handles with the current scaled camera bounds
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
  // Check if any camera bounds handle is currently being dragged
  if (!this.extendCamBoundsLeft || !this.extendCamBoundsRight ||
      !this.extendCamBoundsUp || !this.extendCamBoundsDown) return false;

  return !!(
    this.extendCamBoundsLeft.dragging ||
    this.extendCamBoundsRight.dragging ||
    this.extendCamBoundsUp.dragging ||
    this.extendCamBoundsDown.dragging
  );
};

GameplayEditorState.prototype.persistRoomCameraBounds = function () {
  // Persist the current camera bounds from the room to the active room data in window.LEVELS
  var roomData = this.getActiveRoomData();
  if (!roomData || !roomData.cameraBounds) return;
  roomData.cameraBounds.x = WorldSettings.currentLevel.room.cameraBounds.x;
  roomData.cameraBounds.y = WorldSettings.currentLevel.room.cameraBounds.y;
  roomData.cameraBounds.width =
    WorldSettings.currentLevel.room.cameraBounds.width;
  roomData.cameraBounds.height =
    WorldSettings.currentLevel.room.cameraBounds.height;
};

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
  var editorLayerCount = this.editorLayers ? this.editorLayers.length : 0;
  var activeRoomIndex =
    typeof level.currentRoomIndex === "number" ? level.currentRoomIndex : 0;
  var nonEmptySavedLayerIndices = [];
  var layerTileCounts = [];

  for (var i = 0; i < savedLayers.length; i++) {
    var serialized = savedLayers[i] || "";
    if (serialized.length > 0) {
      nonEmptySavedLayerIndices.push(i);
    }

    var count = 0;
    if (serialized.length > 0) {
      var entries = serialized.split("/");
      for (var t = 0; t < entries.length; t++) {
        if (entries[t]) count++;
      }
    }
    layerTileCounts.push(count);
  }

  console.log("[LayerDebug] Level", levelIndex, "Room", activeRoomIndex, {
    editorLayerCount: editorLayerCount,
    savedLayerCount: savedLayers.length,
    activeEditorLayer: this.currentEditorLayer,
    nonEmptySavedLayerIndices: nonEmptySavedLayerIndices,
    layerTileCounts: layerTileCounts,
  });
};

GameplayEditorState.prototype.applyCameraBoundsFromHandles = function () {
  // Apply camera bounds changes from draggable handles to the room data
  var room = WorldSettings.currentLevel && WorldSettings.currentLevel.room;
  if (!room || !room.cameraBounds) return false;

  var scale =
    typeof room.scale === "number" && room.scale !== 0 ? room.scale : 1; // Get the current scale of the room, defaulting to 1 if not set or invalid
  var scaled = this.getScaledCameraBounds(); // Get the scaled camera bounds based on the room's scale
  if (!scaled) return false;

  var left = scaled.x;
  var right = scaled.x + scaled.width;
  var top = scaled.y;
  var bottom = scaled.y + scaled.height;

  var changed = false;
  var viewportWidth =
    powerupjs.Camera && powerupjs.Camera.viewWidth
      ? powerupjs.Camera.viewWidth
      : powerupjs.Game.size.x;
  var viewportHeight =
    powerupjs.Camera && powerupjs.Camera.viewHeight
      ? powerupjs.Camera.viewHeight
      : powerupjs.Game.size.y;
  var minWidthScaled = viewportWidth;
  var minHeightScaled = viewportHeight;

  if (this.extendCamBoundsLeft.dragging) {
    left = Math.min(
      this.extendCamBoundsLeft.position.x,
      right - minWidthScaled,
    );
    changed = true;
  }
  if (this.extendCamBoundsRight.dragging) {
    right = Math.max(
      this.extendCamBoundsRight.position.x,
      left + minWidthScaled,
    );
    changed = true;
  }
  if (this.extendCamBoundsUp.dragging) {
    top = Math.min(this.extendCamBoundsUp.position.y, bottom - minHeightScaled);
    changed = true;
  }
  if (this.extendCamBoundsDown.dragging) {
    bottom = Math.max(
      this.extendCamBoundsDown.position.y,
      top + minHeightScaled,
    );
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

GameplayEditorState.prototype.isMouseOverEditorButton = function () {
  // Check if mouse is over any editor button or menu
  var mouseScreen = powerupjs.Mouse.screenPosition;
  var mouseWorld = powerupjs.Mouse.position;

  var directButtons = [
    this.nextRoomButton,
    this.previousRoomButton,
    this.addRoomButton,
    this.playButton,
    this.saveButton,
    this.swipeCheckBox,
    this.movePageLeftButton,
    this.movePageRightButton,
    this.nextLayerButton,
    this.previousLayerButton,
    this.extendCamBoundsLeft,
    this.extendCamBoundsRight,
    this.extendCamBoundsUp,
    this.extendCamBoundsDown,
    this.musicButton
  ];

  for (var i = 0; i < directButtons.length; i++) {
    var btn = directButtons[i];
    if (!btn || !btn.visible || !btn.boundingBox) continue;
    if (btn.boundingBox.contains(mouseScreen)) return true;
  }

  for (var m = 0; m < this.modeButtons.length; m++) {
    var modeButton = this.modeButtons.at(m);
    if (!modeButton || !modeButton.visible || !modeButton.boundingBox) continue;
    if (modeButton.boundingBox.contains(mouseScreen)) return true;
  }

  if (this.menuManager.isMouseOver(mouseScreen)) return true;

  var worldHandles = [
    // camera bounds handles
    this.extendCamBoundsLeft,
    this.extendCamBoundsRight,
    this.extendCamBoundsUp,
    this.extendCamBoundsDown,
  ];

  var activeRoom = WorldSettings.currentLevel && WorldSettings.currentLevel.room;
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
    // for each camera bounds handle
    var handle = worldHandles[h]; // get handle
    if (!handle || !handle.visible || !handle.boundingBox) continue; // skip if handle is not valid
    if (handle.boundingBox.contains(mouseWorld)) return true; // return true if mouse is over handle
  }

  return false;
};

GameplayEditorState.prototype.handleDrawingClick = function () {
  var selectedBlock = WorldSettings.currentBlock;
  var keepObjectMenuOpen = this.objectMenu && (this.objectMenu.visible || this.objectMenu.menu.isOpen);
  var isEnemyPlacement = selectedBlock && selectedBlock.tab === "enemies";
  var isTravelPointPlacement = selectedBlock && selectedBlock.objectType === "travelPoint";

  if (isEnemyPlacement) {
    var playingState = powerupjs.GameStateManager.get(ID.game_state_playing);
    if (playingState && playingState.enemies && typeof playingState.enemies.addEnemy === "function") {
      var enemySpawnPosition = powerupjs.Mouse.position.copy();
      playingState.enemies.addEnemy(Enemy.create(selectedBlock.sprite, enemySpawnPosition));
      this.editorPlacedEnemies.add(Enemy.create(selectedBlock.sprite, enemySpawnPosition));
      if (this.previewEnemy) this.previewEnemy.visible = false;
    }
    if (keepObjectMenuOpen) this.objectMenu.menu.open();
    return true;
  }

  if (isTravelPointPlacement) {
    this.objectMenu.placeTravelPointFromMenu(powerupjs.Mouse.position);
    if (keepObjectMenuOpen) this.objectMenu.menu.open();
    return true;
  }

  var field = this.editorLayers.at(this.currentEditorLayer);
  if (field.hasTileAt(powerupjs.Mouse.position)) {
    field.removeTileAt(powerupjs.Mouse.position);
  }
  field.addTileAt(field.getTileByMouse(powerupjs.Mouse.position), "#", selectedBlock);
  if (keepObjectMenuOpen) this.objectMenu.menu.open();
  return false;
};

GameplayEditorState.prototype.handleErasingClick = function () {
  var field = this.editorLayers.at(this.currentEditorLayer);
  field.removeTileAt(powerupjs.Mouse.position);

  for (var e = this.editorPlacedEnemies.length - 1; e >= 0; e--) {
    var editorEnemy = this.editorPlacedEnemies.at(e);
    if (!editorEnemy || !editorEnemy.position) continue;
    if (editorEnemy.boundingBox.contains(powerupjs.Mouse.position)) {
      this.editorPlacedEnemies.remove(editorEnemy);
      break;
    }
  }

  var activeRoom = WorldSettings.currentLevel && WorldSettings.currentLevel.room;
  if (!activeRoom || !Array.isArray(activeRoom.travelPoints)) return;
  for (var t = activeRoom.travelPoints.length - 1; t >= 0; t--) {
    var travelPoint = activeRoom.travelPoints[t];
    if (travelPoint && travelPoint.boundingBox.contains(powerupjs.Mouse.position)) {
      activeRoom.removeTravelPoint(travelPoint);
      break;
    }
  }
};

GameplayEditorState.prototype.handleEditingClick = function () {
  var field = this.editorLayers.at(this.currentEditorLayer);
  var tile = field.getTileAt(powerupjs.Mouse.position);
  if (tile != null) this.editingMenu.selectedObj = tile;

  for (var e = this.editorPlacedEnemies.length - 1; e >= 0; e--) {
    var editorEnemy = this.editorPlacedEnemies.at(e);
    if (!editorEnemy || !editorEnemy.position) continue;
    if (editorEnemy.boundingBox.contains(powerupjs.Mouse.position)) {
      this.editingMenu.selectedObj = editorEnemy;
      break;
    }
  }

  var activeRoom = WorldSettings.currentLevel && WorldSettings.currentLevel.room;
  if (!activeRoom || !Array.isArray(activeRoom.travelPoints)) return;
  for (var t = 0; t < activeRoom.travelPoints.length; t++) {
    var travelPoint = activeRoom.travelPoints[t];
    if (travelPoint && travelPoint.boundingBox.contains(powerupjs.Mouse.position)) {
      this.editingMenu.selectedObj = travelPoint;
      break;
    }
  }
};

GameplayEditorState.prototype.handleWorldEditClick = function () {
  if (this.mode === "Drawing") return this.handleDrawingClick();
  if (this.mode === "Erasing") {
    this.handleErasingClick();
    return false;
  }
  if (this.mode === "Editing") this.handleEditingClick();
  return false;
};

GameplayEditorState.prototype.handleInput = function (delta) {
  powerupjs.GameObjectList.prototype.handleInput.call(this, delta);
  if (!WorldSettings.currentLevel || !WorldSettings.currentLevel.handleInput)
    return;

  WorldSettings.currentLevel.handleInput(delta);

  if (
    !this._debugLayerLogHotkeyHeld &&
    powerupjs.Keyboard.down(powerupjs.Keys.D)
  ) {
    this._debugLayerLogHotkeyHeld = true;
    this.logLayerDebugInfo();
  }
  if (!powerupjs.Keyboard.down(powerupjs.Keys.D)) {
    this._debugLayerLogHotkeyHeld = false;
  }

  var draggingBoundsHandle = this.isDraggingCameraBoundsHandle();
  if (draggingBoundsHandle) {
    this.applyCameraBoundsFromHandles();
  }
  if (this.wasDraggingCameraBoundsHandle && !draggingBoundsHandle) {
    this.saveLevel();
  }
  this.wasDraggingCameraBoundsHandle = draggingBoundsHandle;

  this.swiping = this.swipeCheckBox.checked;
  if (this.swipeCheckBox.pressed) {
    return;
  }

  if (powerupjs.Keyboard.pressed(powerupjs.Keys.A)) {
    if (confirm("Clear all Tiles?"))
      this.editorLayers.at(this.currentEditorLayer).clear(); // clear current editor layer
  }

  this.buttonManager.handleInput();
  this.menuManager.handleInput();

  this.editingTiles = !this.isMouseOverEditorButton();

  if (
    (powerupjs.Mouse.left.pressed ||
      (this.swiping && powerupjs.Mouse.left.down)) &&
    this.editingTiles
  ) {
    if (this.handleWorldEditClick()) return;
    /*
    if (this.mode == "Drawing") {
      var selectedBlock = WorldSettings.currentBlock;
      var isEnemyPlacement = selectedBlock && selectedBlock.tab === "enemies";
      var isTravelPointPlacement = selectedBlock && selectedBlock.objectType === "travelPoint";

      if (isEnemyPlacement) {
        var playingState = powerupjs.GameStateManager.get(
          ID.game_state_playing,
        );
        if (
          playingState &&
          playingState.enemies &&
          typeof playingState.enemies.addEnemy === "function"
        ) {
          var enemySpawnPosition = powerupjs.Mouse.position.copy();
          var runtimeEnemy = Enemy.create(selectedBlock.sprite, enemySpawnPosition);
          playingState.enemies.addEnemy(runtimeEnemy);

          var editorEnemyPreview = Enemy.create(selectedBlock.sprite, enemySpawnPosition);
          this.editorPlacedEnemies.add(editorEnemyPreview);

          if (this.previewEnemy) {
            this.previewEnemy.visible = false;
          }
        }
        return;
      }

      if (isTravelPointPlacement) {
        this.objectMenu.placeTravelPointFromMenu(powerupjs.Mouse.position);
        return;
      }

      var field = this.editorLayers.at(this.currentEditorLayer); // get current editor layer
      if (field.hasTileAt(powerupjs.Mouse.position)) {
        field.removeTileAt(powerupjs.Mouse.position); // remove tile if one already exists at mouse position
      }
      field.addTileAt(
        field.getTileByMouse(powerupjs.Mouse.position),
        "#",
        WorldSettings.currentBlock,
      ); // add tile at mouse position
    } else if (this.mode == "Erasing") {
      var field = this.editorLayers.at(this.currentEditorLayer); // get current editor layer
      field.removeTileAt(powerupjs.Mouse.position); // remove tile at mouse position

      if (this.editorPlacedEnemies.length > 0) {
        for (var e = this.editorPlacedEnemies.length - 1; e >= 0; e--) {
          var editorEnemy = this.editorPlacedEnemies.at(e);
          if (!editorEnemy || !editorEnemy.position) continue;
          var enemyBounds = editorEnemy.boundingBox;
          if (enemyBounds && enemyBounds.contains(powerupjs.Mouse.position)) {
            this.editorPlacedEnemies.remove(editorEnemy); // remove enemy if mouse is over it
            break; // exit loop after removing one enemy
          }
        }
      }

      var activeRoom = WorldSettings.currentLevel && WorldSettings.currentLevel.room;
      if (activeRoom && Array.isArray(activeRoom.travelPoints)) {
        for (var t = activeRoom.travelPoints.length - 1; t >= 0; t--) {
          var travelPoint = activeRoom.travelPoints[t];
          if (travelPoint && travelPoint.boundingBox.contains(powerupjs.Mouse.position)) {
            activeRoom.removeTravelPoint(travelPoint);
            break;
          }
        }
      }
    } else if (this.mode == "Editing") {
      var field = this.editorLayers.at(this.currentEditorLayer); // get current editor layer
      var tile = field.getTileAt(powerupjs.Mouse.position); // get tile at mouse position
      if (tile != null) {
        this.editingMenu.selectedObj = tile; // set selected object in editing menu
      }
      if (this.editorPlacedEnemies.length > 0) {
        for (var e = this.editorPlacedEnemies.length - 1; e >= 0; e--) {
          var editorEnemy = this.editorPlacedEnemies.at(e);
          if (!editorEnemy || !editorEnemy.position) continue;
          var enemyBounds = editorEnemy.boundingBox;
          if (enemyBounds && enemyBounds.contains(powerupjs.Mouse.position)) {
            this.editingMenu.selectedObj = editorEnemy; // set selected object in editing menu
            break; // exit loop after selecting one enemy
          }
        }
      }

      var editableRoom = WorldSettings.currentLevel && WorldSettings.currentLevel.room;
      if (editableRoom && Array.isArray(editableRoom.travelPoints)) {
        for (var tp = 0; tp < editableRoom.travelPoints.length; tp++) {
          var editableTravelPoint = editableRoom.travelPoints[tp];
          if (editableTravelPoint && editableTravelPoint.boundingBox.contains(powerupjs.Mouse.position)) {
            this.editingMenu.selectedObj = editableTravelPoint;
            break;
          }
        }
      }
    }
    */
  }

  if (powerupjs.Mouse.middle.down) {
    // pan camera with middle mouse button
    powerupjs.Camera.position.addTo(
      powerupjs.Mouse.screenPosition
        .subtractFrom(this.previousMousePosition)
        .multiplyWith(-1), // move camera opposite to mouse movement
    );
  }

  this.previousMousePosition = powerupjs.Mouse.screenPosition.copy(); // store current mouse position for next frame
  this.editingTiles = true;
};

