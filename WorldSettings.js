function WorldSettings() {
    this.gravity = 2;
    this.currentLevelIndex = 0;
    this.activeLayer = 0;
    this.levels = [];
    this.blockSprites = [];
    this.currentBlock;
    
}

WorldSettings.prototype.loadLevels = function() {
    for (var i = 0; i < window.LEVELS.length; i++) {
        var level = new Level();
        level.tiles = window.LEVELS[i].tiles;
        this.levels.push(level)
    }
    
}

WorldSettings.prototype.indexOfSprite = function(sprite) {
    for (var i = 0; i < this.blockSprites.length; i++) {
        if (this.blockSprites[i] == sprite) return i;
    }
    console.log("Cannot save sprite: " + sprite.image.src);
    return null;
}

var WorldSettings = new WorldSettings();