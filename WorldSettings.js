function WorldSettings() {
    this.currentLevelIndex = 0;
    this.currentLevel;
    this.activeLayer = 0;
    this.levels = [];
    this.blockSprites = []; // list of block sprites
    this.currentBlock; // current block sprite
    this.currentBlockIndex = 0; // index of current block in blockSprites
    this.activePlayer;
    this.currentState;
    

    //  GLOBAL PROPERTIES   //

    this.gravity = 3;
    this.wallSlideSpeed = 25;
    this.cameraSmoothingFactor = 5;
    this.terminalVelocity = 130; // max downward speed

    // MANAGING PLAYER PROPERTIES CAN BE DONE IN "PlayerProperties.js"
}

WorldSettings.prototype.loadLevels = function () { // load levels from window.LEVELDATA 
    this.levels = [];
    window.LEVELS = [];

    if (localStorage.levelData) {
        window.LEVELDATA = JSON.parse(localStorage.levelData).filter(item => item !== null);

        for (var i = 0; i < window.LEVELDATA.length; i++) {     // Creates window.LEVELS object and edits it with level data
            window.LEVELS.push({
            name: "New",
            tiles: [],
            cameraBounds: new powerupjs.Rectangle(-500, -400, 3000, 1400),
            playerSpawnPos: "400|400",
            backgrounds: [0, 1],
            scale: 1
            })
            DecryptRawLevelData(window.LEVELDATA[i], i)
        }
    }   
    for (var i = 0; i < window.LEVELS.length; i++) {    // Create Level objects for each level;
        var level = new Level(); // create new Level object
        level.tiles = window.LEVELS[i].tiles; // load tile data
        level.scale = window.LEVELS[i].scale;
        var bounds = window.LEVELS[i].cameraBounds
        level.cameraBounds = new powerupjs.Rectangle(bounds.x * window.LEVELS[i].scale, bounds.y * window.LEVELS[i].scale, 
            bounds.width * window.LEVELS[i].scale, bounds.height * window.LEVELS[i].scale)
        level.name = window.LEVELS[i].name;
        this.levels.push(level); // add level to levels array
    }
}

WorldSettings.prototype.indexOfSprite = function (sprite) { // get index of sprite in blockSprites
    for (var i = 0; i < this.blockSprites.length; i++) { // for each block sprite
        if (this.blockSprites[i] == sprite) return i; // return index if found
    }
    console.log("Cannot save sprite: " + sprite.image.src); // log error if not found
    return null; // return null if not found
}

WorldSettings.prototype.createLevel = function() {
    window.LEVELS.push({    // Create new level
        name: "New",
        tiles: [],
        cameraBounds: new powerupjs.Rectangle(-500, -400, 3000, 1400),
        playerSpawnPos: "400|400",
        backgrounds: [0, 1],
        scale: 1
    })
    window.LEVELDATA[window.LEVELS.length - 1] = saveLevelToTxt(window.LEVELS.length - 1)   // Create LEVELDATA with new level
    localStorage.levelData = JSON.stringify(window.LEVELDATA);  // Save level data and levels
    localStorage.levels = JSON.stringify(window.LEVELS);
    this.levels = [];

    for (var i = 0; i < window.LEVELS.length; i++) {    // Remake the levels
        var level = new Level(); // create new Level object
        level.tiles = window.LEVELS[i].tiles; // load tile data
        level.cameraBounds = window.LEVELS[i].cameraBounds
        level.name = window.LEVELS[i].name;
        this.levels.push(level); // add level to levels array
        this.currentLevelIndex = i;
    }
}

var WorldSettings = new WorldSettings();