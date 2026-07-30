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

TileField.prototype.normalizeIndex = function(index) {
    if (!index || isNaN(index.x) || isNaN(index.y)) return null;
    return new powerupjs.Vector2(index.x, index.y);
}

TileField.prototype.getIndexKey = function(index) {
    var normalized = this.normalizeIndex(index);
    if (!normalized) return null;
    // Use fixed precision to avoid float noise without snapping positions.
    return normalized.x.toFixed(4) + ":" + normalized.y.toFixed(4);
}

TileField.prototype.getTileByMouse = function (position) {
    var mousePosition = typeof position !== 'undefined' ? position : powerupjs.Mouse.position;
    var fieldPosition = this.worldPosition; // use world position for nested game objects
    return new powerupjs.Vector2(
        Math.floor((mousePosition.x - fieldPosition.x) / (this.cellWidth * this.scale)), // calculate tile index based on mouse position
        Math.floor((mousePosition.y - fieldPosition.y) / (this.cellHeight * this.scale))
    );
}

TileField.prototype.snapPositionToSubTile = function(position) {
    if (!position) return null;

    var stepX = (this.cellWidth * this.scale) / 16;
    var stepY = (this.cellHeight * this.scale) / 16;
    if (!stepX || !stepY) return position.copy ? position.copy() : new powerupjs.Vector2(position.x, position.y);

    return new powerupjs.Vector2(
        Math.round(position.x / stepX) * stepX,
        Math.round(position.y / stepY) * stepY
    );
}

TileField.prototype.snapTileToSubTile = function(tile) {
    if (!tile || !tile.position) return;
    var snapped = this.snapPositionToSubTile(tile.position);
    if (!snapped) return;
    tile.position = snapped;
}

TileField.prototype.getTileAtIndex = function (index) {
    var targetKey = this.getIndexKey(index);
    if (targetKey === null) return null;

    for (var i = 0; i < this.length; i++) {
        var tile = this.at(i);
        if (tile && this.getIndexKey(tile.index) === targetKey) {
            return tile;
        }
    }
    return null;
}

TileField.prototype.getRoomTravelPointId = function() {
    var level = WorldSettings.currentLevel;
    if (!level || typeof level.currentRoomIndex !== 'number') return 1;
    return level.currentRoomIndex + 1;
}

TileField.prototype.mergeAdjacentTravelTileCluster = function(seedTile) {
    if (!seedTile || !seedTile.isTravelPointTile || !seedTile.index) return;

    var queue = [seedTile];
    var visited = {};
    var clusterTiles = [];
    var clusterTravelPointId = this.getRoomTravelPointId();
    var clusterTargetId = 0;

    while (queue.length > 0) {
        var current = queue.shift();
        if (!current || !current.isTravelPointTile || !current.index) continue;

        var key = this.getIndexKey(current.index);
        if (!key || visited[key]) continue;
        visited[key] = true;
        clusterTiles.push(current);

        if (!clusterTargetId && current.targetID > 0) {
            clusterTargetId = current.targetID;
        }

        var neighbors = [
            new powerupjs.Vector2(current.index.x - 1, current.index.y),
            new powerupjs.Vector2(current.index.x + 1, current.index.y),
            new powerupjs.Vector2(current.index.x, current.index.y - 1),
            new powerupjs.Vector2(current.index.x, current.index.y + 1)
        ];

        for (var i = 0; i < neighbors.length; i++) {
            var neighbor = this.getTileAtIndex(neighbors[i]);
            if (neighbor && neighbor.isTravelPointTile) queue.push(neighbor);
        }
    }

    for (var t = 0; t < clusterTiles.length; t++) {
        clusterTiles[t].travelPointID = clusterTravelPointId;
        clusterTiles[t].targetID = clusterTargetId;
    }
}

TileField.prototype.removeTilesAtIndex = function(index) {
    var targetKey = this.getIndexKey(index);
    if (targetKey === null) return;

    for (var i = this.length - 1; i >= 0; i--) {
        var tile = this.at(i);
        if (!tile) continue;
        if (this.getIndexKey(tile.index) === targetKey) {
            this.remove(tile);
        }
    }
}

TileField.prototype.update = function (delta) {
    powerupjs.GameObjectList.prototype.update.call(this, delta);
}

TileField.prototype.addTileAt = function (index, tileKey, sprite, rotation) {
    index = this.normalizeIndex(index);
    if (!index) return;

    var sheetIndex = 0;
    var _sprite;
    if (typeof sprite !== 'undefined' && sprite && typeof sprite.sprite !== 'undefined') {
        sheetIndex = sprite.sheetIndex || 0;
        _sprite = sprite.sprite;
    }
    _sprite = typeof sprite !== 'undefined' ? _sprite : sprites.defaultTile; // default sprite if none provided
    rotation = typeof rotation !== 'undefined' ? rotation : 0;
    this.removeTilesAtIndex(index);
    var tile = TileDataManager.handleObject(_sprite);
    if (!tile) return;
    if (this.tileKey !== null) tile.key = this.tileKey; // use current tile key
    else tile.key = tileKey;
    tile.position = new powerupjs.Vector2(
        (index.x * this.cellWidth * this.scale) + ((this.cellWidth * this.scale) / 2),
        (index.y * this.cellHeight * this.scale) + ((this.cellHeight * this.scale) / 2)
    );
    this.snapTileToSubTile(tile);
    tile.rotation = rotation;
    tile.playAnimation("normal");
    tile.sheetIndex = sheetIndex;
    tile.origin = tile.center;
    tile.baseScale = tile.scale;
    tile.scale = this.scale * tile.baseScale;
    tile.index = index.copy();
    powerupjs.GameStateManager.get(ID.game_state_editor).editingMenu.selectedObj = tile;
    tile.parent = this;
    this.add(tile);
    tile.manageHitboxes(_sprite); // set hitbox based on sprite
    if (tile.isTravelPointTile) {
        tile.travelPointID = this.getRoomTravelPointId();
        this.mergeAdjacentTravelTileCluster(tile);
    }
}

