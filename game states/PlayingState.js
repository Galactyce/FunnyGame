// Main gameplay state that owns the player, room tiles, and room-switching logic.
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

// Make only the active room visible so the game can switch between room layouts cleanly.
PlayingState.prototype.syncRoomVisibility = function () {
    if (!this.currentLevel || !this.currentLevel.rooms) return; // Exit early if no level data is available.
    for (var i = 0; i < this.currentLevel.rooms.length; i++) {
        var room = this.currentLevel.rooms.at(i);
        if (room) room.visible = (i === this.currentLevel.currentRoomIndex); // Only the current room should be shown.
    }
}

// Handle UI button presses and state transitions while the game is running.
PlayingState.prototype.handleInput = function (delta) {
    powerupjs.GameObjectList.prototype.handleInput.call(this, delta); // Let the base object list process its UI/input state first.
    if (this.returnButton.pressed) {
        powerupjs.Camera.position = powerupjs.Vector2.zero; // Reset the camera when returning to the title screen.
        powerupjs.GameStateManager.switchTo(ID.game_state_title); // Switch to the title state.
        WorldSettings.currentState = "title" // Update the global state flag.
    }

    if (this.nextRoomButton.pressed) {
        var currentRoomIndex = WorldSettings.currentLevel.currentRoomIndex; // Find the current room index.
        var nextRoomIndex = (currentRoomIndex + 1) % WorldSettings.currentLevel.rooms.length; // Wrap around to the first room when needed.
        this.switchRoom(nextRoomIndex); // Load the next room.
    }
}


// Reposition the camera so it follows the player from the current spawn point.
PlayingState.prototype.placeCameraAtSpawn = function () {
    if (!this.player || !this.currentLevel || !this.currentLevel.room) return; // Avoid errors when the level or room is not ready.

    powerupjs.Camera.position = this.player.centerOfCamera; // Center the viewport on the player.
    powerupjs.Camera.velocity = new powerupjs.Vector2(0, 0); // Stop any prior camera motion.
    powerupjs.Camera.manageBoundaries(this.currentLevel.room.cameraBounds); // Clamp the camera to the room bounds.
}


// Load the current room data, place the player, and optionally re-center the camera.
PlayingState.prototype.loadLevel = function (spawnOverride, alignCameraToSpawn) {
    var spawn = powerupjs.GameStateManager.get(ID.game_state_editor).find(ID.player_spawn); // Get the editor's spawn marker object.

    var level = window.LEVELS[WorldSettings.currentLevelIndex]; // Access the serialized level data for the current level.
    var spawnData = level.room.playerSpawnPos; // Read the room's spawn coordinate from the level data.
    if (spawnData.x == null) {
        spawn.position = new powerupjs.Vector2(400, 400); // Fall back to a safe default position if no spawn exists.
    }
    else {
        spawn.position = new powerupjs.Vector2(spawnData.x, spawnData.y); // Apply the room's saved spawn position.
    }

    var playerStartPosition = spawn.position.copy();
    if (spawnOverride && typeof spawnOverride.x === 'number' && typeof spawnOverride.y === 'number') {
        playerStartPosition = spawnOverride.copy ? spawnOverride.copy() : new powerupjs.Vector2(spawnOverride.x, spawnOverride.y); // Use a teleport override when one is provided.
    }

    this.player.position = playerStartPosition; // Place the player at the spawn point or override.
    this.player.spawnPosition = this.player.position.copy(); // Store the spawn point as the player's reset position.
    this.player.adjustHitbox(); // Recalculate the hitbox to match the sprite size.
    this.player.scale = WorldSettings.currentLevel.room.scale; // Match the player's scale to the room scale.
    this.player.currentLevelIndex = WorldSettings.currentLevelIndex; // Track which level the player is currently in.
    this.player.initialize(); // Reinitialize the player after changing its position and scale.
    WorldSettings.player = this.player; // Keep the global player reference in sync.
    this.currentLevel = WorldSettings.currentLevel; // Point the state at the active level object.
    WorldSettings.currentLevel.room.loadTiles(); // Reload the tiles for the currently active room.
    this.syncRoomVisibility(); // Ensure only the active room is visible.

    if (alignCameraToSpawn) {
        this.placeCameraAtSpawn(); // Re-center the camera on the new player position.
    }
}

