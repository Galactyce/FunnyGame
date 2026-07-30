function PlayingState(layer) {
    powerupjs.GameObjectList.call(this, layer);
    this.player = new Player();
    this.tileFields = new powerupjs.GameObjectList(); // list to hold tile fields
    this.nextRoomButton = new LabelledButton(sprites.button_default, "Next Room", "Arial", "20px", ID.layer_overlays); // button to go to next room
    this.nextRoomButton.position = new powerupjs.Vector2(600, 15);
    this.nextRoomButton.ui = true;
    this.add(this.nextRoomButton);

    this.returnButton = new LabelledButton(sprites.button_default, "Return", "Arial", "20px", ID.layer_overlays); // button to return to title screen
    this.returnButton.position = new powerupjs.Vector2(900, 15);
    this.returnButton.ui = true;
    this.add(this.returnButton);
    this.add(this.player);
    this.add(this.tileFields); // add tile fields to game state
    this.currentLevel;


    this.currentRoomDisplay = new powerupjs.Label("Arial", "20px", ID.layer_overlays, 0, powerupjs.Color.white);
    this.currentRoomDisplay.position = new powerupjs.Vector2(600, 15);
    this.currentRoomDisplay.ui = true;
    this.add(this.currentRoomDisplay);
}



PlayingState.prototype = Object.create(powerupjs.GameObjectList.prototype);

PlayingState.prototype.syncRoomVisibility = function () {
    if (!this.currentLevel || !this.currentLevel.rooms) return;
    for (var i = 0; i < this.currentLevel.rooms.length; i++) {
        var room = this.currentLevel.rooms.at(i);
        if (room) room.visible = (i === this.currentLevel.currentRoomIndex);
    }
}

PlayingState.prototype.handleInput = function (delta) {
    powerupjs.GameObjectList.prototype.handleInput.call(this, delta);
    if (this.returnButton.pressed) {
        powerupjs.Camera.position = powerupjs.Vector2.zero;
        powerupjs.GameStateManager.switchTo(ID.game_state_title);
        WorldSettings.currentState = "title"
    }

    if (this.nextRoomButton.pressed) {
        var currentRoomIndex = WorldSettings.currentLevel.currentRoomIndex;
        var nextRoomIndex = (currentRoomIndex + 1) % WorldSettings.currentLevel.rooms.length;
        this.switchRoom(nextRoomIndex);
    }
}


PlayingState.prototype.placeCameraAtSpawn = function () {
    if (!this.player || !this.currentLevel || !this.currentLevel.room) return;

    powerupjs.Camera.position = this.player.centerOfCamera;
    powerupjs.Camera.velocity = new powerupjs.Vector2(0, 0);
    powerupjs.Camera.manageBoundaries(this.currentLevel.room.cameraBounds);
}


PlayingState.prototype.loadLevel = function (spawnOverride, alignCameraToSpawn) {
   
    
    var spawn = powerupjs.GameStateManager.get(ID.game_state_editor).find(ID.player_spawn);
   
    var level = window.LEVELS[WorldSettings.currentLevelIndex];
    // Room refactor: spawn data now belongs to the level's room payload.
    var spawnData = level.room.playerSpawnPos;
    if (spawnData.x == null) {
        spawn.position = new powerupjs.Vector2(
            400, 400
        )
    }
    else {
   
    spawn.position = new powerupjs.Vector2(spawnData.x, spawnData.y)
    }
    var playerStartPosition = spawn.position.copy();
    if (spawnOverride && typeof spawnOverride.x === 'number' && typeof spawnOverride.y === 'number') {
        playerStartPosition = spawnOverride.copy ? spawnOverride.copy() : new powerupjs.Vector2(spawnOverride.x, spawnOverride.y);
    }

    this.player.position = playerStartPosition; // set player position to spawn point or override
    this.player.spawnPosition = this.player.position.copy(); // set spawn position
    this.player.adjustHitbox(); // adjust hitbox to match sprite
    this.player.scale = WorldSettings.currentLevel.room.scale
    this.player.currentLevelIndex = WorldSettings.currentLevelIndex; // set player's current level
    this.player.initialize();
    WorldSettings.player = this.player;
    this.currentLevel = WorldSettings.currentLevel;
    WorldSettings.currentLevel.room.loadTiles();
    this.syncRoomVisibility();

    if (alignCameraToSpawn) {
        this.placeCameraAtSpawn();
    }
}

PlayingState.prototype.switchRoom = function (newRoomIndex, spawnOverride) {
    var newRoom = this.currentLevel.rooms.at(newRoomIndex);
    if (!newRoom) return;
    this.currentLevel.currentRoomIndex = newRoomIndex;
    this.currentLevel.room.loadBackground();
    this.currentLevel.room.loadTiles();
    this.loadLevel(spawnOverride, true);
    this.syncRoomVisibility();
}

