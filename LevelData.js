

function saveLevelToTxt(levelIndex) {
  var str = ""
  for (var i = 0; i < window.LEVELS[levelIndex].tiles.length; i++) {
    str += window.LEVELS[levelIndex].tiles[i] + "?"
  }
  const blob = new Blob([str], { type: 'text/plain' });

  // 2. Create a temporary URL for the Blob
  const url = URL.createObjectURL(blob);

  // 3. Create a download link
  const a = document.createElement('a');
  a.href = url;
  a.download = "data"; // Set the desired filename

  // 4. Trigger the download and clean up
  document.body.appendChild(a); // Append to body (can be hidden)
  a.click(); // Programmatically click the link
  document.body.removeChild(a); // Remove the link from the DOM
  URL.revokeObjectURL(url); // Release the object URL

}
 



window.LEVELS = [];

window.LEVELS.push({
    name: "New Beginnings",
    tiles: [],
    cameraBounds: new powerupjs.Rectangle(-500, -400, 3000, 1400),
    playerSpawnPos: ""
})

window.LEVELS.push({
    name: "Final Destination",
    tiles: [],
    cameraBounds: new powerupjs.Rectangle(-500, -400, 3000, 1400),
    playerSpawnPos: ""
})

window.LEVELS.push({
    name: "Apotheosis",
    tiles: [],
    cameraBounds: new powerupjs.Rectangle(-500, -400, 3000, 1400),
    playerSpawnPos: ""
})

window.LEVELS.push({
    name: "Unfair",
    tiles: [],
    cameraBounds: new powerupjs.Rectangle(-500, -400, 3000, 1400),
    playerSpawnPos: ""
})