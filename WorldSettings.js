function WorldSettingsSingleton() {
    this.currentLevelIndex = 0;
    this.activeLayer = 0;
    this.levels = [];
    this.blockSprites = []; // list of block sprites
    this.currentBlock; // current block sprite
    this.currentBlockIndex = 0; // index of current block in blockSprites
    this.activePlayer;
    this.currentState;
    this.mapBottom;

    //  GLOBAL PROPERTIES   //

    this.gravity = 3;
    this.wallSlideSpeed = 25;
    this.cameraSmoothingFactor = 5;
    this._terminalVelocity = 130; // max downward speed

    // MANAGING PLAYER PROPERTIES CAN BE DONE IN "PlayerProperties.js"
}

WorldSettingsSingleton.prototype.loadLevels = function () { // load levels from window.LEVELDATA 
    this.levels = [];   // clear current levels
    window.LEVELS = []; // clear current LEVELS object

    if (localStorage.levels) {   // if level data exists in local storage
        window.LEVELS = JSON.parse(localStorage.levels).filter(item => item !== null); // load level data from local storage
    }
    else {
        this.createLevel(); // create default level if no level data exists
    }
    for (var i = 0; i < window.LEVELS.length; i++) {    // Create Level objects for each level;
        var level = new Level(); // create new Level object
        level.tiles = window.LEVELS[i].tiles; // load tile data
        level.scale = window.LEVELS[i].scale;  // load scale
        var bounds = window.LEVELS[i].cameraBounds; // load camera bounds
        level.cameraBounds = new powerupjs.Rectangle(bounds.x, bounds.y, 
            bounds.width, bounds.height); // set camera bounds
        level.name = window.LEVELS[i].name; // set level name
        this.levels.push(level); // add level to levels array
    }
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
        playerSpawnPos: "400|400",
        backgrounds: [0, 1],
        scale: 1
    }

    localStorage.levels = JSON.stringify(window.LEVELS);
    

    var level = new Level(); // create new Level object
    level.tiles = window.LEVELS[index].tiles; // load tile data
    level.cameraBounds = window.LEVELS[index].cameraBounds; // set camera bounds
    level.name = window.LEVELS[index].name; // set level name
    level.scale = window.LEVELS[index].scale;  // load scale
    this.levels.push(level); // add level to levels array
    this.currentLevelIndex = window.LEVELS.length - 1; // set current level index to new level
    
}

// var WorldSettings = new WorldSettings();


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
        return this.blockSprites[this.currentBlockIndex];
    },
    set: function(value) {
        this.currentBlockIndex = this.blockSprites.indexOf(value);
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

WorldSettingsSingleton.prototype.loadLevel = function(levelIndex) { // load current level
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



var WorldSettings = new WorldSettingsSingleton();