PlayingState.prototype.findActiveTravelTileHit = function(player) {
    if (!this.currentLevel || !this.currentLevel.room || !this.currentLevel.room.tileFields) return null;

    for (var i = 0; i < this.currentLevel.room.tileFields.length; i++) {
        var field = this.currentLevel.room.tileFields.at(i);
        if (!field) continue;

        for (var t = 0; t < field.length; t++) {
            var tile = field.at(t);
            if (!tile || !tile.isTravelPointTile || !tile.hitbox) continue;
            if (player.hitbox.intersects(tile.hitbox)) return tile;
        }
    }

    return null;
}

PlayingState.prototype.findTravelDestinationCluster = function(targetTravelPointId) {
    var levelData = window.LEVELS[WorldSettings.currentLevelIndex];
    if (!levelData || !Array.isArray(levelData.rooms)) return null;

    var portalSpriteIndex = WorldSettings.blockSprites.indexOf(sprites.portal);
    if (portalSpriteIndex < 0) return null;

    var tilePixelSize = 32;
    var destinationByRoom = {};

    for (var r = 0; r < levelData.rooms.length; r++) {
        var roomData = levelData.rooms[r];
        if (!roomData || !Array.isArray(roomData.tiles)) continue;

        var roomScale = (typeof roomData.scale === "number" && roomData.scale !== 0) ? roomData.scale : 1;
        var halfTile = (tilePixelSize * roomScale) / 2;

        for (var l = 0; l < roomData.tiles.length; l++) {
            var layerData = roomData.tiles[l];
            if (!layerData) continue;

            var serializedTiles = layerData.split("/");
            for (var i = 0; i < serializedTiles.length; i++) {
                var entry = serializedTiles[i];
                if (!entry) continue;

                var parts = entry.split("|");
                var spriteIndex = parseInt(parts[3], 10);
                if (spriteIndex !== portalSpriteIndex) continue;

                var travelPointID = parseInt(parts[7], 10) || 0;
                if (travelPointID !== targetTravelPointId) continue;

                var ix = parseFloat(parts[1]);
                var iy = parseFloat(parts[2]);
                if (isNaN(ix) || isNaN(iy)) continue;

                var worldX = (ix * tilePixelSize * roomScale) + halfTile;
                var worldY = (iy * tilePixelSize * roomScale) + halfTile;

                if (!destinationByRoom[r]) {
                    destinationByRoom[r] = {
                        roomIndex: r,
                        minX: worldX - halfTile,
                        maxX: worldX + halfTile,
                        minY: worldY - halfTile,
                        maxY: worldY + halfTile
                    };
                }
                else {
                    destinationByRoom[r].minX = Math.min(destinationByRoom[r].minX, worldX - halfTile);
                    destinationByRoom[r].maxX = Math.max(destinationByRoom[r].maxX, worldX + halfTile);
                    destinationByRoom[r].minY = Math.min(destinationByRoom[r].minY, worldY - halfTile);
                    destinationByRoom[r].maxY = Math.max(destinationByRoom[r].maxY, worldY + halfTile);
                }
            }
        }
    }

    var roomKeys = Object.keys(destinationByRoom);
    if (roomKeys.length === 0) return null;

    var first = destinationByRoom[roomKeys[0]];
    return {
        roomIndex: first.roomIndex,
        left: first.minX,
        right: first.maxX,
        centerY: (first.minY + first.maxY) / 2
    };
}

PlayingState.prototype.handleTravelTileTeleport = function() {
    if (WorldSettings.currentState !== "playing") return;
    if (!WorldSettings.activePlayer) return;

    var player = WorldSettings.activePlayer;
    var hitTile = this.findActiveTravelTileHit(player);

    if (player.blockedTravelPointTileID) {
        if (hitTile && hitTile.travelPointID === player.blockedTravelPointTileID) return;
        player.blockedTravelPointTileID = null;
    }

    if (!hitTile) return;
    if (!hitTile.targetID || hitTile.targetID <= 0) return;

    var destination = this.findTravelDestinationCluster(hitTile.targetID);
    if (!destination) return;

    var enteredFromLeft = player.position.x <= hitTile.position.x;
    var targetSpawn = new powerupjs.Vector2(
        enteredFromLeft ? (destination.right + (player.width / 2) + 2) : (destination.left - (player.width / 2) - 2),
        destination.centerY
    );

    this.switchRoom(destination.roomIndex, targetSpawn);

    var activePlayer = WorldSettings.activePlayer;
    if (!activePlayer) return;
    activePlayer.blockedTravelPointTileID = hitTile.targetID;
    activePlayer.velocity = new powerupjs.Vector2(0, 0);
    activePlayer.adjustHitbox();
}

PlayingState.prototype.draw = function() {
    this.currentLevel.draw();
    powerupjs.GameObjectList.prototype.draw.call(this);
    
}

PlayingState.prototype.update = function(delta) {
    this.syncRoomVisibility();
    this.currentLevel.update(delta);
    powerupjs.GameObjectList.prototype.update.call(this, delta);
    this.handleTravelTileTeleport();
    this.currentRoomDisplay.text = "Room: " + (WorldSettings.currentLevel.currentRoomIndex + 1) + "/" + WorldSettings.currentLevel.rooms.length;
}