// Switch to a different room and optionally place the player at a custom spawn position.
PlayingState.prototype.switchRoom = function (newRoomIndex, spawnOverride) {
    var newRoom = this.currentLevel.rooms.at(newRoomIndex); // Get the room object for the requested index.
    if (!newRoom) return; // Stop if the room does not exist.
    this.currentLevel.currentRoomIndex = newRoomIndex; // Mark the selected room as active.
    this.currentLevel.room.loadBackground(); // Reload the background for the new room.
    this.currentLevel.room.loadTiles(); // Rebuild the room's tile field data.
    this.loadLevel(spawnOverride, true); // Place the player in the new room and recenter the camera.
    this.syncRoomVisibility(); // Hide rooms that are no longer active.
}

// Check whether the player is currently overlapping a travel-point tile in the active room.
PlayingState.prototype.findActiveTravelTileHit = function(player) {
    if (!this.currentLevel || !this.currentLevel.room || !this.currentLevel.room.tileFields) return null; // Exit if the room has not been built yet.

    for (var i = 0; i < this.currentLevel.room.tileFields.length; i++) {
        var field = this.currentLevel.room.tileFields.at(i); // Check each tile field in the room.
        if (!field) continue;

        for (var t = 0; t < field.length; t++) {
            var tile = field.at(t); // Inspect each tile inside the field.
            if (!tile || !tile.isTravelPointTile || !tile.hitbox) continue; // Ignore non-travel tiles.
            if (player.hitbox.intersects(tile.hitbox)) return tile; // Return the travel tile when the player overlaps it.
        }
    }

    return null;
}

