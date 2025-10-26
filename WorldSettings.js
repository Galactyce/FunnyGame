function WorldSettings() {
    this.gravity = 3;
    this.currentLevelIndex = 0;
    this.currentLevel;
    this.activeLayer = 0;
    this.levels = [];
    this.blockSprites = []; // list of block sprites
    this.currentBlock; // current block sprite
    this.currentBlockIndex = 0; // index of current block in blockSprites
    this.terminalVelocity = 100; // max downward speed
    this.wallSlideSpeed = 25;
    this.activePlayer;
    this.currentState;
}

WorldSettings.prototype.loadLevels = function () { // load levels from window.LEVELS
    this.levels = [];
    for (var i = 0; i < window.LEVELS.length; i++) { // for each level in window.LEVELS
        var level = new Level(); // create new Level object
        level.tiles = window.LEVELS[i].tiles; // load tile data
        console.log(level.tiles)
        level.cameraBounds = window.LEVELS[i].cameraBounds
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
    window.LEVELS.push({
        name: "New",
        tiles: [],
        cameraBounds: new powerupjs.Rectangle(-500, -400, 3000, 1400),
        playerSpawnPos: ""
    })
}

var WorldSettings = new WorldSettings();