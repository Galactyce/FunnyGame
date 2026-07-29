// Creates the player object and initializes movement and collision state.
function Player(layer, id) {
    powerupjs.AnimatedGameObject.call(this, layer, id);
    this.currentLevelIndex;
    this.previousYPosition;
    this.jumpKey;
    this.moveSpeed;
    this.jumpForce;
    this.spawnPosition;
    this.circleHitbox = new powerupjs.Circle();
    this.tileLeft = false;
    this.tileRight = false;
    this.previousWallJumpDir = ""
    this.jumpAvailable = true;
    this.airDrag = true;
    this.timeAfterWallJump = 0;
    this.directionFacing = "right";
    this.detaching = false;
    this.detachTime = 0;
    this.detachBufferTime;
    this.accelerationMultiplier;
    this.stableBox;
    this.resetJumpVelo = false;
    this.neutralJumpTime;
    this.initialize();
    this.baseVelocity = 0;
    this.collidingTiles = new powerupjs.GameObjectList();

    this.loadAnimation(sprites.player["idle"], "idle", true, 0.05);
    this.loadAnimation(sprites.player["run"], "run", true, 0.05);
    this.loadAnimation(sprites.player["jump"], "jump", true, 0.2);
    this.loadAnimation(sprites.player["fall"], "fall", true, 0.2);
    this.playAnimation("idle");
}

Player.prototype = Object.create(powerupjs.AnimatedGameObject.prototype);

// Chooses the player's collision shape for the current tile.
Player.prototype.getCollisionBounds = function(tile) {
    if (tile.hitbox.radius != null) {
        this.circleHitbox.draw();
        return this.circleHitbox;
    }

    return new powerupjs.Rectangle(this.hitbox.x, this.hitbox.y, this.hitbox.width, this.hitbox.height);
}

// Resolves the player response for a single tile collision.
Player.prototype.resolveTileCollision = function(tile, tileBounds, boundingBox) {
    var depth = boundingBox.calculateIntersectionDepth(tileBounds);

    if (this.resolveHorizontalTileCollision(depth, tileBounds)) {
        boundingBox = this.getCollisionBounds(tile);
        boundingBox.height += 0.5;
        depth = boundingBox.calculateIntersectionDepth(tileBounds);
    }

    this.resolveVerticalTileCollision(tile, tileBounds, boundingBox, depth);
}

// Applies the horizontal side of a collision before any vertical response.
Player.prototype.resolveHorizontalTileCollision = function(depth, tileBounds) {
    if (Math.abs(depth.x) >= Math.abs(depth.y)) return false;

    this.position.x += depth.x * 1.1;
    this.adjustHitbox();

    // Ensure we are fully separated from the wall tile after depth correction.
    if (this.hitbox.intersects(tileBounds)) {
        var horizontalNudge = depth.x > 0 ? 0.75 : -0.75;
        for (var i = 0; i < 5 && this.hitbox.intersects(tileBounds); i++) {
            this.position.x += horizontalNudge;
            this.adjustHitbox();
        }
    }

    this.tileLeft = (depth.x > 0);
    this.tileRight = (depth.x < 0);
    this.detaching = false;
    this.velocity.x = 0;
    return true;
}

// Applies the vertical side of a collision after the horizontal adjustment is settled.
Player.prototype.resolveVerticalTileCollision = function(tile, tileBounds, boundingBox, depth) {
    if (!boundingBox.intersects(tileBounds)) return;

    // if (!this.stableBox.intersects(tileBounds)) return;

    var landedOnTile = depth.y < 0 && this.velocity.y >= 0;
    var hitTileFromBelow = depth.y > 0 && this.velocity.y < 0;
    if (landedOnTile) {
        this.velocity.y = 0;
        this.baseVelocity = tile.velocity.x;
        this.position.y += (depth.y * 1.1);
        this.adjustHitbox();
        this.detachFromWall();
        return true;

    }
    else if (hitTileFromBelow) { // Hit the bottom of a tile while moving up
        if (this.velocity.y < 0) this.velocity.y *= -0.1;
        this.capMoveSpeed(1.5);
        this.jumpAvailable = false;
    }

    this.position.y += (depth.y * 1.1);
    this.adjustHitbox();
    this.detachFromWall();
    return false;
}

