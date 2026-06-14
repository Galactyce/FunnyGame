function WorldSettingsSingleton() {
    this.currentLevelIndex = 0;
    this.activeLayer = 0;
    this.levels = [];
    this.blockSprites = []; // list of block sprites
    this.currentBlock = undefined; // current block sprite
    this.currentBlockIndex = 0; // index of current block in blockSprites
    this.activePlayer;
    this.currentState;
    this.mapBottom;
    //  GLOBAL PROPERTIES   //

    this.gravity = 3;
    this.wallSlideSpeed = 50;
    this.cameraSmoothingFactor = 5;
    this._terminalVelocity = 130; // max downward speed

    // MANAGING PLAYER PROPERTIES CAN BE DONE IN "PlayerProperties.js"
}

WorldSettingsSingleton.prototype.loadLevels = function () { // load levels from window.LEVELS 
    this.levels = [];   // clear current levels
    window.LEVELS = []; // clear current LEVELS object
    if (localStorage.levels) {   // if level data exists in local storage
        try {
            var storedLevels = JSON.parse(localStorage.levels);
            if (!Array.isArray(storedLevels)) storedLevels = [];
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
        var levelIndex = this.indexOfLevel(level);
        if (levelIndex === null) continue;
        if (!window.LEVELS[levelIndex] || typeof window.LEVELS[levelIndex] !== 'object') {
            window.LEVELS[levelIndex] = {};
        }
        window.LEVELS[levelIndex].tiles = level.tiles || [];
        window.LEVELS[levelIndex].scale = level.scale;
        window.LEVELS[levelIndex].cameraBounds = {
            x: level.cameraBounds.x,
            y: level.cameraBounds.y,
            width: level.cameraBounds.width,
            height: level.cameraBounds.height
        };
        window.LEVELS[levelIndex].name = level.name;
        window.LEVELS[levelIndex].playerSpawnPos = {
            x: level.playerStartPos.x,
            y: level.playerStartPos.y
        };
        if (!window.LEVELS[levelIndex].backgrounds) {
            window.LEVELS[levelIndex].backgrounds = [];
        }
    }
    localStorage.levels = JSON.stringify(window.LEVELS);
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
    level.tiles = Array.isArray(levelData.tiles) ? levelData.tiles : [];
    level.scale = typeof levelData.scale === 'number' ? levelData.scale : 1;  // load scale
    var bounds = levelData.cameraBounds; // load camera bounds
    if (bounds && typeof bounds.x === 'number') {
        level.cameraBounds = new powerupjs.Rectangle(bounds.x, bounds.y, 
            bounds.width, bounds.height); // set camera bounds
    } else {
        level.cameraBounds = new powerupjs.Rectangle(-500, -400, 3000, 1400);
    }
    if (levelData.playerSpawnPos && typeof levelData.playerSpawnPos.x === 'number') {
        level.playerStartPos = new powerupjs.Vector2(levelData.playerSpawnPos.x, levelData.playerSpawnPos.y);
    }
    else {
        level.playerStartPos = new powerupjs.Vector2(400, 400);
    }
    level.name = typeof levelData.name === 'string' ? levelData.name : 'New'; // set level name
}

WorldSettingsSingleton.prototype.indexOfSprite = function (sprite) { // get index of sprite in blockSprites
    for (var i = 0; i < this.blockSprites.length; i++) { // for each block sprite
        if (this.blockSprites[i] == sprite) return i; // return index if found
    }
    console.log("Cannot save sprite: " + sprite.image.src); // log error if not found
    return null; // return null if not found
}

WorldSettingsSingleton.prototype.createLevel = function(index) { // create new level
    index = typeof index === 'undefined' ? window.LEVELS.length : index; // default index to end of LEVELS array
    window.LEVELS[index] = {    // Create new level
        name: "New",
        tiles: [],
        cameraBounds: new powerupjs.Rectangle(-500, -400, 3000, 1400),
        playerSpawnPos: { x: 400, y: 400 },
        backgrounds: [0, 1],
        scale: 1
    }

    var level = new Level(); // create new Level object
    this.levels.splice(index, 0, level); // add level to levels array at index
    this.manageLevelProperties(level); // load level properties
    this.currentLevelIndex = index; // set current level index to new level
    localStorage.levels = JSON.stringify(window.LEVELS);
    
}

WorldSettingsSingleton.prototype.normalizeLevelData = function(levelData) {
    if (!levelData || typeof levelData !== 'object') {
        return {
            name: "New",
            tiles: [],
            cameraBounds: { x: -500, y: -400, width: 3000, height: 1400 },
            playerSpawnPos: { x: 400, y: 400 },
            backgrounds: [0, 1],
            scale: 1
        };
    }

    if (!Array.isArray(levelData.tiles)) {
        levelData.tiles = [];
    }

    if (typeof levelData.cameraBounds === 'string') {
        levelData.cameraBounds = { x: -500, y: -400, width: 3000, height: 1400 };
    }
    if (!levelData.cameraBounds || typeof levelData.cameraBounds.x !== 'number') {
        levelData.cameraBounds = levelData.cameraBounds || { x: -500, y: -400, width: 3000, height: 1400 };
    }

    if (typeof levelData.playerSpawnPos === 'string') {
        var parts = levelData.playerSpawnPos.split('|');
        levelData.playerSpawnPos = {
            x: parseFloat(parts[0]) || 400,
            y: parseFloat(parts[1]) || 400
        };
    }
    if (!levelData.playerSpawnPos || typeof levelData.playerSpawnPos.x !== 'number') {
        levelData.playerSpawnPos = { x: 400, y: 400 };
    }

    if (!Array.isArray(levelData.backgrounds)) {
        levelData.backgrounds = [0, 1];
    }

    if (typeof levelData.scale !== 'number') {
        levelData.scale = parseFloat(levelData.scale) || 1;
    }

    if (typeof levelData.name !== 'string') {
        levelData.name = 'New';
    }

    return levelData;
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
        return level.cameraBounds.y + level.cameraBounds.height + 200;
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
        return this.currentLevel.tiles;
    },
    set: function(value) {
        this.currentLevel.tiles = value;
    }
});

