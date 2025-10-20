function TileField(layer, id) {
    powerupjs.GameObjectList.call(this, layer, id);
    this.cellWidth = 32;
    this.cellHeight = 32;
    this.currentTile;
    this.tileKey = "b";
    this.data = "";
    this.fieldType = "";
    this.editorLayer = 0;
}



TileField.prototype = Object.create(powerupjs.GameObjectList.prototype);

TileField.prototype.getTileByMouse = function() {
    return new powerupjs.Vector2(Math.floor((powerupjs.Mouse.position.x - this.position.x) / this.cellWidth),
        Math.floor((powerupjs.Mouse.position.y - this.position.y) / this.cellHeight));
}

TileField.prototype.update = function(delta) {
    powerupjs.GameObjectList.prototype.update.call(this, delta);
}

TileField.prototype.addTileAt = function(index, tileKey, sprite) {
    var sprite = typeof sprite !== 'undefined' ? sprite : sprites.defaultTile;
    var tile = new Tile(sprite);
    if (this.tileKey !== null) tile.key = this.tileKey;
    else tile.key = tileKey;
    tile.position = new powerupjs.Vector2(index.x * this.cellWidth, index.y * this.cellHeight);
    tile.index = index;
    tile.manageHitboxes(sprite);
    this.add(tile);
}

TileField.prototype.removeTileAt = function(index) {
    for (var i = 0; i < this.length; i++) {
        if (this.at(i).index.equals(index)) {
            this.remove(this.at(i));
        }
    }
}

TileField.prototype.saveTiles = function() {
        this.data = TileDataManager.writeTiles(this._gameObjects);
        window.LEVELS[WorldSettings.currentLevelIndex].tiles[this.editorLayer] = this.data;
        if (!this.data) return;
        localStorage.levels = JSON.stringify(window.LEVELS);
        WorldSettings.levels[WorldSettings.currentLevelIndex].tileFields[this.editorLayer] = this;
}

TileField.prototype.loadTiles = function() {
    if (!localStorage.levels) return;
    window.LEVELS = JSON.parse(localStorage.levels);
    this.data = window.LEVELS[WorldSettings.currentLevelIndex].tiles[this.editorLayer];
    if (!this.data) return;
    var splitData = this.data.split("/");
    for (var i = 0; i < splitData.length; i++) {
        var tileData = splitData[i].split("|");
        this.addTileAt(new powerupjs.Vector2(tileData[1] / this.cellWidth, tileData[2] / this.cellHeight), tileData[0], 
            WorldSettings.blockSprites[parseInt(tileData[3])]);

    }
    WorldSettings.levels[WorldSettings.currentLevelIndex].tileFields[this.editorLayer] = this;
}