// Checks whether the player's feet are supported by a solid tile.
Player.prototype.isStandingOnTile = function(tileBounds) {
    var footSensor = new powerupjs.Rectangle(
        this.hitbox.x,
        this.hitbox.bottom - 2,
        this.hitbox.width,
        4
    );

    return this.velocity.y >= 0 &&
        tileBounds.intersects(footSensor) &&
        this.hitbox.bottom <= tileBounds.bottom + 4;
}

// Advances movement, collisions, and camera state each frame.
Player.prototype.update = function (delta) {
    powerupjs.AnimatedGameObject.prototype.update.call(this, delta);
    this.origin = this.center; // set origin to center for mirroring
    this.adjustHitbox(); // adjust hitbox to match position
    this.simulateGravity(); // apply gravity
    this.handleCollisions(); // handle collisions before moving
    this.handleCameraPos(delta);
    if (this.position.y > WorldSettings.mapBottom) {
        this.die();
    }

    if (!this.airDrag && this.velocity.x == 0) {
        this.airDrag = true; // reset air drag when stopped
    }

    this.updateDetachState(delta);
}

// Clears wall-detach protection after the buffer expires.
Player.prototype.updateDetachState = function(delta) {
    if (!this.detaching) return;

    this.detachTime -= delta;
    if (this.detachTime > 0) return;

    this.tileLeft = false;
    this.tileRight = false;
    this.detaching = false;
}

// Smoothly follows the player with the camera.
Player.prototype.handleCameraPos = function(delta) {
    var V = this.centerOfCamera.subtract(powerupjs.Camera.position); // vector from camera to player
    if (Math.abs(V.y) < 4 && Math.abs(V.x) < 4) { 
        powerupjs.Camera.position = this.centerOfCamera ; // snap camera to player if close enough
        return;
    }
    // Pull harder toward the player for a stricter camera follow feel.
    var strictSmoothing = Math.max(1, powerupjs.Camera.smoothingFactor * 0.6);
    V = V.multiply(1 / strictSmoothing); // scale by smoothing factor
    powerupjs.Camera.velocity = V; // set camera velocity
    var cameraSpeedCap = this.moveSpeed * 2;
    if (powerupjs.Camera.velocity.x > cameraSpeedCap) powerupjs.Camera.velocity.x = cameraSpeedCap; // cap camera velocity
    if (powerupjs.Camera.velocity.x < -cameraSpeedCap) powerupjs.Camera.velocity.x = -cameraSpeedCap; // cap camera velocity
    // if (V.y > 60) powerupjs.Camera.velocity.y = this.velocity.y;
    powerupjs.Camera.update(delta); // update camera position   
    powerupjs.Camera.manageBoundaries(WorldSettings.currentLevel.room.cameraBounds); // keep camera within level bounds
}

// Rebuilds the player's collision shapes from the current position.
Player.prototype.adjustHitbox = function () {

    this.hitbox = new powerupjs.Rectangle( // set hitbox smaller than bounding box
        this.boundingBox.x + this.width / 16, 
        this.boundingBox.y + this.height / 16,
        this.boundingBox.width - this.width / 8,
        this.boundingBox.height - this.height / 16
    )

    this.circleHitbox = new powerupjs.Circle( // set circular hitbox
        this.position.x, this.position.y, this.hitbox.width / 2
    );

    this.stableBox = new powerupjs.Rectangle(this.hitbox.x + 0.5, this.hitbox.y, this.hitbox.width - 1, this.hitbox.height + 1); // set stable box for collision detection
}

