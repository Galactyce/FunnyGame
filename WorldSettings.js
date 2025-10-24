function WorldSettings() {
    this.gravity = 2;
    this.currentLevelIndex = 0;
    this.currentLevel;
    this.activeLayer = 0;
    this.levels = [];
    this.blockSprites = []; // list of block sprites
    this.currentBlock; // current block sprite
    this.currentBlockIndex = 0; // index of current block in blockSprites
    this.terminalVelocity = 100; // max downward speed
}

WorldSettings.prototype.loadLevels = function () { // load levels from window.LEVELS
    this.levels = [];
    for (var i = 0; i < window.LEVELS.length; i++) { // for each level in window.LEVELS
        console.log(i)
        var level = new Level(); // create new Level object
        level.tiles = window.LEVELS[i].tiles; // load tile data
        level.cameraBounds = window.LEVELS[i].cameraBounds
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

var WorldSettings = new WorldSettings();