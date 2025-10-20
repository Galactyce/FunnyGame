function Player(layer, id) {
    powerupjs.AnimatedGameObject.call(this, layer, id);
    this.currentLevelIndex;
    this.previousYPosition;
    this.jumpKey = powerupjs.Keys.C;
    this.moveSpeed = 55;
    this.jumpForce = -155;
    this.spawnPosition;
}

Player.prototype = Object.create(powerupjs.AnimatedGameObject.prototype);

Player.prototype.update = function (delta) {
    powerupjs.AnimatedGameObject.prototype.update.call(this, delta);
    this.origin = this.center; // set origin to center for mirroring
    this.adjustHitbox(); // adjust hitbox to match position
    this.simulateGravity(); // apply gravity
    this.handleCollisions(); // handle collisions before moving
    var targetPosition = new powerupjs.Vector2(this.position.x - powerupjs.Game.size.x / 2, // center camera on player
        this.position.y - powerupjs.Game.size.y / 2
    );
    var V = targetPosition.subtract(powerupjs.Camera.position); // vector from camera to player
    V = V.multiply(1 / powerupjs.Camera.smoothingFactor); // scale by smoothing factor
    powerupjs.Camera.velocity = V; // set camera velocity
    if (powerupjs.Camera.velocity.x > this.moveSpeed) powerupjs.Camera.velocity.x = this.moveSpeed; // cap camera velocity
    if (powerupjs.Camera.velocity.x < -this.moveSpeed) powerupjs.Camera.velocity.x = -this.moveSpeed;
    if (powerupjs.Camera.velocity.y > this.moveSpeed) powerupjs.Camera.velocity.y = this.moveSpeed;
    if (powerupjs.Camera.velocity.y < -this.moveSpeed) powerupjs.Camera.velocity.y = -this.moveSpeed;
    powerupjs.Camera.update(delta); // update camera position
}

Player.prototype.adjustHitbox = function () {

    this.hitbox = new powerupjs.Rectangle( // set hitbox smaller than bounding box
        this.boundingBox.x + this.width / 16,
        this.boundingBox.y + this.height / 16,
        this.boundingBox.width - this.width / 8,
        this.boundingBox.height - this.height / 16
    )
}

Player.prototype.simulateGravity = function () {
    this.velocity.y += WorldSettings.gravity; // apply gravity
    if (this.velocity.y > WorldSettings.terminalVelocity) // cap downward velocity
        this.velocity.y = WorldSettings.terminalVelocity;

}

Player.prototype.handleCollisions = function () {

    for (var i = 0; i < WorldSettings.levels[this.currentLevelIndex].tileFields.length; i++) {  // for each tile field
        var field = WorldSettings.levels[this.currentLevelIndex].tileFields[i]; // get tile field

        for (var l = 0; l < field.length; l++) { // for each tile in field
            var tile = field.at(l); // get tile
            if (tile == null || tile.hitboxType == "none") // empty tile or non-collidable tile
                continue;
            var tileBounds = tile.hitbox; // get tile hitbox
            var boundingBox = new powerupjs.Rectangle(this.hitbox.x, this.hitbox.y, this.hitbox.width, this.hitbox.height); // copy of player hitbox
            boundingBox.height += 1; // extend hitbox downwards slightly to prevent getting stuck on corners

            if (!tileBounds.intersects(boundingBox)) // no collision
                continue;
            if (tile.hitboxType == "hurt") { // hurtful tile
                this.position = this.spawnPosition.copy(); // respawn player
                this.velocity = new powerupjs.Vector2(0, 0);
                continue;
            }

            var depth = boundingBox.calculateIntersectionDepth(tileBounds); // get intersection depth
            if (Math.abs(depth.x) < Math.abs(depth.y)) { // horizontal collision
                this.position.x += (depth.x * 1.05); // nudge out of collision
                this.velocity.x = 0; // stop horizontal movement
                continue
            }
            if (this.previousYPosition <= tileBounds.top) { // if landing on top of tile
                if (this.velocity.y > 0) this.grounded = true;
                this.velocity.y = 0; // stop downward velocity
            }
            if (boundingBox.top <= tileBounds.bottom) { // if hitting head on bottom of tile
                this.velocity.y *= -0.1; // small bounce when hitting head
            }
            if (boundingBox.intersects(tileBounds))
                this.position.y += depth.y; // nudge out of collision

            this.adjustHitbox();

        }
        if (this.velocity.y != 0) // if moving vertically, not grounded
            this.grounded = false;

    }
    this.previousYPosition = this.position.y;
}

Player.prototype.groundCheck = function () {

}


Player.prototype.handleInput = function (delta) {
    powerupjs.AnimatedGameObject.prototype.handleInput.call(this, delta);

    if (powerupjs.Keyboard.down(powerupjs.Keys.left)) {
        if (this.velocity.x > 0 && this.grounded) // if changing direction on ground, stop first
            this.velocity.x = 0;
        if (this.velocity.x > -this.moveSpeed) // if below max speed, accelerate
            this.velocity.x -= this.moveSpeed * (delta * 2);
        if (this.velocity.x < -this.moveSpeed && this.grounded) // if above max speed, set to max speed
            this.velocity.x = -this.moveSpeed;
        this.mirror = true;
    }
    else if (powerupjs.Keyboard.down(powerupjs.Keys.right)) {
        if (this.velocity.x < 0 && this.grounded) // if changing direction on ground, stop first
            this.velocity.x = 0;
        if (this.velocity.x < this.moveSpeed)   // if below max speed, accelerate
            this.velocity.x += this.moveSpeed * (delta * 2);
        if (this.velocity.x > this.moveSpeed && this.grounded) // if above max speed, set to max speed
            this.velocity.x = this.moveSpeed;
        this.mirror = false
    }
    else {
        this.velocity.x = 0; // no horizontal input, stop horizontal movement
    }
    if (powerupjs.Keyboard.down(this.jumpKey)) {
        if (this.grounded) {
            this.velocity.y = this.jumpForce; // jump
            this.grounded = false;
        }
    }
    else {
        if (this.velocity.y < 0) {
            this.velocity.y /= 1.06;    // cut jump short when jump key is released
        }
    }


}

Player.prototype.draw = function () {
    powerupjs.AnimatedGameObject.prototype.draw.call(this);
    if (powerupjs.Keyboard.down(powerupjs.Keys.P))
        this.hitbox.draw(); // draw hitbox for debugging
}