// Applies gravity or wall-slide behavior to vertical velocity.
Player.prototype.simulateGravity = function () {
    if ((this.tileLeft || this.tileRight) && this.velocity.y > 10 && !this.grounded) { // wall sliding only while falling down
        this.velocity.y = WorldSettings.wallSlideSpeed * this.scale; // set downward speed to wall slide speed
    }
    else {
        this.velocity.y += WorldSettings.gravity * this.scale; // apply gravity
    }

    if (this.velocity.y > WorldSettings.terminalVelocity * this.scale) this.velocity.y = WorldSettings.terminalVelocity * this.scale; // cap downward velocity
}

// Processes tile collisions and updates grounded state.
Player.prototype.handleCollisions = function () {
    this.clearPhysicsDebugHighlights();
    this.debugCollisionTiles = [];
    this.grounded = false;

    for (var i = 0; i < WorldSettings.currentLevel.room.tileFields.length; i++) {
        var field = WorldSettings.currentLevel.room.tileFields[i];

        for (var l = 0; l < field.length; l++) {
            var tile = field.at(l);
            if (tile == null || tile.hitboxType == "none") continue;

            var tileBounds = tile.hitbox;
            var boundingBox = this.getCollisionBounds(tile);
            boundingBox.height += 0.5;

            if (!tileBounds.intersects(boundingBox) || tile.hitboxType == "void") {
                this.collidingTiles.remove(tile);
                continue;
            }

            tile.physicsHighlighted = WorldSettings.debugMode;
            this.collidingTiles.add(tile);
            this.debugCollisionTiles.push(tile);

            if (tile.hitboxType == "hurt") {
                this.die();
                continue;
            }

            this.resolveTileCollision(tile, tileBounds, boundingBox);
        }
    }
    this.refreshGroundedState();
    this.previousYPosition = this.position.y; // store previous Y position for next frame
    this.updatePhysicsDebugArea();
}

// Recomputes grounded from the tiles directly beneath the player.
Player.prototype.refreshGroundedState = function() {
    for (var i = 0; i < WorldSettings.currentLevel.room.tileFields.length; i++) {
        var field = WorldSettings.currentLevel.room.tileFields[i];
        for (var l = 0; l < field.length; l++) {
            var tile = field.at(l);
            if (tile == null || tile.hitboxType != "solid") continue;
            if (this.isStandingOnTile(tile.hitbox)) {
                this.grounded = true;
                this.velocity.y = 0;
                this.baseVelocity = tile.velocity.x;
                return;
            }
        }
    }
}

// Clears the per-frame physics debug state from all tiles.
Player.prototype.clearPhysicsDebugHighlights = function() {
    for (var i = 0; i < WorldSettings.currentLevel.room.tileFields.length; i++) {
        var field = WorldSettings.currentLevel.room.tileFields[i];
        for (var l = 0; l < field.length; l++) {
            var tile = field.at(l);
            if (tile == null) continue;
            tile.physicsHighlighted = false;
        }
    }
}

// Writes the current collision set into the on-page debug area.
Player.prototype.updatePhysicsDebugArea = function() {
    var debugArea = document.getElementById("debugArea");
    if (!debugArea) return;

    if (!WorldSettings.debugMode) {
        debugArea.style.display = "none";
        debugArea.textContent = "";
        return;
    }

    debugArea.style.display = "block";

    var lines = [];
    lines.push("Physics debug");
    lines.push("Collision tiles: " + this.debugCollisionTiles.length);
    lines.push("Grounded: " + this.grounded);
    lines.push("Tile left/right: " + this.tileLeft + " / " + this.tileRight);
    lines.push("Velocity: " + this.velocity.x.toFixed(2) + ", " + this.velocity.y.toFixed(2));
    lines.push("Wallslide: " + ((this.tileLeft || this.tileRight) && !this.grounded));

    for (var i = 0; i < this.debugCollisionTiles.length; i++) {
        var tile = this.debugCollisionTiles[i];
        var tileLabel = tile.key || tile.hitboxType || "tile";
        var tileIndex = tile.index ? "(" + tile.index.x + ", " + tile.index.y + ")" : "(unknown)";
        lines.push(tileLabel + " " + tileIndex);
    }

    debugArea.textContent = lines.join("\n");
}

