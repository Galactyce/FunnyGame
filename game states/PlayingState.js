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

}



PlayingState.prototype = Object.create(powerupjs.GameObjectList.prototype);

PlayingState.prototype.handleInput = function (delta) {
    powerupjs.GameObjectList.prototype.handleInput.call(this, delta);
    if (this.returnButton.pressed) {
        powerupjs.Camera.position = powerupjs.Vector2.zero;
        powerupjs.GameStateManager.switchTo(ID.game_state_title);
    }
}


PlayingState.prototype.loadLevel = function () {
    this.tileFields.clear()
    for (var i = 0; i < window.LEVELS[WorldSettings.currentLevelIndex].tiles.length; i++) { // for each tile layer
        var field = new TileField(); // create new tile field
        field.editorLayer = i; // set layer index
        field.loadTiles();  // load tiles for the layer
        this.tileFields.add(field); // add tile field to list
    };

    var spawn = powerupjs.GameStateManager.get(ID.game_state_editor).find(ID.player_spawn);
    if (!localStorage.levels) return; // nothing to load
    window.LEVELS = JSON.parse(localStorage.levels); // load from local storage
    var spawnData = window.LEVELS[WorldSettings.currentLevelIndex].playerStartPos;
    if (spawnData == undefined) return
    spawnSplit = spawnData.split(",")
    spawn.position = new powerupjs.Vector2(parseInt(spawnSplit[0]), parseInt(spawnSplit[1]))

    this.player.position = spawn.position.copy(); // set player position to spawn point
    this.player.spawnPosition = this.player.position.copy(); // set spawn position
    this.player.adjustHitbox(); // adjust hitbox to match sprite
    WorldSettings.activePlayer = this.player;
}
