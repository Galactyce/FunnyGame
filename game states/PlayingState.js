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


PlayingState.prototype.loadLevel = function () {
   
    
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
    this.player.position = spawn.position.copy(); // set player position to spawn point
    this.player.spawnPosition = this.player.position.copy(); // set spawn position
    this.player.adjustHitbox(); // adjust hitbox to match sprite
    this.player.scale = WorldSettings.currentLevel.room.scale
    this.player.currentLevelIndex = WorldSettings.currentLevelIndex; // set player's current level
    this.player.initialize();
    WorldSettings.player = this.player;
    this.currentLevel = WorldSettings.currentLevel;
    WorldSettings.currentLevel.room.loadTiles();
    this.syncRoomVisibility();
}

PlayingState.prototype.switchRoom = function (newRoomIndex) {
    var newRoom = this.currentLevel.rooms.at(newRoomIndex);
    if (!newRoom) return;
    this.currentLevel.currentRoomIndex = newRoomIndex;
    this.currentLevel.room.loadBackground();
    this.currentLevel.room.loadTiles();
    this.loadLevel();
    this.syncRoomVisibility();
    powerupjs.Camera.position = powerupjs.Vector2.zero;
}

PlayingState.prototype.draw = function() {
    this.currentLevel.draw();
    powerupjs.GameObjectList.prototype.draw.call(this);
    
}

PlayingState.prototype.update = function(delta) {
    this.syncRoomVisibility();
    this.currentLevel.update(delta);
    powerupjs.GameObjectList.prototype.update.call(this, delta);
    this.currentRoomDisplay.text = "Room: " + (WorldSettings.currentLevel.currentRoomIndex + 1) + "/" + WorldSettings.currentLevel.rooms.length;
}