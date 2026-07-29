function TravelPoint(position, targetRoomIndex, targetPosition) {
    DraggableObject.call(this);
    this.position = position;
    this.targetRoomIndex = targetRoomIndex;
    this.targetPosition = targetPosition;
    this.hitbox = new powerupjs.Rectangle(this.position.x - 10, this.position.y - 10, 20, 20);
    this.currentRoomIndex = null; // will be set when the travel point is added to a room


}

TravelPoint.prototype = Object.create(DraggableObject.prototype);

TravelPoint.prototype.update = function(delta) {
    DraggableObject.prototype.update.call(this, delta);
    if (!WorldSettings.activePlayer) return;
    var player = WorldSettings.activePlayer;
    if (player.hitbox.intersects(this.hitbox)) {
        if (this.currentRoomIndex !== null && this.currentRoomIndex !== WorldSettings.currentLevel.currentRoomIndex) {
            return; // Player is not in the same room as the travel point
        }
        WorldSettings.currentLevel.switchToRoom(this.targetRoomIndex, this.targetPosition);
        player.position = this.targetPosition.copy();
        player.spawnPosition = this.targetPosition.copy();
    }
}

TravelPoint.prototype.draw = function() {
    powerupjs.SpriteGameObject.prototype.draw.call(this);
    if (this.hitbox == undefined) return;
    if (WorldSettings.debugMode) {
        this.hitbox.draw("purple");
    }
}