Object.defineProperty(WorldSettingsSingleton.prototype, "numberOfLevels", { // get number of levels
    get: function() {
        return this.levels.length;
    }
});

Object.defineProperty(WorldSettingsSingleton.prototype, "cameraBounds", { // get camera bounds of current level
    get: function() {
        return this.currentLevel.cameraBounds;
    },
    set: function(value) {
        this.currentLevel.cameraBounds = value;
    }
});

WorldSettingsSingleton.prototype.getLevel = function(levelIndex) { // get level at index
    return this.levels[levelIndex];
}

WorldSettingsSingleton.prototype.playLevel = function(levelIndex) { // load current level
    this.currentLevelIndex = levelIndex; // set current level index
    this.currentLevel.loadBackground(); // load background
    powerupjs.GameStateManager.get(ID.game_state_playing).loadLevel(); // load level in playing state
    powerupjs.GameStateManager.switchTo(ID.game_state_playing); // switch to playing state
    this.currentState = "playing"; // set current state to playing
}

WorldSettingsSingleton.prototype.editLevel = function(levelIndex) { // edit current level
    this.currentLevelIndex = levelIndex; // set current level index
    this.currentLevel.loadBackground(); // load background
    powerupjs.GameStateManager.get(ID.game_state_editor).loadLayers(); // load editor layers
    powerupjs.GameStateManager.switchTo(ID.game_state_editor); // switch to editor state
    this.currentState = "editing"; // set current state to editing
}

WorldSettingsSingleton.prototype.addBackground = function(background, levelIndex) { // set backgrounds for level
    window.LEVELS[levelIndex].backgrounds.push(background); // set backgrounds
    this.getLevel(levelIndex).loadBackground(); // load backgrounds
}

WorldSettingsSingleton.prototype.removeBackground = function(backgroundIndex, levelIndex) { // remove background from level
    window.LEVELS[levelIndex].backgrounds.splice(backgroundIndex, 1); // remove background
    this.getLevel(levelIndex).loadBackground(); // load backgrounds
}

WorldSettingsSingleton.prototype.setPlayerSpawn = function(position, levelIndex) { // set player spawn position for level
    window.LEVELS[levelIndex].playerSpawnPos = {x: position.x, y: position.y}; // set player spawn position
}

var WorldSettings = new WorldSettingsSingleton();