// Find the destination cluster for a travel-point ID by scanning serialized room data.
PlayingState.prototype.findTravelDestinationCluster = function(targetTravelPointId) {
    var levelData = window.LEVELS[WorldSettings.currentLevelIndex]; // Read the current level's serialized room data.
    if (!levelData || !Array.isArray(levelData.rooms)) return null; // Return early if the level data is missing.

    var portalSpriteIndex = WorldSettings.blockSprites.indexOf(sprites.portal); // Find the original portal sprite index.
    var warpSpriteIndex = WorldSettings.blockSprites.indexOf(sprites.warp); // Find the new warp sprite index.
    if (portalSpriteIndex < 0 && warpSpriteIndex < 0) return null; // Stop if neither travel sprite is available.

    var tilePixelSize = 32; // The engine treats each tile as 32 pixels wide and tall.
    var destinationByRoom = {}; // Track the bounds of travel tiles grouped by room.

    for (var r = 0; r < levelData.rooms.length; r++) {
        var roomData = levelData.rooms[r]; // Look at one room at a time.
        if (!roomData || !Array.isArray(roomData.tiles)) continue;

        var roomScale = (typeof roomData.scale === "number" && roomData.scale !== 0) ? roomData.scale : 1; // Account for room scale.
        var halfTile = (tilePixelSize * roomScale) / 2; // Use half a tile to compute the tile center.

        for (var l = 0; l < roomData.tiles.length; l++) {
            var layerData = roomData.tiles[l]; // Each room can have multiple serialized tile layers.
            if (!layerData) continue;

            var serializedTiles = layerData.split("/"); // Split the layer into individual tile strings.
            for (var i = 0; i < serializedTiles.length; i++) {
                var entry = serializedTiles[i];
                if (!entry) continue;

                var parts = entry.split("|"); // Break the tile data into its component values.
                var spriteIndex = parseInt(parts[3], 10); // Read the sprite index from the serialized data.
                var matchesTravelPointSprite = (portalSpriteIndex >= 0 && spriteIndex === portalSpriteIndex) || (warpSpriteIndex >= 0 && spriteIndex === warpSpriteIndex); // Accept both sprite variants.
                if (!matchesTravelPointSprite) continue; // Ignore tiles that are not travel-point tiles.

                var travelPointID = parseInt(parts[7], 10) || 0; // Read the travel-point ID stored with the tile.
                if (travelPointID !== targetTravelPointId) continue; // Only keep tiles that match the requested target ID.

                var ix = parseFloat(parts[1]);
                var iy = parseFloat(parts[2]);
                if (isNaN(ix) || isNaN(iy)) continue; // Skip malformed tile data.

                var worldX = (ix * tilePixelSize * roomScale) + halfTile; // Convert the tile grid coordinate to world-space X.
                var worldY = (iy * tilePixelSize * roomScale) + halfTile; // Convert the tile grid coordinate to world-space Y.

                if (!destinationByRoom[r]) {
                    destinationByRoom[r] = {
                        roomIndex: r,
                        minX: worldX - halfTile,
                        maxX: worldX + halfTile,
                        minY: worldY - halfTile,
                        maxY: worldY + halfTile
                    }; // Initialize the room's bounding box with the first matching tile.
                }
                else {
                    destinationByRoom[r].minX = Math.min(destinationByRoom[r].minX, worldX - halfTile); // Expand the bounding box to the left if needed.
                    destinationByRoom[r].maxX = Math.max(destinationByRoom[r].maxX, worldX + halfTile); // Expand the bounding box to the right if needed.
                    destinationByRoom[r].minY = Math.min(destinationByRoom[r].minY, worldY - halfTile); // Expand the bounding box upward if needed.
                    destinationByRoom[r].maxY = Math.max(destinationByRoom[r].maxY, worldY + halfTile); // Expand the bounding box downward if needed.
                }
            }
        }
    }

    var roomKeys = Object.keys(destinationByRoom); // Gather the rooms that contain matching travel-point tiles.
    if (roomKeys.length === 0) return null; // Return null if no destination tiles were found.

    var first = destinationByRoom[roomKeys[0]]; // Use the first matching room as the destination reference.
    return {
        roomIndex: first.roomIndex,
        left: first.minX,
        right: first.maxX,
        centerY: (first.minY + first.maxY) / 2
    }; // Return the destination bounds so the player can be placed near the target.
}

// Search downward from a target position until a solid tile is found, so the player spawns on the ground.
PlayingState.prototype.findGroundSpawnPosition = function(targetPosition, roomIndex) {
    var room = this.currentLevel && this.currentLevel.rooms ? this.currentLevel.rooms.at(roomIndex) : null; // Get the target room object.
    if (!room || !room.tileFields) return targetPosition.copy ? targetPosition.copy() : new powerupjs.Vector2(targetPosition.x, targetPosition.y); // Return the original position if the room is unavailable.

    var searchStep = 32; // Probe every 32 pixels downward.
    var maxDrop = 1000; // Limit how far the search can go.
    var startY = targetPosition.y; // Start from the intended horizontal spawn position.
    var candidate = targetPosition.copy ? targetPosition.copy() : new powerupjs.Vector2(targetPosition.x, targetPosition.y); // Keep a mutable copy of the spawn point.

    for (var i = 0; i <= maxDrop; i += searchStep) {
        var probePosition = new powerupjs.Vector2(candidate.x, startY + i); // Check a point slightly lower than the intended spawn.
        var hitTile = null;

        for (var fieldIndex = 0; fieldIndex < room.tileFields.length; fieldIndex++) {
            var field = room.tileFields.at(fieldIndex); // Inspect each tile field in the room.
            if (!field) continue;

            var tileAt = field.getTileAt ? field.getTileAt(probePosition) : null; // Ask the field whether a tile exists at this point.
            if (!tileAt || !tileAt.hitbox || tileAt.hitboxType !== "solid") continue; // Ignore non-solid tiles.
            if (tileAt.hitbox.contains ? tileAt.hitbox.contains(probePosition) : false) {
                hitTile = tileAt; // Record the solid tile that the probe hit.
                break;
            }
        }

        if (hitTile) {
            candidate.y = hitTile.position.y - (hitTile.height / 2) - (this.player && this.player.height ? (this.player.height / 2) : 16) - 2; // Place the player just above the solid tile.
            return candidate;
        }
    }

    return targetPosition.copy ? targetPosition.copy() : new powerupjs.Vector2(targetPosition.x, targetPosition.y); // Fall back to the original position if no solid tile is found.
}

