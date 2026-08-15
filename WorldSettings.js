function WorldSettingsSingleton() {
    this.currentLevelIndex = 0;
    this.activeLayer = 0;
    this.levels = [];
    this.blockSprites = []; // list of block sprites
    this._playingState = null;
    this.currentBlock = undefined; // current block sprite
    this.currentBlockIndex = 0; // index of current block in blockSprites
    this.activePlayer;
    this.currentState;
    this.mapBottom;
    this.debugMode = false;
    //  GLOBAL PROPERTIES   //

    this.gravity = 25;
    this.wallSlideSpeed = 30;
    this.cameraSmoothingFactor = 1.5;
    this._terminalVelocity = 530; // max downward speed

    // MANAGING PLAYER PROPERTIES CAN BE DONE IN "PlayerProperties.js"
}

Object.defineProperty(WorldSettingsSingleton.prototype, "playingState", {
    get: function () {
        if (this._playingState) return this._playingState;
        if (powerupjs && powerupjs.GameStateManager && ID && typeof ID.game_state_playing !== "undefined") {
            this._playingState = powerupjs.GameStateManager.get(ID.game_state_playing);
        }
        return this._playingState;
    },
    set: function (value) {
        this._playingState = value;
    }
});

WorldSettingsSingleton.prototype.createDefaultRoomData = function() {
    return {
        tiles: [],
        cameraBounds: { x: -500, y: -400, width: 3000, height: 1400 },
        playerSpawnPos: { x: 400, y: 400 },
        backgrounds: [0, 1],
        scale: 1,
        travelPoints: []
    };
}

WorldSettingsSingleton.prototype.syncRoomAlias = function(levelData) {
    if (!levelData || !Array.isArray(levelData.rooms) || levelData.rooms.length === 0) {
        return levelData;
    }

    var roomIndex = typeof levelData.activeRoomIndex === 'number' ? levelData.activeRoomIndex : 0;
    if (roomIndex < 0 || roomIndex >= levelData.rooms.length) roomIndex = 0;
    levelData.activeRoomIndex = roomIndex;
    // Keep legacy alias for existing code paths while canonical data lives in rooms[].
    levelData.room = levelData.rooms[roomIndex];
    return levelData;
}

WorldSettingsSingleton.prototype.loadLevels = function () { // load levels from window.LEVELS 
    this.levels = [];   // clear current levels
    if (localStorage.levels) {   // if level data exists in local storage
        try {
            var storedLevels = JSON.parse(localStorage.levels);
            if (!Array.isArray(storedLevels)) storedLevels = [];
            // Normalize every saved record into the new canonical structure:
            // { name, rooms: [room], activeRoomIndex, room(alias) }
            // This allows older flat level saves to continue loading.
            window.LEVELS = storedLevels.filter(item => item !== null).map(this.normalizeLevelData.bind(this)); // load level data from local storage
        }
        catch (e) {
            window.LEVELS = [];
        }
    }

    if (!Array.isArray(window.LEVELS) || window.LEVELS.length === 0) {
        this.createLevel(); // create default level if no valid level data exists
    }

    for (var i = 0; i < window.LEVELS.length; i++) {    // Create Level objects for each level;
        var level = new Level(); // create new Level object
        this.levels.push(level); // add level to levels array
        this.manageLevelProperties(level); // load level properties
    }
}

