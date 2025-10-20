
function TileDataManager_Singleton() {
    this.dataStrings = [];

}

TileDataManager_Singleton.prototype.writeTiles = function(tiles) {
    
    for (var i = 0; i < tiles.length; i++) {
        var tile = tiles[i];
        var dataString = tile.key + "|" + tile.position.x + "|" + tile.position.y + 
            "|" + WorldSettings.indexOfSprite(tile.sprite);
        this.dataStrings.push(dataString);
    }
    var data = "";
    for (var i = 0; i < this.dataStrings.length; i++) {
        data += this.dataStrings[i] 
        if (i < this.dataStrings.length - 1) data += "/";
    }
    return data;
}



var TileDataManager = new TileDataManager_Singleton();