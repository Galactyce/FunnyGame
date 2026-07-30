function GameplayEditorState(layer) {
    powerupjs.GameObjectList.call(this, layer);
    this.currentEditorLayer = 0;
    this.previousMousePosition = powerupjs.Vector2.zero;
    this.modes = ["Drawing", "Erasing", "Editing"];
    this.mode = this.modes[0];
    this.modeButtons = new powerupjs.GameObjectList();
    this.add(this.modeButtons);

    this.currentRoomDisplay = new powerupjs.Label("Arial", "20px", ID.layer_overlays, 0, powerupjs.Color.white);
    this.currentRoomDisplay.position = new powerupjs.Vector2(600, 35);
    this.currentRoomDisplay.ui = true;
    this.add(this.currentRoomDisplay);

    this.nextRoomButton = new powerupjs.Button(sprites.arrowButtons, ID.layer_overlays);
    this.nextRoomButton.position = new powerupjs.Vector2(700, 15);
    this.nextRoomButton.sheetIndex = 1;
    this.nextRoomButton.ui = true;
    this.add(this.nextRoomButton);

    this.previousRoomButton = new powerupjs.Button(sprites.arrowButtons, ID.layer_overlays);
    this.previousRoomButton.position = new powerupjs.Vector2(550, 15);
    this.previousRoomButton.sheetIndex = 0;
    this.previousRoomButton.ui = true;
    this.add(this.previousRoomButton);

    this.addTravelPointButton = new LabelledButton(sprites.button_default, "Travel Tile", "Arial", "20px", ID.layer_overlays);
    this.addTravelPointButton.position = new powerupjs.Vector2(900, 105);
    this.addTravelPointButton.ui = true;
    this.add(this.addTravelPointButton);

    this.extendCamBoundsRight = new DraggableObject(sprites.arrowButtons, ID.layer_overlays, "cam_bounds_right_handle");
    this.extendCamBoundsRight.sheetIndex = 1;
    this.extendCamBoundsRight.origin = this.extendCamBoundsRight.center;
    this.add(this.extendCamBoundsRight);

    this.extendCamBoundsLeft = new DraggableObject(sprites.arrowButtons, ID.layer_overlays, "cam_bounds_left_handle");
    this.extendCamBoundsLeft.sheetIndex = 0;
    this.extendCamBoundsLeft.origin = this.extendCamBoundsLeft.center;
    this.add(this.extendCamBoundsLeft);

    this.extendCamBoundsUp = new DraggableObject(sprites.arrowButtons, ID.layer_overlays, "cam_bounds_up_handle");
    this.extendCamBoundsUp.sheetIndex = 2;
    this.extendCamBoundsUp.origin = this.extendCamBoundsUp.center;
    this.add(this.extendCamBoundsUp);

    this.extendCamBoundsDown = new DraggableObject(sprites.arrowButtons, ID.layer_overlays, "cam_bounds_down_handle");
    this.extendCamBoundsDown.sheetIndex = 3;
    this.extendCamBoundsDown.origin = this.extendCamBoundsDown.center;
    this.add(this.extendCamBoundsDown);

    this.wasDraggingCameraBoundsHandle = false;

    this.editingTiles = true;

    this.editorLayers = new powerupjs.GameObjectList(ID.layer_objects); // list of tile fields for editing
    var field = new TileField(); // create new tile field
    field.editorLayer = 0; // set layer index
    this.editorLayers.add(field); // add tile field to editor layers
    this.add(this.editorLayers);

    this.addRoomButton = new LabelledButton(sprites.button_default, "Add Room", "Arial", "20px", ID.layer_overlays); // button to add a new room
    this.addRoomButton.position = new powerupjs.Vector2(900, 60);
    this.addRoomButton.ui = true;
    this.add(this.addRoomButton);

    this.objectMenu = new ObjectMenuGUI(ID.layer_overlays) // object selection menu
    this.objectMenu.position = new powerupjs.Vector2(400, 600);
    this.objectMenu.ui = true;
    this.add(this.objectMenu);

    this.movePageLeftButton = new powerupjs.Button(sprites.arrowButtons, ID.layer_overlays); // button to move to previous page of blocks
    this.movePageLeftButton.position = new powerupjs.Vector2(350, 685);
    this.movePageLeftButton.ui = true;
    this.movePageLeftButton.sheetIndex = 0;
    this.add(this.movePageLeftButton);


    this.movePageRightButton = new powerupjs.Button(sprites.arrowButtons, ID.layer_overlays); // button to move to previous page of blocks
    this.movePageRightButton.position = new powerupjs.Vector2(1000, 685);
    this.movePageRightButton.ui = true;
    this.movePageRightButton.sheetIndex = 1;
    this.add(this.movePageRightButton);


    this.editingMenu = new EditingMenuGUI(); // editing menu
    this.editingMenu.position = new powerupjs.Vector2(400, 600);
    this.add(this.editingMenu);

    this.playButton = new LabelledButton(sprites.button_default, "Return", "Arial", "20px", ID.layer_overlays); // button to return to title screen
    this.playButton.position = new powerupjs.Vector2(120, 95);
    this.playButton.ui = true;
    this.add(this.playButton);

    this.playerStartPos = new DraggableObject(sprites.portal, ID.layer_overlays_2, ID.player_spawn); // draggable player start position marker
    this.playerStartPos.position = new powerupjs.Vector2(400, 400);
    this.add(this.playerStartPos);

    this.saveButton = new LabelledButton(sprites.button_default, "Save", "Arial", "20px", ID.layer_overlays);
    this.saveButton.position = new powerupjs.Vector2(120, 40);
    this.saveButton.ui = true;
    this.add(this.saveButton);

    this.swipeCheckBox = new CheckBox(sprites.button_default, ID.layer_overlays);
    this.swipeCheckBox.position = new powerupjs.Vector2(120, 150);
    this.swipeCheckBox.ui = true;
    this.add(this.swipeCheckBox);


    this.swiping = false;

    this.loadModeButtons(); // load mode buttons
}