// Trigger room travel when the player touches a travel-point tile with a linked target.
PlayingState.prototype.handleTravelTileTeleport = function() {
    if (WorldSettings.currentState !== "playing") return; // Only run this logic while the game is in the playing state.
    if (!WorldSettings.activePlayer) return; // Exit if there is no active player reference.

    var player = WorldSettings.activePlayer; // Use the current player object.
    var hitTile = this.findActiveTravelTileHit(player); // Check whether the player is standing on a travel-point tile.

    if (player.blockedTravelPointTileID) {
        if (hitTile && hitTile.travelPointID === player.blockedTravelPointTileID) return; // Ignore repeated triggers while the player remains on the same tile.
        player.blockedTravelPointTileID = null; // Clear the stale block once the player leaves the tile.
    }

    if (!hitTile) return; // Nothing to do if the player is not touching a travel tile.
    if (!hitTile.targetID || hitTile.targetID <= 0) return; // Skip tiles that do not link to another travel point.

    var destination = this.findTravelDestinationCluster(hitTile.targetID); // Find the target destination cluster.
    if (!destination) return; // Stop if no destination is found.

    var enteredFromLeft = player.position.x <= hitTile.position.x; // Decide whether to spawn the player to the left or right of the destination.
    var targetSpawn = new powerupjs.Vector2(
        enteredFromLeft ? (destination.right + (player.width / 2) + 2) : (destination.left - (player.width / 2) - 2),
        destination.centerY
    ); // Create an initial spawn point near the destination bounds.

    var groundedSpawn = this.findGroundSpawnPosition(targetSpawn, destination.roomIndex); // Snap the spawn point onto the ground.
    this.switchRoom(destination.roomIndex, groundedSpawn); // Change rooms and place the player at the grounded spawn point.

    var activePlayer = WorldSettings.activePlayer;
    if (!activePlayer) return;
    activePlayer.blockedTravelPointTileID = hitTile.targetID; // Remember the tile that triggered the teleport to avoid repeated events.
    activePlayer.velocity = new powerupjs.Vector2(0, 0); // Stop the player's movement during the room transition.
    activePlayer.adjustHitbox(); // Ensure the player's hitbox is recalculated after the room change.
}

// Render the current level and all gameplay UI elements.
PlayingState.prototype.draw = function() {
    this.currentLevel.draw(); // Draw the current room's level content first.
    powerupjs.GameObjectList.prototype.draw.call(this); // Draw the player, UI, and other game objects on top.
    
}

// Update room visibility, game objects, and travel-point checks every frame.
PlayingState.prototype.update = function(delta) {
    this.syncRoomVisibility(); // Keep the visible room state in sync each frame.
    this.currentLevel.update(delta); // Update the level's room objects.
    powerupjs.GameObjectList.prototype.update.call(this, delta); // Update the player and other managed objects.
    this.handleTravelTileTeleport(); // Check whether the player should trigger a travel-point transition.
    this.currentRoomDisplay.text = "Room: " + (WorldSettings.currentLevel.currentRoomIndex + 1) + "/" + WorldSettings.currentLevel.rooms.length; // Show the current room number in the HUD.
}