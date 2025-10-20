function Level() {
    powerupjs.GameObjectList.call(this);
    this.tileFields = []; // array to hold tile fields
    this.playerStartPos = powerupjs.Vector2.zero; // default player start position
}

Level.prototype = Object.create(powerupjs.GameObjectList.prototype);

Level.prototype.loadTiles = function () {

}