WorldSettingsSingleton.prototype.saveLevels = function () { // save levels to local storage
    for (var i = 0; i < this.levels.length; i++) {
        var level = this.levels[i];
        var levelIndex = this.indexOfLevel(level); // get index of level in levels array
        if (levelIndex === null) continue;
        // Ensure destination record exists even if previous save data was malformed.
        if (!window.LEVELS[levelIndex] || typeof window.LEVELS[levelIndex] !== 'object') {
            window.LEVELS[levelIndex] = this.normalizeLevelData(null);
        }

        var levelData = window.LEVELS[levelIndex];
        // Ensure nested rooms list exists before writing room-owned fields.
        if (!Array.isArray(levelData.rooms) || levelData.rooms.length === 0) {
            levelData = this.normalizeLevelData(levelData);
            window.LEVELS[levelIndex] = levelData;
        }
        this.syncRoomAlias(levelData);

        var existingRooms = Array.isArray(levelData.rooms) ? levelData.rooms.slice() : [];

        // Name remains level-scoped metadata.
        levelData.name = level.name;

        // Persist every runtime room into LEVELS[level].rooms.
        levelData.rooms = [];
        for (var r = 0; r < level.rooms.length; r++) {
            var runtimeRoom = level.rooms.at(r);
            if (!runtimeRoom) continue;

            var existingRoomData = existingRooms[r] || null;
            var savedBackgrounds = existingRoomData && Array.isArray(existingRoomData.backgrounds) && existingRoomData.backgrounds.length > 0
                ? existingRoomData.backgrounds
                : [0, 1];

            levelData.rooms.push({
                tiles: runtimeRoom.tiles || [],
                scale: runtimeRoom.scale,
                cameraBounds: {
                    x: runtimeRoom.cameraBounds.x,
                    y: runtimeRoom.cameraBounds.y,
                    width: runtimeRoom.cameraBounds.width,
                    height: runtimeRoom.cameraBounds.height
                },
                playerSpawnPos: {
                    x: runtimeRoom.playerStartPos.x,
                    y: runtimeRoom.playerStartPos.y
                },
                backgrounds: savedBackgrounds,
                travelPoints: (runtimeRoom.travelPoints || []).map(function(point) {
                    if (!point || !point.position) return null;

                    return {
                        id: (typeof point.id === 'number') ? point.id : 0,
                        targetID: (typeof point.targetID === 'number') ? point.targetID : 0,
                        position: {
                            x: point.position.x,
                            y: point.position.y
                        },
                        targetRoomIndex: point.targetRoomIndex,
                        targetPosition: point.targetPosition ? {
                            x: point.targetPosition.x,
                            y: point.targetPosition.y
                        } : null
                    };
                }).filter(function(point) { return point !== null; })
            });
        }

        if (levelData.rooms.length === 0) {
            levelData.rooms.push(this.createDefaultRoomData());
        }

        levelData.activeRoomIndex = typeof level.currentRoomIndex === 'number' ? level.currentRoomIndex : 0;
        this.syncRoomAlias(levelData);
    }
    localStorage.levels = JSON.stringify(window.LEVELS); // save levels to local storage
}

WorldSettingsSingleton.prototype.indexOfLevel = function (level) { // get index of level in levels array
    for (var i = 0; i < this.levels.length; i++) { // for each level
        if (this.levels[i] == level) return i; // return index if found
    }
    return null; // return null if not found
}

WorldSettingsSingleton.prototype.manageLevelProperties = function(level) { // manage level properties
    var levelIndex = this.indexOfLevel(level);
    if (levelIndex === null) return;
    var levelData = window.LEVELS[levelIndex];
    if (!levelData || typeof levelData !== 'object') {
        levelData = this.normalizeLevelData(null);
        window.LEVELS[levelIndex] = levelData;
    }
    else if (!Array.isArray(levelData.rooms) || levelData.rooms.length === 0) {
        levelData = this.normalizeLevelData(levelData);
        window.LEVELS[levelIndex] = levelData;
    }
    // Runtime level object hydrates from persistent nested rooms data.
    level.rooms.clear();
    for (var r = 0; r < levelData.rooms.length; r++) {
        var roomData = levelData.rooms[r];
        var runtimeRoom = new Room();

        runtimeRoom.tiles = Array.isArray(roomData.tiles) ? roomData.tiles : [];
        runtimeRoom.scale = typeof roomData.scale === 'number' ? roomData.scale : 1;

        var bounds = roomData.cameraBounds;
        if (bounds && typeof bounds.x === 'number') {
            runtimeRoom.cameraBounds = new powerupjs.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
        }
        else {
            runtimeRoom.cameraBounds = new powerupjs.Rectangle(-500, -400, 3000, 1400);
        }

        if (roomData.playerSpawnPos && typeof roomData.playerSpawnPos.x === 'number') {
            runtimeRoom.playerStartPos = new powerupjs.Vector2(roomData.playerSpawnPos.x, roomData.playerSpawnPos.y);
        }
        else {
            runtimeRoom.playerStartPos = new powerupjs.Vector2(400, 400);
        }

        if (!Array.isArray(runtimeRoom.travelPoints)) {
            runtimeRoom.travelPoints = [];
        }

        var savedTravelPoints = Array.isArray(roomData.travelPoints) ? roomData.travelPoints : [];
        for (var t = 0; t < savedTravelPoints.length; t++) {
            var pointData = savedTravelPoints[t];
            if (!pointData || !pointData.position) continue;
            if (typeof pointData.position.x !== 'number' || typeof pointData.position.y !== 'number') continue;

            var travelPoint = new TravelPoint(new powerupjs.Vector2(pointData.position.x, pointData.position.y));
            if (typeof pointData.id === 'number') travelPoint.id = pointData.id;
            travelPoint.targetID = typeof pointData.targetID === 'number' ? pointData.targetID : 0;

            // Backward compatibility for older travel-point schema.
            if (travelPoint.targetID === 0 && typeof pointData.targetRoomIndex === 'number') {
                travelPoint.targetRoomIndex = pointData.targetRoomIndex;
            }
            if (pointData.targetPosition && typeof pointData.targetPosition.x === 'number' && typeof pointData.targetPosition.y === 'number') {
                travelPoint.targetPosition = new powerupjs.Vector2(pointData.targetPosition.x, pointData.targetPosition.y);
            }

            travelPoint.currentRoomIndex = r;
            runtimeRoom.travelPoints.push(travelPoint);
            runtimeRoom.add(travelPoint);
        }

        level.rooms.add(runtimeRoom);
    }

    if (typeof level.linkTravelPoints === 'function') {
        level.linkTravelPoints();
    }

    level.currentRoomIndex = typeof levelData.activeRoomIndex === 'number' ? levelData.activeRoomIndex : 0;
    if (level.currentRoomIndex < 0 || level.currentRoomIndex >= level.rooms.length) level.currentRoomIndex = 0;
    level.name = typeof levelData.name === 'string' ? levelData.name : 'New'; // set level name
}

