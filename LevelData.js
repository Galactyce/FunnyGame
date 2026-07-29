

function saveLevelToTxt(levelIndex) {
  var str = ""
  // Room refactor: export uses nested room payload as single source of truth.
  var roomData = window.LEVELS[levelIndex].room;

  str += window.LEVELS[levelIndex].name + "!"
  for (var i = 0; i < roomData.tiles.length; i++) {
    if (i < roomData.tiles.length - 1)
        str += roomData.tiles[i] + "?"
  }
  str += "!"
  var cameraBounds = roomData.cameraBounds
  str += cameraBounds.x + "|" + cameraBounds.y + "|" + cameraBounds.width + "|" + cameraBounds.height + "!"
  str += (roomData.playerSpawnPos.x) + 
    "|" + (roomData.playerSpawnPos.y) + "!"
  for (var i = 0; i < roomData.backgrounds.length; i++) {
        str += roomData.backgrounds[i] 
        if (i < roomData.backgrounds.length - 1)
            str += "|"

  }
  str += "!" + roomData.scale
  return str;
}
 
function DecryptRawLevelData(data, levelIndex) {
    var dataSplit = data.split("!");    // 0: name, 1: tiles, 2: camera bounds, 3: player spawn pos, 4: backgrounds
    window.LEVELS[levelIndex].name = dataSplit[0];
  // Ensure imported data lands in canonical nested room shape, even if existing
  // level records are still in a pre-room format.
  if (!window.LEVELS[levelIndex].room || typeof window.LEVELS[levelIndex].room !== 'object') {
    window.LEVELS[levelIndex] = WorldSettings.normalizeLevelData(window.LEVELS[levelIndex]);
  }
  var roomData = window.LEVELS[levelIndex].room;
    var fieldSplit = dataSplit[1].split("?");
    for (var i = 0; i < fieldSplit.length; i++) {
    roomData.tiles[i] = fieldSplit[i];
    }
  roomData.scale = parseFloat(dataSplit[5]);
    var boundSplit = dataSplit[2].split("|");
  roomData.cameraBounds = new powerupjs.Rectangle(
        parseFloat(boundSplit[0]), parseFloat(boundSplit[1]), parseFloat(boundSplit[2]), parseFloat(boundSplit[3])
        );
    var spawnSplit = dataSplit[3].split("|");
  roomData.playerSpawnPos = new powerupjs.Vector2(parseFloat(spawnSplit[0]), parseFloat(spawnSplit[1]));
    var backgroundSplit = dataSplit[4].split("|");

  roomData.backgrounds = []
    for (var i = 0; i < backgroundSplit.length; i++) {
    roomData.backgrounds.push(parseInt(backgroundSplit[i]))
    }

}


window.LEVELS = [];