GameplayEditorState.prototype = Object.create(powerupjs.GameObjectList.prototype);

GameplayEditorState.prototype.getActiveRoomData = function () {
    var levelIndex = WorldSettings.currentLevelIndex;
    var levelData = window.LEVELS[levelIndex];
    if (!levelData || typeof levelData !== 'object') {
        WorldSettings.createLevel(levelIndex);
        levelData = window.LEVELS[levelIndex];
    }

    levelData = WorldSettings.normalizeLevelData(levelData);
    window.LEVELS[levelIndex] = levelData;

    var runtimeLevel = WorldSettings.currentLevel;
    var roomIndex = runtimeLevel && typeof runtimeLevel.currentRoomIndex === 'number'
        ? runtimeLevel.currentRoomIndex
        : 0;

    while (levelData.rooms.length <= roomIndex) {
        levelData.rooms.push(WorldSettings.createDefaultRoomData());
    }

    levelData.activeRoomIndex = roomIndex;
    WorldSettings.syncRoomAlias(levelData);
    return levelData.room;
}

GameplayEditorState.prototype.loadLayers = function () {
    var roomData = this.getActiveRoomData();
    // Ensure active room backgrounds are rebuilt whenever editor loads/switches rooms.
    WorldSettings.currentLevel.room.loadBackground();
    // Room refactor: editor spawn marker reads from room-owned spawn data.
    var spawnData = roomData.playerSpawnPos;
    if (spawnData.x == null) {
        this.playerStartPos.position = new powerupjs.Vector2(400, 400);
    }
    else {
        this.playerStartPos.position = new powerupjs.Vector2(spawnData.x, spawnData.y)
    }
    // Room refactor: camera bounds are room-owned and mirrored onto WorldSettings helper.
    WorldSettings.cameraBounds = roomData.cameraBounds
    this.syncCameraBoundsHandles();

    for (var i = 0; i < this.editorLayers.length; i++) {
        this.editorLayers.at(i).clear();
        this.editorLayers.at(i).loadTiles(); // load tiles for each editor layer
    }



}

GameplayEditorState.prototype.loadModeButtons = function () {
    for (var i = 0; i < this.modes.length; i++) {
        var button = new LabelledButton(sprites.button_default, this.modes[i], "Arial", "20px", ID.layer_overlays); // create button for each mode
        button.position = new powerupjs.Vector2(250, 650 + i * 60);
        button.ui = true;
        this.modeButtons.add(button);
    }

}

GameplayEditorState.prototype.update = function (delta) {
    // In editor mode, only the active room should be visible and editable.
    for (var i = 0; i < WorldSettings.currentLevel.rooms.length; i++) {
        var room = WorldSettings.currentLevel.rooms.at(i);
        if (room) room.visible = (i === WorldSettings.currentLevel.currentRoomIndex);
    }
    WorldSettings.currentLevel.update(delta);
    powerupjs.GameObjectList.prototype.update.call(this, delta);
    if (this.mode == "Drawing") {
        this.objectMenu.visible = true;
        this.editingMenu.visible = false;
    }
    else if (this.mode == "Erasing" || this.mode == "Editing") {
        this.editingMenu.visible = true;
        this.objectMenu.visible = false;
    }

    if (!this.isDraggingCameraBoundsHandle()) {
        this.syncCameraBoundsHandles();
    }

    this.currentRoomDisplay.text = "Room: " + (WorldSettings.currentLevel.currentRoomIndex + 1) + "/" + WorldSettings.currentLevel.rooms.length;
}