WorldSettingsSingleton.prototype.indexOfSprite = function (sprite) { // get index of sprite in blockSprites
    for (var i = 0; i < this.blockSprites.length; i++) { // for each block sprite
        if (this.blockSprites[i] == sprite) return i; // return index if found
    }
    var spriteName = (sprite && sprite.image && sprite.image.src) ? sprite.image.src : "(missing sprite)";
    console.warn("Cannot save sprite: " + spriteName); // warn if sprite is missing from blockSprites
    return null; // return null if not found
}

WorldSettingsSingleton.prototype.createLevel = function(index) { // create new level
    index = typeof index === 'undefined' ? window.LEVELS.length : index; // default index to end of LEVELS array
    // New-level template in canonical nested rooms format.
    window.LEVELS[index] = {    // Create new level
        name: "New",
        rooms: [this.createDefaultRoomData()],
        activeRoomIndex: 0
    }
    this.syncRoomAlias(window.LEVELS[index]);

    var level = new Level(); // create new Level object
    this.levels.splice(index, 0, level); // add level to levels array at index
    this.manageLevelProperties(level); // load level properties
    this.currentLevelIndex = index; // set current level index to new level
    localStorage.levels = JSON.stringify(window.LEVELS);
    
}

WorldSettingsSingleton.prototype.normalizeLevelData = function(levelData) { // Normalize level data into canonical structure with rooms[] and activeRoomIndex. This ensures that all level records have a consistent schema, even if they were saved in older formats.
    // If data is missing/invalid, return a complete safe default object.
    if (!levelData || typeof levelData !== 'object') {
        return this.syncRoomAlias({
            name: "New",
            rooms: [this.createDefaultRoomData()],
            activeRoomIndex: 0
        });
    }

    // Backward compatibility:
    // - New format stores data in levelData.rooms[]
    // - Previous format stored data in levelData.room
    // - Legacy format stored room fields at root level object
    var roomSources = [];
    if (Array.isArray(levelData.rooms) && levelData.rooms.length > 0) {
        roomSources = levelData.rooms;
    }
    else if (levelData.room && typeof levelData.room === 'object') {
        roomSources = [levelData.room];
    }
    else {
        roomSources = [levelData];
    }

    // Build a fresh normalized object so downstream code always sees the same schema.
    var normalized = {
        name: typeof levelData.name === 'string' ? levelData.name : 'New',
        rooms: [],
        activeRoomIndex: typeof levelData.activeRoomIndex === 'number' ? levelData.activeRoomIndex : 0
    };

    for (var i = 0; i < roomSources.length; i++) {
        var roomSource = roomSources[i];
        var normalizedRoom = this.createDefaultRoomData();

        if (Array.isArray(roomSource.tiles)) {
            normalizedRoom.tiles = roomSource.tiles;
        }

        if (typeof roomSource.cameraBounds === 'string') {
            roomSource.cameraBounds = { x: -500, y: -400, width: 3000, height: 1400 };
        }
        if (roomSource.cameraBounds && typeof roomSource.cameraBounds.x === 'number') {
            normalizedRoom.cameraBounds = {
                x: roomSource.cameraBounds.x,
                y: roomSource.cameraBounds.y,
                width: roomSource.cameraBounds.width,
                height: roomSource.cameraBounds.height
            };
        }

        if (typeof roomSource.playerSpawnPos === 'string') {
            var parts = roomSource.playerSpawnPos.split('|');
            roomSource.playerSpawnPos = {
                x: parseFloat(parts[0]) || 400,
                y: parseFloat(parts[1]) || 400
            };
        }
        if (roomSource.playerSpawnPos && typeof roomSource.playerSpawnPos.x === 'number') {
            normalizedRoom.playerSpawnPos = {
                x: roomSource.playerSpawnPos.x,
                y: roomSource.playerSpawnPos.y
            };
        }

        if (Array.isArray(roomSource.backgrounds) && roomSource.backgrounds.length > 0) {
            normalizedRoom.backgrounds = roomSource.backgrounds;
        }

        if (Array.isArray(roomSource.travelPoints)) {
            normalizedRoom.travelPoints = roomSource.travelPoints
                .filter(function(point) {
                    return point && point.position;
                })
                .map(function(point) {
                    var targetRoomIndex = typeof point.targetRoomIndex === 'number' ? point.targetRoomIndex : 0;
                    var posX = parseFloat(point.position.x);
                    var posY = parseFloat(point.position.y);
                    var targetID = typeof point.targetID === 'number' ? point.targetID : 0;
                    var pointId = typeof point.id === 'number' ? point.id : 0;
                    var hasTargetPosition = point.targetPosition && typeof point.targetPosition.x !== 'undefined' && typeof point.targetPosition.y !== 'undefined';
                    var targetX = hasTargetPosition ? parseFloat(point.targetPosition.x) : null;
                    var targetY = hasTargetPosition ? parseFloat(point.targetPosition.y) : null;

                    if (isNaN(posX) || isNaN(posY)) return null;

                    return {
                        id: pointId,
                        targetID: targetID,
                        position: { x: posX, y: posY },
                        targetRoomIndex: targetRoomIndex,
                        targetPosition: (targetX !== null && targetY !== null && !isNaN(targetX) && !isNaN(targetY))
                            ? { x: targetX, y: targetY }
                            : null
                    };
                })
                .filter(function(point) { return point !== null; });
        }

        if (typeof roomSource.scale === 'number') {
            normalizedRoom.scale = roomSource.scale;
        }
        else if (typeof roomSource.scale !== 'undefined') {
            normalizedRoom.scale = parseFloat(roomSource.scale) || 1;
        }

        normalized.rooms.push(normalizedRoom);
    }

    if (normalized.rooms.length === 0) {
        normalized.rooms.push(this.createDefaultRoomData());
    }

    if (normalized.activeRoomIndex < 0 || normalized.activeRoomIndex >= normalized.rooms.length) {
        normalized.activeRoomIndex = 0;
    }

    return this.syncRoomAlias(normalized);
}