// Starts the short buffer that prevents instant reattachment to a wall.
Player.prototype.detachFromWall = function () {
    if (this.detaching) return; // prevent multiple detachments
    this.detaching = true; // set detaching to true
    this.detachTime = this.detachBufferTime; // set detach time
}



// Respawns the player at the spawn point and resets motion.
Player.prototype.die = function () {
    this.position = this.spawnPosition.copy(); // respawn player
    this.velocity = new powerupjs.Vector2(0, 0); // reset velocity
    powerupjs.Camera.position = this.centerOfCamera; // reset camera position
}

// Computes the camera position needed to center the player on screen.
Object.defineProperty(Player.prototype, "centerOfCamera", {
    get: function () {
        return new powerupjs.Vector2(this.position.x - powerupjs.Game.size.x / 2, // center camera on player
            this.position.y - powerupjs.Game.size.y / 2
        );
    }
})

// Clamps horizontal speed relative to carried momentum.
Player.prototype.capMoveSpeed = function(modifier) {
    var modifier = typeof modifier != 'undefined' ? modifier : 1;   // Adjust speed cap in certain scenarios
    if (this.velocity.x < (this.baseVelocity - this.moveSpeed) * modifier) this.velocity.x = (this.baseVelocity - this.moveSpeed) * modifier;
    if (this.velocity.x > (this.baseVelocity + this.moveSpeed) * modifier) this.velocity.x = (this.baseVelocity + this.moveSpeed) * modifier;
}

// Applies horizontal movement, air drag, and facing updates.
Player.prototype.handleMoving = function(delta) {
    if (powerupjs.Keyboard.down(powerupjs.Keys.left)) {
        var speed = this.moveSpeed;
        this.directionFacing = "left";
        if (this.previousWallJumpDir == "right") speed /= 2;
        if (this.velocity.x > 0 && (this.grounded)) this.velocity.x = 0;
        if (this.velocity.x > -speed) this.velocity.x -= speed * (delta * this.accelerationMultiplier);

        this.mirror = true;
        this.detachFromWall();
    }
    else if (powerupjs.Keyboard.down(powerupjs.Keys.right)) {
        var speed = this.moveSpeed;
        this.directionFacing = "right";
        if (this.previousWallJumpDir == "left") speed /= 2;
        if (this.velocity.x < 0 && (this.grounded)) this.velocity.x = 0;
        if (this.velocity.x < speed) this.velocity.x += speed * (delta * this.accelerationMultiplier);

        this.mirror = false;
        this.detachFromWall();
    }
    else {
        if ((this.grounded || this.timeAfterWallJump > this.neutralJumpTime) && Math.abs(this.baseVelocity < 1) && this.airDrag)
            this.velocity.x = this.baseVelocity;
        else
            this.velocity.x *= this.airResistance;

        this.detachFromWall();
    }

    if (this.grounded) {
        this.airDrag = true;
        this.previousWallJumpDir = "";

        if (this.velocity.x > 0) {
            this.directionFacing = "right";
            this.playAnimation("run");
        }
        else if (this.velocity.x < 0) {
            this.directionFacing = "left";
            this.playAnimation("run");
        }
        else {
            this.playAnimation("idle");
        }
    }
    else {
        if (this.velocity.y < -0.1) {
            this.playAnimation("jump");
        }
        else if (this.velocity.y > 0.1) {
            this.playAnimation("fall");
        }
    }


}

