

function saveLevelToTxt(levelIndex) {
  var str = ""
  // Room refactor: export uses nested room payload as single source of truth.
  var roomData = window.LEVELS[levelIndex].room;
  var tileLayers = Array.isArray(roomData.tiles) ? roomData.tiles : [];
  var encodedLayers = encodeURIComponent(JSON.stringify(tileLayers));

  str += window.LEVELS[levelIndex].name + "!"
  // Persist every editor layer in one payload segment to avoid dropping
  // empty/final layers when using delimiter-based concatenation.
  str += encodedLayers;
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
  str += "!" + (roomData.song || "")
  str += "!" + encodeURIComponent(JSON.stringify(roomData.eventNodes || []))
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
  roomData.tiles = [];
    try {
        var parsedLayers = JSON.parse(decodeURIComponent(dataSplit[1] || ""));
        if (Array.isArray(parsedLayers)) {
            for (var i = 0; i < parsedLayers.length; i++) {
                roomData.tiles.push(parsedLayers[i] || "");
            }
        }
    }
    catch (e) {
        // Backward compatibility with older exports that used '?' as a layer separator.
        var fieldSplit = (dataSplit[1] || "").split("?");
        for (var j = 0; j < fieldSplit.length; j++) {
            roomData.tiles.push(fieldSplit[j] || "");
        }
    }

    if (roomData.tiles.length === 0) roomData.tiles.push("");
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

  roomData.song = dataSplit[6] || "";
  try {
    var parsedNodes = JSON.parse(decodeURIComponent(dataSplit[7] || "[]"));
    roomData.eventNodes = Array.isArray(parsedNodes) ? parsedNodes : [];
  }
  catch (e) {
    roomData.eventNodes = [];
  }

}


window.LEVELS = [];