GameplayEditorState.prototype.draw = function () {
    WorldSettings.currentLevel.draw();
    this.drawCameraBoundsOutline();
    powerupjs.GameObjectList.prototype.draw.call(this);

}

GameplayEditorState.prototype.drawCameraBoundsOutline = function() {
    var room = WorldSettings.currentLevel && WorldSettings.currentLevel.room;
    if (!room || !room.cameraBounds) return;

    var scale = (typeof room.scale === 'number' && room.scale !== 0) ? room.scale : 1;
    var bounds = room.cameraBounds;
    var scaledBounds = new powerupjs.Rectangle(
        bounds.x * scale,
        bounds.y * scale,
        bounds.width * scale,
        bounds.height * scale
    );

    scaledBounds.draw("cyan");
}

GameplayEditorState.prototype.saveLevel = function () {
    for (var i = 0; i < this.editorLayers.length; i++) { // for each editor layer
        this.editorLayers.at(i).saveTiles(); // save current editor layer tiles
    }
    var activeRoom = WorldSettings.currentLevel.room;
    var spawnPosition = this.playerStartPos.position.copy();
    // Keep runtime room state in sync so saveLevels does not overwrite spawn with stale values.
    activeRoom.playerStartPos = spawnPosition.copy();
    var roomData = this.getActiveRoomData();
    // Room refactor: persist spawn marker back to room payload.
    roomData.playerSpawnPos = { x: spawnPosition.x, y: spawnPosition.y }; // save player spawn position
    WorldSettings.saveLevels(); // save levels to local storage
}

GameplayEditorState.prototype.adjustScale = function(value) {
    WorldSettings.currentLevel.room.scale += value
    var roomData = this.getActiveRoomData();
    // Room refactor: persist scale at room scope.
    roomData.scale = WorldSettings.currentLevel.room.scale;    // Adjust scale
    WorldSettings.currentLevel.room.scaleCameraBounds();
    WorldSettings.currentLevel.room.loadBackground() // Reload everything
    this.saveLevel();   // Save level data
    powerupjs.GameStateManager.get(ID.game_state_editor).loadLayers(); // load editor layers
    powerupjs.GameStateManager.get(ID.game_state_playing).loadLevel(); // load level in playing state
}

GameplayEditorState.prototype.getScaledCameraBounds = function() {
    var room = WorldSettings.currentLevel && WorldSettings.currentLevel.room;
    if (!room || !room.cameraBounds) return null;
    var scale = (typeof room.scale === 'number' && room.scale !== 0) ? room.scale : 1;

    return new powerupjs.Rectangle(
        room.cameraBounds.x * scale,
        room.cameraBounds.y * scale,
        room.cameraBounds.width * scale,
        room.cameraBounds.height * scale
    );
}

GameplayEditorState.prototype.syncCameraBoundsHandles = function() {
    var scaled = this.getScaledCameraBounds();
    if (!scaled) return;

    var centerX = scaled.x + (scaled.width / 2);
    var centerY = scaled.y + (scaled.height / 2);

    this.extendCamBoundsLeft.position = new powerupjs.Vector2(scaled.x, centerY);
    this.extendCamBoundsRight.position = new powerupjs.Vector2(scaled.x + scaled.width, centerY);
    this.extendCamBoundsUp.position = new powerupjs.Vector2(centerX, scaled.y);
    this.extendCamBoundsDown.position = new powerupjs.Vector2(centerX, scaled.y + scaled.height);
}

GameplayEditorState.prototype.isDraggingCameraBoundsHandle = function() {
    return !!(
        this.extendCamBoundsLeft.dragging ||
        this.extendCamBoundsRight.dragging ||
        this.extendCamBoundsUp.dragging ||
        this.extendCamBoundsDown.dragging
    );
}

GameplayEditorState.prototype.persistRoomCameraBounds = function() {
    var roomData = this.getActiveRoomData();
    if (!roomData || !roomData.cameraBounds) return;
    roomData.cameraBounds.x = WorldSettings.currentLevel.room.cameraBounds.x;
    roomData.cameraBounds.y = WorldSettings.currentLevel.room.cameraBounds.y;
    roomData.cameraBounds.width = WorldSettings.currentLevel.room.cameraBounds.width;
    roomData.cameraBounds.height = WorldSettings.currentLevel.room.cameraBounds.height;
}

