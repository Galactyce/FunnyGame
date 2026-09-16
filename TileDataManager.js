
function TileDataManager_Singleton() {
    this.dataStrings = [];
    this.globalDataValues = 9; // Values saved in every tile (key, position, sprite, rotation, scale, sheetIndex, travelPointID, targetID)

    // Single source of truth for special tile types. To add a new special tile type
    // (e.g. a new hazard or interactive tile), just push one entry here instead of
    // editing handleObject/manageObjData/readSpecialTileData separately.
    this.tileTypes = [
        {
            matches: function (sprite) { return sprite.image.src == sprites.boundary.image.src || sprite.image.src == sprites.crosshair.image.src; },
            create: function (sprite) { return new CameraBoundTile(sprite); } // crosshair kept for backward compatibility with old maps
        },
        {
            matches: function (sprite) { return sprite.image.src == sprites.portal.image.src || sprite.image.src == sprites.warp.image.src; },
            create: function (sprite) { return new TravelPointTile(sprites.warp); }
        },
        {
            matches: function (sprite) { return sprite.image.src == sprites.spring.image.src; },
            create: function (sprite) { return new Spring(sprite); }
        },
        {
            matches: function (sprite) { return sprite.image.src == sprites.enemy.image.src; },
            create: function (sprite) { return null; } // enemies are spawned from the editor menu, not through tile creation
        },
        {
            matches: function (sprite) { return sprite.image.src == sprites.movingPlatform.image.src; },
            create: function (sprite) { return new MovingPlatform(sprite); },
            write: function (tile) { // append movement node data after the base tile string
                var str = "";
                for (var i = 0; i < tile.movementNodes.length; i++) {
                    str += tile.movementNodes[i].x + "|" + tile.movementNodes[i].y;
                    if (i < tile.movementNodes.length - 1) str += "|";
                }
                return str;
            },
            read: function (tile, tileData, globalDataValues) { // parse movement node data
                var nodeStartIndex = 7;
                if (tileData.length >= globalDataValues && ((tileData.length - globalDataValues) % 2 === 0)) {
                    nodeStartIndex = globalDataValues;
                }
                for (var i = nodeStartIndex; i < tileData.length; i += 2) {
                    tile.movementNodes.push(new powerupjs.Vector2(parseFloat(tileData[i]), parseFloat(tileData[i + 1])));
                }
            }
        }
    ];
}

TileDataManager_Singleton.prototype.findTileType = function (sprite) { // find registered type descriptor for a sprite, if any
    if (!sprite || !sprite.image) return null;
    for (var i = 0; i < this.tileTypes.length; i++) {
        if (this.tileTypes[i].matches(sprite)) return this.tileTypes[i];
    }
    return null;
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
    var str = this.writeTile(tile); // base tile data, always written
    var type = this.findTileType(tile.sprite);
    if (type && type.write) {
        str += type.write(tile); // append type-specific data, if any
    }
    return str;
}

TileDataManager_Singleton.prototype.handleObject = function(sprite) { // create tile object based on sprite
    if (!sprite || !sprite.image) {
        sprite = WorldSettings.blockSprites && WorldSettings.blockSprites.length > 0 ? WorldSettings.blockSprites[0] : null;
        if (!sprite || !sprite.image) return null;
    }

    var type = this.findTileType(sprite);
    if (type) return type.create(sprite);

    return new Tile(sprite); // basic tile (default when no special type matches)
}

TileDataManager_Singleton.prototype.writeTile = function(tile) {  // write basic tile data
    var spriteIndex = 0;
    if (tile && tile.isTravelPointTile) {
        spriteIndex = WorldSettings.indexOfSprite(sprites.portal);
    }
    else {
        spriteIndex = WorldSettings.indexOfSprite(tile.sprite);
    }
    if (spriteIndex === null || typeof spriteIndex === 'undefined' || isNaN(spriteIndex)) {
        spriteIndex = 0;
    }
    var tileScale = (typeof tile.baseScale !== 'undefined' && !isNaN(tile.baseScale)) ? tile.baseScale : tile.scale;
    var travelPointID = (typeof tile.travelPointID === 'number') ? tile.travelPointID : 0;
    var targetID = (typeof tile.targetID === 'number') ? tile.targetID : 0;
    return tile.key + "|" + tile.index.x + "|" + tile.index.y + "|" + spriteIndex + "|" + tile.rotation + "|" + tileScale + "|" + tile.sheetIndex + "|" + travelPointID + "|" + targetID + "|"; // create data string ==> (key|x|y|spriteIndex|rotation|scale|sheetIndex|travelPointID|targetID)
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
    tile.travelPointID = parseInt(tileData[7], 10) || 0;
    tile.targetID = parseInt(tileData[8], 10) || 0;
    tile.origin = tile.center;
    this.readSpecialTileData(tile, data)
    return tile;
}

TileDataManager_Singleton.prototype.readSpecialTileData = function(tile, data) { // read special tile data based on type
    if (!tile || !tile.sprite || !tile.sprite.image) return;
    var type = this.findTileType(tile.sprite);
    if (type && type.read) {
        type.read(tile, data.split("|"), this.globalDataValues);
    }
}

var TileDataManager = new TileDataManager_Singleton();