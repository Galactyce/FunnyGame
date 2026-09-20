function Room(roomID) {
    powerupjs.GameObjectList.call(this);
    this.tileFields = new powerupjs.GameObjectList(5); // array to hold tile fields
    // Serialized tile layers for this room (kept in sync with LEVELS[].room.tiles).
    this.tiles = []; // array to hold serialized tile data for each layer
    this.enemies = []; // editor + runtime enemy placements serialized per room
    this.playerStartPos = powerupjs.Vector2.zero; // default player start position
    // Runtime camera bounds for this room; persisted under LEVELS[].room.cameraBounds.
    this.cameraBounds = new powerupjs.Rectangle(-500, -400, 3000, 1400);
    this.name;
    this.roomID = roomID;
    // Background sprites are hosted by the room so parallax can be room-scoped.
    this.backgrounds = new powerupjs.GameObjectList(1);
    // Room-specific visual/gameplay scale. Level proxies this to maintain old API calls.
    this.scale = 1;
    this.song = ""; // key into the global sounds object
    this.eventNodes = []; // { id, start, end, rhythm } definitions for this room's song
    this.add(this.tileFields);
    // Scratch/original bounds used by scaling workflows in the editor.
    this.originalBounds;
    this.travelPoints = []; // room travel connections
}

Room.prototype = Object.create(powerupjs.GameObjectList.prototype);

Room.prototype.wellFormed = function () {
    return typeof this.roomID === "number" && isFinite(this.roomID) && this.roomID >= 0 &&
        this.tileFields && Array.isArray(this.tileFields._gameObjects) &&
            this.tileFields.length === this.tileFields._gameObjects.length &&
        typeof this.scale === "number" && isFinite(this.scale) && this.scale > 0;
};

Room.prototype.wellFormedAssertions = function () {
    var valid = this.wellFormed();
    if (typeof console !== "undefined" && typeof console.assert === "function") {
        console.assert(valid, "Room is not well-formed at roomID: " + this.roomID);
    }
    return valid;
};

function assertRoomWellFormed(room) {
    room.wellFormedAssertions();
}


Room.prototype.addTravelPoint = function(travelPoint) {
    if (travelPoint instanceof TravelPoint) {
        if (!Array.isArray(this.travelPoints)) this.travelPoints = [];
        var level = WorldSettings.currentLevel;
        if (typeof travelPoint.id !== 'number' && level && typeof level.getNextTravelPointId === 'function') {
            travelPoint.id = level.getNextTravelPointId();
        }
        travelPoint.currentRoomIndex = WorldSettings.currentLevel.currentRoomIndex;
        travelPoint.roomID = this.roomID; // Assign the roomID to the travel point
        this.travelPoints.push(travelPoint);
        this.add(travelPoint);
        if (level && typeof level.linkTravelPoints === 'function') {
            level.linkTravelPoints();
        }
    }

    assertRoomWellFormed(this);
}

Room.prototype.removeTravelPoint = function(travelPoint) {
    if (!travelPoint || !Array.isArray(this.travelPoints)) return;
    var index = this.travelPoints.indexOf(travelPoint);
    if (index < 0) return;
    this.travelPoints.splice(index, 1);
    this.remove(travelPoint);
    if (WorldSettings.currentLevel && typeof WorldSettings.currentLevel.linkTravelPoints === 'function') {
        WorldSettings.currentLevel.linkTravelPoints();
    }
}



Room.prototype.getRoomData = function () { // Retrieves the canonical room data for the current room in the active level
    // Resolve the active level JSON record.
    var levelData = window.LEVELS[WorldSettings.currentLevelIndex];
    // If there is no usable level data, caller should bail out safely.
    if (!levelData || typeof levelData !== 'object') return null;

    // Backward compatibility: normalize unknown/legacy shapes into rooms[].
    if (!Array.isArray(levelData.rooms) || levelData.rooms.length === 0) {
        levelData = WorldSettings.normalizeLevelData(levelData);
        window.LEVELS[WorldSettings.currentLevelIndex] = levelData;
    }

    var currentLevel = WorldSettings.currentLevel;
    var roomIndex = currentLevel && typeof currentLevel.currentRoomIndex === 'number'
        ? currentLevel.currentRoomIndex
        : 0;

    if (roomIndex < 0 || roomIndex >= levelData.rooms.length) roomIndex = 0;
    if (currentLevel) currentLevel.currentRoomIndex = roomIndex;

    levelData.activeRoomIndex = roomIndex;
    WorldSettings.syncRoomAlias(levelData);

    // All room runtime functions read and write through this canonical nested room entry.
    return levelData.rooms[roomIndex];
    
}