GameplayEditorState.prototype.applyCameraBoundsFromHandles = function() {
    var room = WorldSettings.currentLevel && WorldSettings.currentLevel.room;
    if (!room || !room.cameraBounds) return false;

    var scale = (typeof room.scale === 'number' && room.scale !== 0) ? room.scale : 1;
    var scaled = this.getScaledCameraBounds();
    if (!scaled) return false;

    var left = scaled.x;
    var right = scaled.x + scaled.width;
    var top = scaled.y;
    var bottom = scaled.y + scaled.height;

    var changed = false;
    var viewportWidth = (powerupjs.Camera && powerupjs.Camera.viewWidth) ? powerupjs.Camera.viewWidth : powerupjs.Game.size.x;
    var viewportHeight = (powerupjs.Camera && powerupjs.Camera.viewHeight) ? powerupjs.Camera.viewHeight : powerupjs.Game.size.y;
    var minWidthScaled = viewportWidth;
    var minHeightScaled = viewportHeight;

    if (this.extendCamBoundsLeft.dragging) {
        left = Math.min(this.extendCamBoundsLeft.position.x, right - minWidthScaled);
        changed = true;
    }
    if (this.extendCamBoundsRight.dragging) {
        right = Math.max(this.extendCamBoundsRight.position.x, left + minWidthScaled);
        changed = true;
    }
    if (this.extendCamBoundsUp.dragging) {
        top = Math.min(this.extendCamBoundsUp.position.y, bottom - minHeightScaled);
        changed = true;
    }
    if (this.extendCamBoundsDown.dragging) {
        bottom = Math.max(this.extendCamBoundsDown.position.y, top + minHeightScaled);
        changed = true;
    }

    if (!changed) return false;

    room.cameraBounds.x = left / scale;
    room.cameraBounds.y = top / scale;
    room.cameraBounds.width = (right - left) / scale;
    room.cameraBounds.height = (bottom - top) / scale;
    this.persistRoomCameraBounds();

    return true;
}

