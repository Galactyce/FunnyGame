function TravelPoint(position) {
    DraggableObject.call(this, sprites.blank, ID.layer_objects, "travel_point");
    this.position = position;
    this.targetTravelPoint = null;
    this.currentRoomIndex = null; // will be set when the travel point is added to a room
    this.targetID = 0; // ID of the target travel point in the target room
    this.IDLabel = new powerupjs.Label("Arial", "12px", ID.layer_overlays, 0, powerupjs.Color.white);
    this.lastClickTime = 0;
    this.doubleClickWindowMs = 300;
}

TravelPoint.prototype = Object.create(DraggableObject.prototype);

TravelPoint.prototype.handleInput = function(delta) {
    DraggableObject.prototype.handleInput.call(this, delta);
    if (WorldSettings.currentState !== "editing") return;
    if (!powerupjs.Mouse.left.pressed) return;
    if (!this.boundingBox.contains(powerupjs.Mouse.position)) return;

    var now = Date.now();
    if (now - this.lastClickTime > this.doubleClickWindowMs) {
        this.lastClickTime = now;
        return;
    }

    this.lastClickTime = 0;
    var input = prompt("Enter target travel point ID:", this.targetID > 0 ? String(this.targetID) : "");
    if (input === null) return;

    var nextTargetId = parseInt(input, 10);
    if (isNaN(nextTargetId) || nextTargetId < 0) return;

    this.targetID = nextTargetId;
    if (WorldSettings.currentLevel && typeof WorldSettings.currentLevel.linkTravelPoints === 'function') {
        WorldSettings.currentLevel.linkTravelPoints();
    }
}

TravelPoint.prototype.update = function(delta) {
    DraggableObject.prototype.update.call(this, delta);
    if (!this.targetTravelPoint && this.targetID > 0 && WorldSettings.currentLevel && typeof WorldSettings.currentLevel.linkTravelPoints === 'function') {
        WorldSettings.currentLevel.linkTravelPoints();
    }
    if (!WorldSettings.activePlayer) return;
    var player = WorldSettings.activePlayer;
    var travelHitbox = this.boundingBox;
    if (!travelHitbox) return;

    this.hitbox = travelHitbox;

    // Prevent instant bounce-back: ignore this point until the player leaves its hitbox.
    if (player.blockedTravelPoint === this) {
        if (!player.hitbox.intersects(travelHitbox)) {
            player.blockedTravelPoint = null;
        }
        return;
    }

    if (player.hitbox.intersects(travelHitbox)) {
        if (this.currentRoomIndex !== null && this.currentRoomIndex !== WorldSettings.currentLevel.currentRoomIndex) {
            return; // Player is not in the same room as the travel point
        }
        var playingState = powerupjs.GameStateManager.get(ID.game_state_playing);
        if (playingState && typeof playingState.switchRoom === 'function') {
            if (!this.targetTravelPoint) return;
            var enteredFromLeft = player.position.x <= this.position.x;
            var spawnOffset = (this.targetTravelPoint.width / 2) + (player.width / 2) + 2;
            var targetSpawn = this.targetTravelPoint.position.copy();

            // Spawn on the opposite side of the destination travel point from the entry side.
            if (enteredFromLeft) targetSpawn.x += spawnOffset;
            else targetSpawn.x -= spawnOffset;

            playingState.switchRoom(this.targetTravelPoint.currentRoomIndex, targetSpawn);
            var activePlayer = WorldSettings.activePlayer;
            if (activePlayer) {
                activePlayer.blockedTravelPoint = this.targetTravelPoint;
                activePlayer.velocity = new powerupjs.Vector2(0, 0);
                activePlayer.adjustHitbox();
            }
            return;
        }

        WorldSettings.currentLevel.switchToRoom(this.targetRoomIndex);
        player.position = this.targetPosition.copy();
        player.spawnPosition = this.targetPosition.copy();
    }
}

TravelPoint.prototype.draw = function() {
    powerupjs.SpriteGameObject.prototype.draw.call(this);
    if (WorldSettings.currentState === "editing") {
        this.IDLabel.text = "ID: " + this.id + " -> " + this.targetID;
        this.IDLabel.position = new powerupjs.Vector2(this.screenPosition.x - 20, this.screenPosition.y - 30);
        this.IDLabel.draw();
    }

    if (!this.hitbox) return;
        this.boundingBox.draw("purple");
    
}

Object.defineProperty(TravelPoint.prototype, "leftSide", {
    get: function() {
        return this.position.x - (this.width / 2);
    }
});

Object.defineProperty(TravelPoint.prototype, "rightSide", {
    get: function() {
        return this.position.x + (this.width / 2);
    }
});

