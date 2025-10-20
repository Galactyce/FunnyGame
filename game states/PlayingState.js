function PlayingState(layer) {
    powerupjs.GameObjectList.call(this, layer);
    this.player = new Player();
    this.player.loadAnimation(sprites.player_idle, "idle", true);
    this.player.playAnimation("idle");
    this.tileFields = new powerupjs.GameObjectList(); // list to hold tile fields
    this.add(this.tileFields);
    this.player.currentLevelIndex = WorldSettings.currentLevelIndex; // set player's current level
    this.player.position = powerupjs.GameStateManager.get(ID.game_state_editor).find(ID.player_spawn).position.copy(); // set player position to spawn point
    this.player.spawnPosition = this.player.position.copy(); // set spawn position
    this.player.adjustHitbox(); // adjust hitbox to match sprite
    this.add(this.player);

    this.returnButton = new LabelledButton(sprites.button_default, "Return", "Arial", "20px", ID.layer_overlays); // button to return to title screen
    this.returnButton.position = new powerupjs.Vector2(900, 15);
    this.returnButton.ui = true;
    this.add(this.returnButton);
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
    for (var i = 0; i < window.LEVELS[WorldSettings.currentLevelIndex].tiles.length; i++) { // for each tile layer
        var field = new TileField(); // create new tile field
        field.editorLayer = i; // set layer index
        field.loadTiles();  // load tiles for the layer
        this.tileFields.add(field); // add tile field to list
    };

    this.add(this.tileFields); // add tile fields to game state

}
