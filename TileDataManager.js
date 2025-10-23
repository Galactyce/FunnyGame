
function TileDataManager_Singleton() {
    this.dataStrings = [];

}

TileDataManager_Singleton.prototype.writeTiles = function (tiles) { // tiles is an array of Tile objects
    this.dataStrings = []; // reset data strings

    for (var i = 0; i < tiles.length; i++) {    // for each tile
        var tile = tiles[i]; // get tile
        var dataString = tile.key + "|" + tile.position.x + "|" + tile.position.y +
            "|" + WorldSettings.indexOfSprite(tile.sprite) + "|" + tile.rotation; // create data string ==> (key|x|y|spriteIndex|rotation)
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



var TileDataManager = new TileDataManager_Singleton();