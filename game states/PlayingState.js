function PlayingState(layer) {
    powerupjs.GameObjectList.call(this, layer);
    this.player = new Player();
    this.player.loadAnimation(sprites.player_idle, "idle", true);
    this.player.playAnimation("idle");
    this.tileFields = new powerupjs.GameObjectList();
    this.add(this.tileFields);
}



PlayingState.prototype = Object.create(powerupjs.GameObjectList.prototype);

PlayingState.prototype.update = function(delta) {
    powerupjs.GameObjectList.prototype.update.call(this, delta);
    
}


PlayingState.prototype.loadLevel = function() {
    for (var i = 0; i < window.LEVELS[WorldSettings.currentLevelIndex].tiles.length; i++) {
        var field = new TileField();
        field.editorLayer = i;
        field.loadTiles()
        this.tileFields.add(field)
    };
    
    this.add(this.tileFields);
    this.player.currentLevelIndex = WorldSettings.currentLevelIndex;
    this.player.position = powerupjs.GameStateManager.get(ID.game_state_editor).find(ID.player_spawn).position.copy();
    this.player.spawnPosition = this.player.position.copy();
    this.player.adjustHitbox();
    this.add(this.player);
}
