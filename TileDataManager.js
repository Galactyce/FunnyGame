
function TileDataManager_Singleton() {
    this.dataStrings = [];
    this.globalDataValues = 7; // Values saved in every tile (position, sprite, rotation, key, scale, sheetIndex)
}

TileDataManager_Singleton.prototype.writeTiles = function (tiles) { // tiles is an array of Tile objects
    this.dataStrings = []; // reset data strings

    for (var i = 0; i < tiles.length; i++) {    // for each tile
        var tile = tiles[i]; // get tile
        dataString = this.manageObjData(tile);
        this.dataStrings.push(dataString); // add to data strings array
    }
    var data = ""; // final data string
    for (var i = 0; i < this.dataStrings.length; i++) { // concatenate data strings
        data += this.dataStrings[i];
        if (i < this.dataStrings.length - 1)
            data += "/"; // add separator if not last
    }
    return data; // return final data string
}

TileDataManager_Singleton.prototype.manageObjData = function(tile) { // decide how to write tile data based on type
    if (!tile || !tile.sprite || !tile.sprite.image) return "";
    if (tile.sprite.image.src == sprites.movingPlatform.image.src) { // moving platform tile
        return this.writeMovingPlatform(tile);
    }
    else {
        return this.writeTile(tile); // basic tile
    }
}

TileDataManager_Singleton.prototype.handleObject = function(sprite) { // create tile object based on sprite
    if (!sprite || !sprite.image) {
        sprite = WorldSettings.blockSprites && WorldSettings.blockSprites.length > 0 ? WorldSettings.blockSprites[0] : null;
        if (!sprite || !sprite.image) return null;
    }

    if (sprite.image.src == sprites.spring.image.src) { // spring tile
        return new Spring(sprite);
    }
    if (sprite.image.src == sprites.movingPlatform.image.src) { // moving platform tile
        return new MovingPlatform(sprite);
    }
    else {
        return new Tile(sprite); // basic tile
    }
}

TileDataManager_Singleton.prototype.writeTile = function(tile) {  // write basic tile data
    var spriteIndex = WorldSettings.indexOfSprite(tile.sprite);
    if (spriteIndex === null || typeof spriteIndex === 'undefined' || isNaN(spriteIndex)) {
        spriteIndex = 0;
    }
    var tileScale = (typeof tile.baseScale !== 'undefined' && !isNaN(tile.baseScale)) ? tile.baseScale : tile.scale;
    return tile.key + "|" + tile.index.x + "|" + tile.index.y + "|" + spriteIndex + "|" + tile.rotation + "|" + tileScale + "|" + tile.sheetIndex + "|"; // create data string ==> (key|x|y|spriteIndex|rotation|scale|sheetIndex)
}

TileDataManager_Singleton.prototype.writeMovingPlatform = function(tile) { // write moving platform data
    var str = this.writeTile(tile) // write basic tile data
    for (var i = 0; i < tile.movementNodes.length; i++) { // for each movement node
        str += tile.movementNodes[i].x + "|" + tile.movementNodes[i].y // add node position
        if (i < tile.movementNodes.length - 1 ) str += "|" // add separator if not last
    }
    return str; // return data string
}

TileDataManager_Singleton.prototype.convertDataToTile = function(data) {
    var tileData = data.split("|"); // split tile data into components
    var spriteIndex = parseInt(tileData[3]);
    if (isNaN(spriteIndex) || !WorldSettings.blockSprites[spriteIndex]) spriteIndex = 0;
    var tile = this.handleObject(WorldSettings.blockSprites[spriteIndex]);    // Choose which object to create based on the sprite
    if (!tile) return null;
    tile.key = tileData[0]
    tile.index = new powerupjs.Vector2(parseFloat(tileData[1]), parseFloat(tileData[2])); // set tile position based on index
    tile.rotation = parseFloat(tileData[4]);
    // Keep each tile type at its authored default size; avoids inheriting corrupted saved scales.
    tile.baseScale = tile.scale;
    tile.scale = tile.baseScale;
    tile.playAnimation("normal");
    tile.sheetIndex = parseInt(tileData[6]) || 0;
    tile.origin = tile.center;
    this.readSpecialTileData(tile, data)
    return tile;
}

TileDataManager_Singleton.prototype.readSpecialTileData = function(tile, data) { // read special tile data based on type
    if (!tile || !tile.sprite || !tile.sprite.image) return;
    if (tile.sprite.image.src == sprites.movingPlatform.image.src) { // moving platform tile
        var tileData = data.split("|"); // split tile data into components
        for (var i = this.globalDataValues; i < (tileData.length); i += 2) { // for each movement node
            tile.movementNodes.push(new powerupjs.Vector2(parseFloat(tileData[i]), parseFloat(tileData[i + 1]))); // add node position
        }
    }
}

var TileDataManager = new TileDataManager_Singleton();