WorldSettingsSingleton.prototype.deleteLevel = function(levelIndex) { // delete level at index
    window.LEVELS.splice(levelIndex, 1); // remove level from LEVELS array
    this.levels.splice(levelIndex, 1); // remove level from levels array
    localStorage.levels = JSON.stringify(window.LEVELS);
}


Object.defineProperty(WorldSettingsSingleton.prototype, "currentLevel", { // get current level
    get: function() {
        if (this.currentLevelIndex >= this.levels.length || this.levels[this.currentLevelIndex] === undefined) return null;
        return this.levels[this.currentLevelIndex];
    },
    set: function(value) {
        this.levels[this.currentLevelIndex] = value;
    }
});

Object.defineProperty(WorldSettingsSingleton.prototype, "currentBlock", { // get/set current block sprite
    get: function() {
        if (typeof this._currentBlock !== 'undefined' && this._currentBlock !== null) {
            return this._currentBlock;
        }
        return this.blockSprites[this.currentBlockIndex];
    },
    set: function(value) {
        if (value && typeof value === 'object' && typeof value.sprite !== 'undefined') {
            this._currentBlock = value;
            return;
        }
        this.currentBlockIndex = this.blockSprites.indexOf(value);
        this._currentBlock = value;
    }
});

Object.defineProperty(WorldSettingsSingleton.prototype, "mapBottom", { // get bottom of map
    get: function() {
        var level = this.currentLevel;
        if (level == null) return 0;
        return level.room.cameraBounds.y + level.room.cameraBounds.height + 200;
    }
});