GameplayEditorState.prototype.isMouseOverEditorButton = function() {
    var mouseScreen = powerupjs.Mouse.screenPosition;
    var mouseWorld = powerupjs.Mouse.position;

    var directButtons = [
        this.nextRoomButton,
        this.previousRoomButton,
        this.addTravelPointButton,
        this.addRoomButton,
        this.playButton,
        this.saveButton,
        this.swipeCheckBox,
        this.movePageLeftButton,
        this.movePageRightButton
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

    if (this.objectMenu && this.objectMenu.visible) {
        if (this.objectMenu.frame && this.objectMenu.frame.boundingBox && this.objectMenu.frame.boundingBox.contains(mouseScreen)) {
            return true;
        }
        for (var bi = 0; bi < this.objectMenu.blockIcons.length; bi++) {
            var icon = this.objectMenu.blockIcons.at(bi);
            if (!icon || !icon.visible || !icon.boundingBox) continue;
            if (icon.boundingBox.contains(mouseScreen)) return true;
        }
    }

    if (this.editingMenu && this.editingMenu.visible) {
        if (this.editingMenu.frame && this.editingMenu.frame.boundingBox && this.editingMenu.frame.boundingBox.contains(mouseScreen)) {
            return true;
        }
        for (var eb = 0; eb < this.editingMenu.buttons.length; eb++) {
            var editButton = this.editingMenu.buttons.at(eb);
            if (!editButton || !editButton.visible || !editButton.boundingBox) continue;
            if (editButton.boundingBox.contains(mouseScreen)) return true;
        }
    }

    var worldHandles = [
        this.extendCamBoundsLeft,
        this.extendCamBoundsRight,
        this.extendCamBoundsUp,
        this.extendCamBoundsDown
    ];
    for (var h = 0; h < worldHandles.length; h++) {
        var handle = worldHandles[h];
        if (!handle || !handle.visible || !handle.boundingBox) continue;
        if (handle.boundingBox.contains(mouseWorld)) return true;
    }

    return false;
}

GameplayEditorState.prototype.handleInput = function (delta) {
        powerupjs.GameObjectList.prototype.handleInput.call(this, delta);
        WorldSettings.currentLevel.handleInput(delta);
    for (var i = 0; i < this.modeButtons.length; i++) {
        var button = this.modeButtons.at(i);
        if (button.pressed) {
            this.mode = this.modes[i];
            return;
        }
    }

    if (this.addTravelPointButton.pressed) {
        this.mode = "Drawing";
        this.objectMenu.visible = true;
        this.editingMenu.visible = false;
        WorldSettings.currentBlock = { sprite: sprites.portal, sheetIndex: 0 };
        this.objectMenu.blockSelector.visible = false;
        return;
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

    if (this.addRoomButton.pressed) {
        WorldSettings.currentLevel.addRoom();
        WorldSettings.currentLevel.currentRoomIndex = WorldSettings.currentLevel.rooms.length - 1;
        var roomData = this.getActiveRoomData();
        if (!Array.isArray(roomData.backgrounds) || roomData.backgrounds.length === 0) {
            roomData.backgrounds = [0, 1];
        }
        WorldSettings.currentLevel.room.loadBackground();
        this.loadLayers();
        return;
    }

    if (this.nextRoomButton.pressed) {
        var currentRoomIndex = WorldSettings.currentLevel.currentRoomIndex;
        var nextRoomIndex = (currentRoomIndex + 1) % WorldSettings.currentLevel.rooms.length;
        WorldSettings.currentLevel.currentRoomIndex = nextRoomIndex;
        this.getActiveRoomData();
        WorldSettings.currentLevel.room.loadBackground();
        this.loadLayers();
        return;
    }

    if (this.previousRoomButton.pressed) {
        var currentRoomIndex = WorldSettings.currentLevel.currentRoomIndex;
        var previousRoomIndex = (currentRoomIndex - 1 + WorldSettings.currentLevel.rooms.length) % WorldSettings.currentLevel.rooms.length;
        WorldSettings.currentLevel.currentRoomIndex = previousRoomIndex;
        this.getActiveRoomData();
        WorldSettings.currentLevel.room.loadBackground();
        this.loadLayers();
        return;
    }

    if (this.saveButton.pressed) {
        this.saveLevel();
        this.saveButton.text = "Saved!";
        // setTimeout(this.saveButton.resetText, 5000);
        return
    }
    if (powerupjs.Keyboard.pressed(powerupjs.Keys.A)) {
        if (confirm("Clear all Tiles?")) this.editorLayers.at(this.currentEditorLayer).clear(); // clear current editor layer

    }

    if (this.playButton.pressed) {
        // if (confirm("Save level before exiting?")) this.saveLevel();
        powerupjs.GameStateManager.switchTo(ID.game_state_title); // return to title screen
        WorldSettings.currentState = "title";
        powerupjs.Camera.position = powerupjs.Vector2.zero; // reset camera position
        return
    }

    if (this.movePageLeftButton.pressed) {
        this.objectMenu.pageNumber = this.objectMenu.pageNumber - 1;
        return;
    }

    if (this.movePageRightButton.pressed) {
        this.objectMenu.pageNumber = this.objectMenu.pageNumber + 1;
        return;
    }

    if (this.isMouseOverEditorButton()) {
        this.editingTiles = false;
    }

    if ((powerupjs.Mouse.left.pressed || (this.swiping && powerupjs.Mouse.left.down)) && this.editingTiles) { // place/edit once per click

        if (this.mode == "Drawing") {
            var field = this.editorLayers.at(this.currentEditorLayer) // get current editor layer
            if (field.hasTileAt(powerupjs.Mouse.position)) {
                field.removeTileAt(powerupjs.Mouse.position); // remove tile if one already exists at mouse position
            }
            field.addTileAt(field.getTileByMouse(powerupjs.Mouse.position), "#", WorldSettings.currentBlock); // add tile at mouse position
        }
        else if (this.mode == "Erasing") {
            var field = this.editorLayers.at(this.currentEditorLayer) // get current editor layer
            field.removeTileAt(powerupjs.Mouse.position); // remove tile at mouse position
        }
        else if (this.mode == "Editing") {
            var field = this.editorLayers.at(this.currentEditorLayer) // get current editor layer
            var tile = field.getTileAt(powerupjs.Mouse.position); // get tile at mouse position
            if (tile != null) {
                this.editingMenu.selectedObj = tile; // set selected object in editing menu
            }
        }
    }

    if (powerupjs.Mouse.middle.down) { // pan camera with middle mouse button
        powerupjs.Camera.position.addTo(
            powerupjs.Mouse.screenPosition.subtractFrom(this.previousMousePosition).multiplyWith(-1) // move camera opposite to mouse movement
        );
    }



    this.previousMousePosition = powerupjs.Mouse.screenPosition.copy(); // store current mouse position for next frame
    this.editingTiles = true;

}


