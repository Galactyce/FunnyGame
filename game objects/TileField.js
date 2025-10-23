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

TileField.prototype.getTileByMouse = function () {
    return new powerupjs.Vector2(Math.floor((powerupjs.Mouse.position.x - this.position.x) / this.cellWidth), // calculate tile index based on mouse position
        Math.floor((powerupjs.Mouse.position.y - this.position.y) / this.cellHeight));
}

TileField.prototype.update = function (delta) {
    powerupjs.GameObjectList.prototype.update.call(this, delta);
}

TileField.prototype.addTileAt = function (index, tileKey, sprite, rotation) {
    var sprite = typeof sprite !== 'undefined' ? sprite : sprites.defaultTile; // default sprite if none provided
    rotation = typeof rotation !== 'undefined' ? rotation : 0;
    var tile = new Tile(sprite);
    if (this.tileKey !== null) tile.key = this.tileKey; // use current tile key
    else tile.key = tileKey;
    tile.position = new powerupjs.Vector2(index.x * this.cellWidth + (this.cellWidth / 2), index.y * this.cellHeight + (this.cellHeight / 2)); // set tile position based on index
    tile.index = index; // store tile index
    tile.rotation = rotation;
    tile.playAnimation("normal");
    tile.origin = tile.center;
    tile.manageHitboxes(sprite); // set hitbox based on sprite
    this.add(tile);
}

TileField.prototype.removeTileAt = function (index) {
    for (var i = 0; i < this.length; i++) {
        if (this.at(i).index.equals(index)) { // find tile at index
            this.remove(this.at(i));
        }
    }
}

TileField.prototype.getTileAt = function (position) {
    for (var i = 0; i < this.length; i++) {
        if (this.at(i).boundingBox.contains(position)) { // find tile at index
            return this.at(i);
        }
    }
    return null;
}

TileField.prototype.saveTiles = function () {
    this.data = TileDataManager.writeTiles(this._gameObjects); // serialize tiles
    window.LEVELS[WorldSettings.currentLevelIndex].tiles[this.editorLayer] = this.data; // save to LEVELS
    if (!this.data) // nothing to save
        return;
    localStorage.levels = JSON.stringify(window.LEVELS); // save to local storage
    WorldSettings.levels[WorldSettings.currentLevelIndex].tileFields[this.editorLayer] = this; // update world settings
}

TileField.prototype.loadTiles = function () {
    if (!localStorage.levels) return; // nothing to load
    window.LEVELS = JSON.parse(localStorage.levels); // load from local storage
    this.data = window.LEVELS[WorldSettings.currentLevelIndex].tiles[this.editorLayer]; // get tile data
    if (!this.data) return; // no tile data
    var splitData = this.data.split("/"); // split into individual tile data
    for (var i = 0; i < splitData.length; i++) { // for each tile
        if (splitData[i] == "") continue; // skip empty data

        var tileData = splitData[i].split("|"); // split tile data into components
        this.addTileAt(new powerupjs.Vector2((tileData[1] - (this.cellWidth / 2)) / this.cellWidth, (tileData[2] - (this.cellHeight / 2)) / this.cellHeight), 
        tileData[0], WorldSettings.blockSprites[parseInt(tileData[3])], parseFloat(tileData[4])); // add tile at index with sprite

    }
    WorldSettings.levels[WorldSettings.currentLevelIndex].tileFields[this.editorLayer] = this; // update world settings
}