Object.defineProperty(WorldSettingsSingleton.prototype, "player", { // get/set active player
    get: function() {
        return this.activePlayer;
    },
    set: function(value) {
        this.activePlayer = value;
    }
});

Object.defineProperty(WorldSettingsSingleton.prototype, "terminalVelocity", { // get/set current game state
    get: function() {
        return this._terminalVelocity;
    },
    set: function(value) {
        this._terminalVelocity = value;
    }
});

Object.defineProperty(WorldSettingsSingleton.prototype, "tiles", { // get/set current game state
    get: function() {
        return this.currentLevel.room.tiles;
    },
    set: function(value) {
        this.currentLevel.room.tiles = value;
    }
});

Object.defineProperty(WorldSettingsSingleton.prototype, "numberOfLevels", { // get number of levels
    get: function() {
        return this.levels.length;
    }
});

Object.defineProperty(WorldSettingsSingleton.prototype, "cameraBounds", { // get camera bounds of current level
    get: function() {
        return this.currentLevel.room.cameraBounds;
    },
    set: function(value) {
        this.currentLevel.room.cameraBounds = value;
    }
});

WorldSettingsSingleton.prototype.getLevel = function(levelIndex) { // get level at index
    return this.levels[levelIndex];
}

WorldSettingsSingleton.prototype.playLevel = function(levelIndex) { // load current level
    this.currentLevelIndex = levelIndex; // set current level index
    // Guard against invalid index or failed load state.
    if (!this.currentLevel) return;
    this.currentLevel.room.loadBackground(); // load background
    powerupjs.GameStateManager.get(ID.game_state_playing).loadLevel(undefined, true); // load level in playing state
    powerupjs.GameStateManager.switchTo(ID.game_state_playing); // switch to playing state
    this.currentState = "playing"; // set current state to playing
}

WorldSettingsSingleton.prototype.editLevel = function(levelIndex) { // edit current level
    this.currentLevelIndex = levelIndex; // set current level index
    // Guard against invalid index or failed load state.
    if (!this.currentLevel) return;
    this.currentLevel.room.loadBackground(); // load background
    powerupjs.GameStateManager.get(ID.game_state_editor).loadLayers(); // load editor layers
    powerupjs.GameStateManager.switchTo(ID.game_state_editor); // switch to editor state
    this.currentState = "editing"; // set current state to editing
}

WorldSettingsSingleton.prototype.addBackground = function(background, levelIndex) { // set backgrounds for level
    // If target level data does not exist, skip safely.
    if (!window.LEVELS[levelIndex]) return;
    // Backfill nested room object for legacy level records.
    if (!window.LEVELS[levelIndex].room || typeof window.LEVELS[levelIndex].room !== 'object') {
        window.LEVELS[levelIndex] = this.normalizeLevelData(window.LEVELS[levelIndex]);
    }
    window.LEVELS[levelIndex].room.backgrounds.push(background); // set backgrounds
    var level = this.getLevel(levelIndex);
    // Runtime level object can be absent in edge cases; guard before method call.
    if (level) level.room.loadBackground(); // load backgrounds
}

WorldSettingsSingleton.prototype.removeBackground = function(backgroundIndex, levelIndex) { // remove background from level
    // If target level data does not exist, skip safely.
    if (!window.LEVELS[levelIndex]) return;
    // Backfill nested room object for legacy level records.
    if (!window.LEVELS[levelIndex].room || typeof window.LEVELS[levelIndex].room !== 'object') {
        window.LEVELS[levelIndex] = this.normalizeLevelData(window.LEVELS[levelIndex]);
    }
    window.LEVELS[levelIndex].room.backgrounds.splice(backgroundIndex, 1); // remove background
    var level = this.getLevel(levelIndex);
    // Runtime level object can be absent in edge cases; guard before method call.
    if (level) level.room.loadBackground(); // load backgrounds
}

WorldSettingsSingleton.prototype.setPlayerSpawn = function(position, levelIndex) { // set player spawn position for level
    // Backfill nested room object for legacy level records.
    if (!window.LEVELS[levelIndex].room || typeof window.LEVELS[levelIndex].room !== 'object') {
        window.LEVELS[levelIndex] = this.normalizeLevelData(window.LEVELS[levelIndex]);
    }
    window.LEVELS[levelIndex].room.playerSpawnPos = {x: position.x, y: position.y}; // set player spawn position
}



var WorldSettings = new WorldSettingsSingleton();
