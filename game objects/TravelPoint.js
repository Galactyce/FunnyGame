function TravelPoint(position, targetRoomIndex, targetPosition) {
    DraggableObject.call(this, sprites.blank, ID.layer_objects, "travel_point");
    this.position = position;
    this.targetRoomIndex = targetRoomIndex;
    this.targetPosition = targetPosition;
    this.currentRoomIndex = null; // will be set when the travel point is added to a room


}

TravelPoint.prototype = Object.create(DraggableObject.prototype);

TravelPoint.prototype.update = function(delta) {
    DraggableObject.prototype.update.call(this, delta);
    if (!WorldSettings.activePlayer) return;
    var player = WorldSettings.activePlayer;
    var travelHitbox = this.boundingBox;
    if (!travelHitbox) return;

    this.hitbox = travelHitbox;
    if (player.hitbox.intersects(travelHitbox)) {
        if (this.currentRoomIndex !== null && this.currentRoomIndex !== WorldSettings.currentLevel.currentRoomIndex) {
            return; // Player is not in the same room as the travel point
        }
        var playingState = powerupjs.GameStateManager.get(ID.game_state_playing);
        if (playingState && typeof playingState.switchRoom === 'function') {
            playingState.switchRoom(this.targetRoomIndex, this.targetPosition.copy());
            return;
        }

        WorldSettings.currentLevel.switchToRoom(this.targetRoomIndex);
        player.position = this.targetPosition.copy();
        player.spawnPosition = this.targetPosition.copy();
    }
}

TravelPoint.prototype.draw = function() {
    powerupjs.SpriteGameObject.prototype.draw.call(this);
    if (!this.hitbox) return;
        this.boundingBox.draw("purple");
    
}

