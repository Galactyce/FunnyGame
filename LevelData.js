

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
//   const blob = new Blob([str], { type: 'text/plain' });

//   // 2. Create a temporary URL for the Blob
//   const url = URL.createObjectURL(blob);

//   // 3. Create a download link
//   const a = document.createElement('a');
//   a.href = url;
//   a.download = "data"; // Set the desired filename

//   // 4. Trigger the download and clean up
//   document.body.appendChild(a); // Append to body (can be hidden)
//   a.click(); // Programmatically click the link
//   document.body.removeChild(a); // Remove the link from the DOM
//   URL.revokeObjectURL(url); // Release the object URL

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
    var scale = parseFloat(dataSplit[5])
    var boundSplit = dataSplit[2].split("|");
    window.LEVELS[levelIndex].cameraBounds = new powerupjs.Rectangle(
        parseFloat(boundSplit[0]), parseFloat(boundSplit[1]), parseFloat(boundSplit[2]) * scale, parseFloat(boundSplit[3] * scale)
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
window.LEVELDATA = [];
