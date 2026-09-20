function TravelPoint(position) {
    var point = position || new powerupjs.Vector2(0, 0);
    powerupjs.StretchyRectangle.call(this, point.x - 32, point.y - 32, 64, 64, 16, 16);
    this.layer = ID.layer_objects;
    this.id = "travel_point";
    this.targetTravelPoint = null;
    this.currentRoomIndex = null; // will be set when the travel point is added to a room
    this.targetID = 0; // ID of the target travel point in the target room
    this.IDLabel = new powerupjs.Label("Arial", "12px", ID.layer_overlays, 0, powerupjs.Color.white);
    this.lastClickTime = 0;
    this.doubleClickWindowMs = 300;
    this.roomID = null; // will be set when the travel point is added to a room
}

TravelPoint.prototype = Object.create(powerupjs.StretchyRectangle.prototype);
TravelPoint.prototype.constructor = TravelPoint;

Object.defineProperty(TravelPoint.prototype, "position", {
    get: function () {
        return new powerupjs.Vector2(this.x + this.width / 2, this.y + this.height / 2);
    },
    set: function (value) {
        if (!value) return;
        this.x = value.x - this.width / 2;
        this.y = value.y - this.height / 2;
        this.updateHandlePositions();
    }
});

TravelPoint.prototype.wellFormedAssertions = function() {
    console.assert(this.targetID > 0, "TargetID should not be negative or 0");
    console.assert(this.targetTravelPoint !== null, "Target travel point should not be null");
    console.assert(this.currentRoomIndex !== null, "Current room index should not be null");
    console.assert(this.roomID !== null, "Room ID should not be null");
    console.assert(WorldSettings.cameraBounds.contains(this.position), "Position should be within camera bounds");
};

TravelPoint.prototype.handleInput = function(delta) {
    if (WorldSettings.currentState !== "editing") return;
    powerupjs.StretchyRectangle.prototype.handleInput.call(this, delta);

    var editorState = powerupjs.GameStateManager.get(ID.game_state_editor);
    if (!editorState || editorState.mode !== "Editing") return;
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
    this.updateHandlePositions();
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

    if (player.hitbox.intersects(travelHitbox)) { // Player has entered the travel point's hitbox
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
    if (WorldSettings.currentState === "editing") {
        powerupjs.StretchyRectangle.prototype.draw.call(this, "purple");
    }
    else {
        powerupjs.Rectangle.prototype.draw.call(this, "purple");
    }
    if (WorldSettings.currentState === "editing") {
        this.IDLabel.text = "ID: " + this.id + " -> " + this.targetID;
        this.IDLabel.position = new powerupjs.Vector2(this.screenPosition.x - 20, this.screenPosition.y - 30);
        this.IDLabel.draw();
    }

}

TravelPoint.prototype.manageHitboxes = function() {
    this.updateHandlePositions();
    this.hitbox = this.boundingBox;
};

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

