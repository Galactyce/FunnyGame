function PlayingState(layer) {
    powerupjs.GameObjectList.call(this, layer);
    this.player = new Player();
    this.player.loadAnimation(sprites.player_idle, "idle", true);
    this.player.playAnimation("idle");
    this.tileFields = new powerupjs.GameObjectList(); // list to hold tile fields
    this.player.currentLevelIndex = WorldSettings.currentLevelIndex; // set player's current level


    this.returnButton = new LabelledButton(sprites.button_default, "Return", "Arial", "20px", ID.layer_overlays); // button to return to title screen
    this.returnButton.position = new powerupjs.Vector2(900, 15);
    this.returnButton.ui = true;
    this.add(this.returnButton);
    this.add(this.player);
    this.add(this.tileFields); // add tile fields to game state
    this.currentLevel;

}



PlayingState.prototype = Object.create(powerupjs.GameObjectList.prototype);

PlayingState.prototype.handleInput = function (delta) {
    powerupjs.GameObjectList.prototype.handleInput.call(this, delta);
    if (this.returnButton.pressed) {
        powerupjs.Camera.position = powerupjs.Vector2.zero;
        powerupjs.GameStateManager.switchTo(ID.game_state_title);
        WorldSettings.currentState = "title"
    }
}


PlayingState.prototype.loadLevel = function () {
   
    
    var spawn = powerupjs.GameStateManager.get(ID.game_state_editor).find(ID.player_spawn);
   
    var level = window.LEVELS[WorldSettings.currentLevelIndex];
    var spawnData = level.playerSpawnPos;
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
    this.player.scale = WorldSettings.currentLevel.scale
    this.player.initialize();
    WorldSettings.activePlayer = this.player;
    this.currentLevel = WorldSettings.currentLevel;
    WorldSettings.mapBottom = (WorldSettings.currentLevel.cameraBounds.height + WorldSettings.currentLevel.cameraBounds.y) * WorldSettings.currentLevel.scale;
    WorldSettings.currentLevel.loadTiles();
}

PlayingState.prototype.draw = function() {
    this.currentLevel.draw();
    powerupjs.GameObjectList.prototype.draw.call(this);
    
}

PlayingState.prototype.update = function(delta) {
    this.currentLevel.update(delta);
    powerupjs.GameObjectList.prototype.update.call(this, delta);
    console.log(this.player.velocity.x / WorldSettings.currentLevel.scale)
}