TileField.prototype.normalizeTiles = function () {
    var seen = {};
    for (var i = this.length - 1; i >= 0; i--) {
        var tile = this.at(i);
        if (!tile.index) continue;
        tile.index = this.normalizeIndex(tile.index);
        if (!tile.index) {
            this.remove(tile);
            continue;
        }
        var key = this.getIndexKey(tile.index);
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
    this.removeTilesAtIndex(index);
}

TileField.prototype.getTileAt = function (position) {
    var index = this.getTileByMouse(position);
    return this.getTileAtIndex(index);
}

TileField.prototype.saveTiles = function () {
    this.normalizeTiles(); // remove duplicate tiles before saving
    this.data = TileDataManager.writeTiles(this._gameObjects); // serialize tiles
    if (window.LEVELS[WorldSettings.currentLevelIndex]) {
        if (!window.LEVELS[WorldSettings.currentLevelIndex].room || typeof window.LEVELS[WorldSettings.currentLevelIndex].room !== 'object') {
            window.LEVELS[WorldSettings.currentLevelIndex] = WorldSettings.normalizeLevelData(window.LEVELS[WorldSettings.currentLevelIndex]);
        }
        // Room refactor: tile layer strings now live under LEVELS[].room.tiles.
        // Keep this write path centralized so both editor and play states stay consistent.
        var roomData = window.LEVELS[WorldSettings.currentLevelIndex].room;
        if (!Array.isArray(roomData.tiles)) roomData.tiles = [];
        roomData.tiles[this.editorLayer] = this.data; // save to LEVELS
    }
}

TileField.prototype.loadTiles = function () {
    if (!window.LEVELS[WorldSettings.currentLevelIndex]) WorldSettings.createLevel();
    if (!window.LEVELS[WorldSettings.currentLevelIndex].room || typeof window.LEVELS[WorldSettings.currentLevelIndex].room !== 'object') {
        window.LEVELS[WorldSettings.currentLevelIndex] = WorldSettings.normalizeLevelData(window.LEVELS[WorldSettings.currentLevelIndex]);
    }
    this.scale = WorldSettings.currentLevel.room.scale
    // Room refactor: read serialized tile layer data from nested room payload.
    this.data = window.LEVELS[WorldSettings.currentLevelIndex].room.tiles[this.editorLayer]; // get tile data
    if (!this.data) return; // no tile data
    var splitData = this.data.split("/"); // split into individual tile data
    for (var i = 0; i < splitData.length; i++) { // for each tile
        if (splitData[i] == "") continue; // skip empty data

        var tile = TileDataManager.convertDataToTile(splitData[i])
        if (!tile) continue;
        tile.index = this.normalizeIndex(tile.index);
        if (!tile.index) continue;
        if (typeof tile.baseScale === 'undefined' || tile.baseScale === null || isNaN(tile.baseScale)) {
            tile.baseScale = tile.scale;
        }
        tile.scale = this.scale * tile.baseScale;
        tile.position = new powerupjs.Vector2((tile.index.x * this.cellWidth * this.scale) + ((this.cellWidth * this.scale) / 2), 
            (tile.index.y * this.cellHeight * this.scale) + ((this.cellHeight * this.scale) / 2))
        this.snapTileToSubTile(tile);
        this.add(tile)
        tile.manageHitboxes(tile.sprite); // set hitbox based on sprite
        if (tile.isTravelPointTile) {
            tile.travelPointID = this.getRoomTravelPointId();
        }

    }
    for (var t = 0; t < this.length; t++) {
        var travelTile = this.at(t);
        if (travelTile && travelTile.isTravelPointTile) {
            this.mergeAdjacentTravelTileCluster(travelTile);
        }
    }
    this.normalizeTiles();
    WorldSettings.levels[WorldSettings.currentLevelIndex].room.tileFields[this.editorLayer] = this; // update room tile-field reference
}

Object.defineProperties(TileField.prototype, {
    "scale": {
        get: function() {
            return this._scale;
        },
        set: function(value) {
            this._scale = value;
            for (var i = 0; i < this.length; i++) {
                var tile = this.at(i);
                if (typeof tile.baseScale === 'undefined' || tile.baseScale === null || isNaN(tile.baseScale)) {
                    tile.baseScale = tile.scale;
                }
                tile.scale = value * tile.baseScale;
                tile.position = new powerupjs.Vector2((tile.index.x * this.cellWidth * value) + ((this.cellWidth * value) / 2), 
                    (tile.index.y * this.cellHeight * value) + ((this.cellHeight * value) / 2))
                this.snapTileToSubTile(tile);
            }
        }
    },
    "editorLayer": {
        get: function() {
            return this._editorLayer;
        },
        set: function(value) {
            this._editorLayer = value;
        }
    },
    "tileKey": {
        get: function() {
            return this._tileKey;
        },
        set: function(value) {
            this._tileKey = value;
        }
    }
});