Room.prototype.loadBackground = function () {  // Loads backgrounds for the level from window.LEVELS
    var roomData = this.getRoomData();
    // Missing data should not crash gameplay/editor transitions.
    if (!roomData) return;

    if (!Array.isArray(roomData.backgrounds) || roomData.backgrounds.length === 0) {
        roomData.backgrounds = [0, 1];
    }

    // Rebuild backgrounds from data every load so edits and scale changes are reflected.
    this.backgrounds.clear();

    // Camera bounds are scaled to produce the rendered room area for parallax setup.
    var camBounds = this.cameraBounds;
    for (var i = 0; i < roomData.backgrounds.length; i++) {
        var index = roomData.backgrounds[i]; // Get the background index for this layer
        var background = new powerupjs.SpriteGameObject(WorldSettings.backgrounds[index]);
        // Scale to room height, then anchor from the camera-bounds bottom edge.
        background.scale = ((camBounds.height) / (background.height));
        var scaledBackgroundHeight = background.height * background.scale;
        background.position = new powerupjs.Vector2(camBounds.x,
            (camBounds.y + camBounds.height) - scaledBackgroundHeight);
        this.backgrounds.add(background);
    }
    this.add(this.backgrounds);
    assertRoomWellFormed(this);
}

Room.prototype.loadTiles = function() {
    var roomData = this.getRoomData();
    if (!roomData) return;

    // Rebuild tile field game objects from serialized room tile-layer strings.
    this.tileFields.clear();
    // Keep a local reference to serialized tile layers for room-level operations.
    this.tiles = roomData.tiles;
    this.enemies = Array.isArray(roomData.enemies) ? roomData.enemies.slice() : [];
    // Keep camera bounds pointer aligned with room JSON data.
    this.cameraBounds = roomData.cameraBounds;
    for (var i = 0; i < roomData.tiles.length; i++) { // for each tile layer
        var field = new TileField(); // create new tile field
        field.editorLayer = i; // set layer index
        field.loadTiles();  // load tiles for the layer
        this.tileFields.add(field); // add tile field to list
    }
    assertRoomWellFormed(this);
}

Room.prototype.scaleCameraBounds = function() {

    var roomData = this.getRoomData();
    if (!roomData) return;

    // Preserve expected editor behavior from previous implementation.
    this.originalBounds = new powerupjs.Rectangle(-500, -400, 3000, 1400);
    // Persist edited camera bounds back into canonical room data.
    roomData.cameraBounds = this.cameraBounds;
    
}

Room.prototype.update = function(delta) {
    powerupjs.GameObjectList.prototype.update.call(this, delta);
    // Re-read room data each frame in case editor tools mutated active level data.
    var roomData = this.getRoomData();
    if (!roomData) return;
    // Compute scaled room bounds for parallax camera interpolation.
    var camBounds = this.cameraBounds;
    var cameraRect = new powerupjs.Rectangle(powerupjs.Camera.position.x, powerupjs.Camera.position.y,
        powerupjs.Camera.viewWidth, powerupjs.Camera.viewHeight);
    for (var i = 0; i < this.backgrounds.length; i++) {
        var background = this.backgrounds.at(this.backgrounds.length - i - 1);
        var backgroundRect = new powerupjs.Rectangle(background.position.x, background.position.y,
            background.width * background.scale, background.height * background.scale);
        // Deeper layers move slower to create parallax division by layer depth.
        cameraRect.panInnerRect(camBounds, backgroundRect, "x", i + 1);
        cameraRect.panInnerRect(camBounds, backgroundRect, "y", i + 1);
        background.position = backgroundRect.position;
    }
    // Preserve previous behavior: only show tile layers in playing state.
    if (WorldSettings.currentState == "playing") this.tileFields.visible = true;
    else this.tileFields.visible = false;
}

Room.prototype.handleInput = function(delta) {
    powerupjs.GameObjectList.prototype.handleInput.call(this, delta);
}


Object.defineProperties(Room.prototype, {
    cameraBounds: {
        get: function() {
            var roomData = this.getRoomData();
            if (!roomData) return null;
            return new powerupjs.Rectangle(
                        roomData.cameraBounds.x * WorldSettings.currentLevel.room.scale,
                        roomData.cameraBounds.y * WorldSettings.currentLevel.room.scale,
                        roomData.cameraBounds.width * WorldSettings.currentLevel.room.scale,
                        roomData.cameraBounds.height * WorldSettings.currentLevel.room.scale,

                    );
        },
        set: function(value) {
            var roomData = this.getRoomData();
            if (!roomData) return;
            roomData.cameraBounds = value;
        }
    },
    
    
    

});