
function TileDataManager_Singleton() {
    this.dataStrings = [];
    this.globalDataValues = 6; // Values saved in every tile (position, sprite, rotation, key, scale)
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
    console.log(data)
    return data; // return final data string
}

TileDataManager_Singleton.prototype.manageObjData = function(tile) {
    if (tile.sprite.image.src == sprites.movingPlatform.image.src) {
        return this.writeMovingPlatform(tile);
    }
    else {
        return this.writeTile(tile);
    }
}

TileDataManager_Singleton.prototype.handleObject = function(sprite) {
    if (sprite.image.src == sprites.spring.image.src) {
        return new Spring(sprite);
    }
    if (sprite.image.src == sprites.movingPlatform.image.src) {
        return new MovingPlatform(sprite);
    }
    else {
        return new Tile(sprite);
    }
}

TileDataManager_Singleton.prototype.writeTile = function(tile) { 
    return tile.key + "|" + tile.position.x + "|" + tile.position.y +
        "|" + WorldSettings.indexOfSprite(tile.sprite) + "|" + tile.rotation + "|" + tile.scale + "|"; // create data string ==> (key|x|y|spriteIndex|rotation)
}

TileDataManager_Singleton.prototype.writeMovingPlatform = function(tile) {
    var str = this.writeTile(tile)
    for (var i = 0; i < tile.movementNodes.length; i++) {
        str += tile.movementNodes[i].x + "|" + tile.movementNodes[i].y
        if (i < tile.movementNodes.length - 1 ) str += "|"
    }
    console.log(str);
    return str;
}

TileDataManager_Singleton.prototype.convertDataToTile = function(data) {
    var tileData = data.split("|"); // split tile data into components
    var tile = this.handleObject(WorldSettings.blockSprites[parseInt(tileData[3])]);
    tile.key = tileData[0]
    tile.position = new powerupjs.Vector2(parseInt(tileData[1]), parseInt(tileData[2])); // set tile position based on index
    tile.rotation = parseFloat(tileData[4]);
    tile.scale = parseFloat(tileData[5])
    tile.playAnimation("normal");
    tile.origin = tile.center;
    tile.manageHitboxes(tile.sprite); // set hitbox based on sprite
    this.readSpecialTileData(tile, data)
    return tile;
}

TileDataManager_Singleton.prototype.readSpecialTileData = function(tile, data) {
    if (tile.sprite.image.src == sprites.movingPlatform.image.src) {
        var tileData = data.split("|"); // split tile data into components
        for (var i = this.globalDataValues; i < (tileData.length); i += 2) {
            tile.movementNodes.push(new powerupjs.Vector2(parseFloat(tileData[i]), parseFloat(tileData[i + 1])));
        }
    }
}

var TileDataManager = new TileDataManager_Singleton();