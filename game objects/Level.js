function Level() {
    powerupjs.GameObjectList.call(this);
    this.tileFields = [];
    this.playerStartPos = powerupjs.Vector2.zero;
}

Level.prototype = Object.create(powerupjs.GameObjectList.prototype);

Level.prototype.loadTiles = function() {
    
}
