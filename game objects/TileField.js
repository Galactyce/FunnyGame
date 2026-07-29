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

TileField.prototype.getTileByMouse = function (position) {
    var mousePosition = typeof position !== 'undefined' ? position : powerupjs.Mouse.position;
    var fieldPosition = this.worldPosition; // use world position for nested game objects
    return new powerupjs.Vector2(
        Math.floor((mousePosition.x - fieldPosition.x) / (this.cellWidth * this.scale)), // calculate tile index based on mouse position
        Math.floor((mousePosition.y - fieldPosition.y) / (this.cellHeight * this.scale))
    );
}

TileField.prototype.getTileAtIndex = function (index) {
    if (!index || isNaN(index.x) || isNaN(index.y)) return null;
    for (var i = 0; i < this.length; i++) {
        var tile = this.at(i);
        if (tile.index && tile.index.equals(index)) {
            return tile;
        }
    }
    return null;
}

TileField.prototype.update = function (delta) {
    powerupjs.GameObjectList.prototype.update.call(this, delta);
}

TileField.prototype.addTileAt = function (index, tileKey, sprite, rotation) {
    var sheetIndex = 0;
    var _sprite;
    if (typeof sprite !== 'undefined' && sprite && typeof sprite.sprite !== 'undefined') {
        sheetIndex = sprite.sheetIndex || 0;
        _sprite = sprite.sprite;
    }
    _sprite = typeof sprite !== 'undefined' ? _sprite : sprites.defaultTile; // default sprite if none provided
    rotation = typeof rotation !== 'undefined' ? rotation : 0;
    var existingTile = this.getTileAtIndex(index);
    if (existingTile) {
        this.remove(existingTile);
    }
    var tile = TileDataManager.handleObject(_sprite);
    if (this.tileKey !== null) tile.key = this.tileKey; // use current tile key
    else tile.key = tileKey;
    tile.position = new powerupjs.Vector2(
        (index.x * this.cellWidth * this.scale) + ((this.cellWidth * this.scale) / 2),
        (index.y * this.cellHeight * this.scale) + ((this.cellHeight * this.scale) / 2)
    );
    tile.rotation = rotation;
    tile.playAnimation("normal");
    tile.sheetIndex = sheetIndex;
    tile.origin = tile.center;
    tile.scale = this.scale * tile.scale;
    tile.index = index.copy();
    powerupjs.GameStateManager.get(ID.game_state_editor).editingMenu.selectedObj = tile;
    tile.parent = this;
    this.add(tile);
    tile.manageHitboxes(_sprite); // set hitbox based on sprite
}

TileField.prototype.normalizeTiles = function () {
    var seen = {};
    for (var i = this.length - 1; i >= 0; i--) {
        var tile = this.at(i);
        if (!tile.index) continue;
        var key = tile.index.x + ":" + tile.index.y;
        if (seen[key]) {
            this.remove(tile);
        }
        else {
            seen[key] = true;
        }
    }
}

TileField.prototype.hasTileAt = function (position) {
    return this.getTileAt(position) !== null;
}

TileField.prototype.removeTileAt = function (position) {
    var index = this.getTileByMouse(position);
    var tile = this.getTileAtIndex(index);
    if (tile) {
        this.remove(tile);
    }
}

TileField.prototype.getTileAt = function (position) {
    var index = this.getTileByMouse(position);
    return this.getTileAtIndex(index);
}

TileField.prototype.saveTiles = function () {
    this.normalizeTiles(); // remove duplicate tiles before saving
    this.data = TileDataManager.writeTiles(this._gameObjects); // serialize tiles
    console.log(this.data)
    if (window.LEVELS[WorldSettings.currentLevelIndex])
        window.LEVELS[WorldSettings.currentLevelIndex].tiles[this.editorLayer] = this.data; // save to LEVELS
}

TileField.prototype.loadTiles = function () {
    if (!window.LEVELS[WorldSettings.currentLevelIndex]) WorldSettings.createLevel();
    this.scale = WorldSettings.currentLevel.scale
    this.data = window.LEVELS[WorldSettings.currentLevelIndex].tiles[this.editorLayer]; // get tile data
    if (!this.data) return; // no tile data
    var splitData = this.data.split("/"); // split into individual tile data
    for (var i = 0; i < splitData.length; i++) { // for each tile
        if (splitData[i] == "") continue; // skip empty data

        var tile = TileDataManager.convertDataToTile(splitData[i])
        tile.scale = this.scale * tile.scale;
        tile.position = new powerupjs.Vector2((tile.index.x * this.cellWidth * this.scale) + ((this.cellWidth * this.scale) / 2), 
            (tile.index.y * this.cellHeight * this.scale) + ((this.cellHeight * this.scale) / 2))
        this.add(tile)
        tile.manageHitboxes(tile.sprite); // set hitbox based on sprite

    }
    WorldSettings.levels[WorldSettings.currentLevelIndex].tileFields[this.editorLayer] = this; // update world settings
}