// Handles ground jumps, wall jumps, and jump release cuts.
Player.prototype.handleJumps = function() { // jump handling
    if (powerupjs.Keyboard.down(this.jumpKey)) { // jump key pressed
        if (this.grounded && this.jumpAvailable) { // jump from ground
            this.jump(); // perform jump
            return;
        }
        if ((this.tileLeft || this.tileRight) && this.jumpAvailable && !this.grounded) { // wall jump
            this.jump(); // perform jump
            
            if (this.tileLeft) { // wall on left side
                this.velocity.x = this.wallJumpForce; // push right
                this.previousWallJumpDir = "right"; // remember direction
            }
            if (this.tileRight) { // wall on right side
                this.velocity.x = -this.wallJumpForce; // push left
                this.previousWallJumpDir = "left"; // remember direction
            }
            this.detachFromWall(); // detach from wall after wall jump
        }
    }
    else {
        this.jumpAvailable = true; // reset jump availability when jump key released
        if (!this.resetJumpVelo ) return; // jump key not held
        this.resetJumpVelo = false; // prevent multiple cuts
        if (this.velocity.y < 0) { // if moving upwards
            this.velocity.y /= 3;    // cut jump short when jump key is released
        }
    }
}

// Performs a jump and arms the jump-cut buffer.
Player.prototype.jump = function() {
    this.velocity.y = this.jumpForce; // jump
    this.jumpAvailable = false; // prevent double jump
    this.timeAfterWallJump = 0; // reset wall jump timer
    this.resetJumpVelo = true; // allow jump cut
}

// Advances timers and dispatches movement actions from input.
Player.prototype.handleInput = function (delta) {
    powerupjs.AnimatedGameObject.prototype.handleInput.call(this, delta);
    this.timeAfterWallJump += delta; // wall jump timer

    if (powerupjs.Keyboard.pressed(powerupjs.Keys.P)) {
        WorldSettings.debugMode = !WorldSettings.debugMode;
        if (!WorldSettings.debugMode) {
            this.clearPhysicsDebugHighlights();
            this.debugCollisionTiles = [];
            this.updatePhysicsDebugArea();
        }
    }

    if (this.grounded) this.capMoveSpeed(); // cap speed on ground

    this.handleMoving(delta); // handle movement
    this.handleJumps(); // handle jumps

}

// Draws the player and optional debug hitboxes.
Player.prototype.draw = function () {
    powerupjs.AnimatedGameObject.prototype.draw.call(this);
    if (powerupjs.Keyboard.down(powerupjs.Keys.P)) { // draw hitboxes for debugging
        this.hitbox.draw("red"); // draw hitbox for debugging
        this.circleHitbox.draw("red"); // draw circle hitbox for debugging
        this.stableBox.draw("blue"); // draw stable box for debugging
    }

}

Object.defineProperty(Player.prototype, "isGrounded", { // get grounded state
    get: function() {
        return this.grounded;
    }
});

Object.defineProperty(Player.prototype, "isOnWall", { // get on wall state
    get: function() {
        return this.tileLeft || this.tileRight;
    }
});

Object.defineProperty(Player.prototype, "isWallSliding", { // get wall sliding state
    get: function() {
        return (this.tileLeft || this.tileRight) && !this.grounded;
    }
});

Object.defineProperty(Player.prototype, "isWallJumping", { // get wall jumping state
    get: function() {
        return this.previousWallJumpDir != "";
    }
});

Object.defineProperty(Player.prototype, "isFalling", { // get falling state
    get: function() {
        return this.velocity.y > 0;
    }
});

Object.defineProperty(Player.prototype, "isJumping", { // get jumping state
    get: function() {
        return this.velocity.y < 0;
    }
});

Object.defineProperty(Player.prototype, "isMoving", { // get moving state
    get: function() {
        return this.velocity.x != 0;
    }
});

Object.defineProperty(Player.prototype, "speed", { // get player speed
    get: function() {
        return this.velocity.length();
    }
});

Object.defineProperty(Player.prototype, "isDetaching", { // get detaching state
    get: function() {
        return this.detaching;
    }
});

Object.defineProperty(Player.prototype, "isJumpCutting", { // get jump cutting state
    get: function() {
        return this.resetJumpVelo;
    }
});