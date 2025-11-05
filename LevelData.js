

function saveLevelToTxt(levelIndex) {
  var str = ""

  str += window.LEVELS[levelIndex].name + "!"
  for (var i = 0; i < window.LEVELS[levelIndex].tiles.length; i++) {
    if (i < window.LEVELS[levelIndex].tiles.length - 1)
        str += window.LEVELS[levelIndex].tiles[i] + "?"
  }
  str += "!"
  var cameraBounds = window.LEVELS[levelIndex].cameraBounds
  str += cameraBounds.x + "|" + cameraBounds.y + "|" + cameraBounds.width + "|" + cameraBounds.height + "!"
  str += (window.LEVELS[levelIndex].playerSpawnPos.x) + 
    "|" + (window.LEVELS[levelIndex].playerSpawnPos.y) + "!"
  for (var i = 0; i < window.LEVELS[levelIndex].backgrounds.length; i++) {
        str += window.LEVELS[levelIndex].backgrounds[i] 
        if (i < window.LEVELS[levelIndex].backgrounds.length - 1)
            str += "|"

  }
  str += "!" + window.LEVELS[levelIndex].scale
  return str;
}
 
function DecryptRawLevelData(data, levelIndex) {
    console.log(data)
    var dataSplit = data.split("!");    // 0: name, 1: tiles, 2: camera bounds, 3: player spawn pos, 4: backgrounds
    window.LEVELS[levelIndex].name = dataSplit[0];
    var fieldSplit = dataSplit[1].split("?");
    for (var i = 0; i < fieldSplit.length; i++) {
        window.LEVELS[levelIndex].tiles[i] = fieldSplit[i];
    }
    window.LEVELS[levelIndex].scale = parseFloat(dataSplit[5]);
    var boundSplit = dataSplit[2].split("|");
    window.LEVELS[levelIndex].cameraBounds = new powerupjs.Rectangle(
        parseFloat(boundSplit[0]), parseFloat(boundSplit[1]), parseFloat(boundSplit[2]), parseFloat(boundSplit[3])
        );
    var spawnSplit = dataSplit[3].split("|");
    window.LEVELS[levelIndex].playerSpawnPos = new powerupjs.Vector2(parseFloat(spawnSplit[0]), parseFloat(spawnSplit[1]));
    var backgroundSplit = dataSplit[4].split("|");

    window.LEVELS[levelIndex].backgrounds = []
    console.log(backgroundSplit)
    for (var i = 0; i < backgroundSplit.length; i++) {
        console.log(backgroundSplit[i])
        window.LEVELS[levelIndex].backgrounds.push(parseInt(backgroundSplit[i]))
    }

}


window.LEVELS = [];
