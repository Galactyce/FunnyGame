function Player(layer, id) {
    powerupjs.AnimatedGameObject.call(this, layer, id);
    this.currentLevelIndex;
    this.previousYPosition;
    this.jumpKey;
    this.dashKey;
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
    this.timeAfterDashing = 0;
    this.dashSpeed;
    this.preDashPos = powerupjs.Vector2.zero;
    this.dashDistance;
    this.dashing = false;
    this.directionFacing = "right";
    this.ableToDash = true;
    this.detaching = false;
    this.detachTime = 0;
    this.detachBufferTime;
    this.horizonatalKeysDown = "";
    this.verticalKeysDown = "";
    this.keyResetTime = 0;
    this.accelerationMultiplier;
    this.stableBox;
    this.resetJumpVelo = false;
    this.neutralJumpTime;
    this.initialize();
    this.baseVelocity = 0;

}

Player.prototype = Object.create(powerupjs.AnimatedGameObject.prototype);

Player.prototype.update = function (delta) {
    powerupjs.AnimatedGameObject.prototype.update.call(this, delta);
    this.origin = this.center; // set origin to center for mirroring
    this.adjustHitbox(); // adjust hitbox to match position
    if (!this.dashing)
        this.simulateGravity(); // apply gravity
    this.handleCollisions(); // handle collisions before moving
    this.handleCameraPos(delta);
    if (this.position.y > WorldSettings.mapBottom) {
        this.die();
    }

    if (!this.airDrag && this.velocity.x == 0) {
        this.airDrag = true; // reset air drag when stopped
    }

    if (this.dashing && (Math.abs(this.preDashPos.x - this.worldPosition.x) > this.dashDistance ||
        Math.abs(this.preDashPos.y - this.worldPosition.y) > this.dashDistance)) {
        this.dashing = false
        this.velocity.x = 0;
        this.velocity.y = this.velocity.y / 4;
        this.airDrag = true;
        if (this.velocity.y < -WorldSettings.terminalVelocity * 10) this.velocity.y = -WorldSettings.terminalVelocity * 1;
    }

    if (this.detaching) {
        this.detachTime -= delta;
        if (this.detachTime <= 0) {
            this.tileLeft = false;
            this.tileRight = false;
            this.detaching = false;
        }
    }

}

Player.prototype.handleCameraPos = function(delta) {
    var V = this.centerOfCamera.subtract(powerupjs.Camera.position); // vector from camera to player
    if (Math.abs(V.y) < 3 && Math.abs(V.x) < 3 && this.velocity.x == 0 && this.velocity.y == 0) { 
        powerupjs.Camera.position = this.centerOfCamera
        return;
    }
    V = V.multiply(1 / powerupjs.Camera.smoothingFactor); // scale by smoothing factor
    powerupjs.Camera.velocity = V; // set camera velocity
    if (powerupjs.Camera.velocity.x > this.moveSpeed) powerupjs.Camera.velocity.x = this.moveSpeed; // cap camera velocity
    if (powerupjs.Camera.velocity.x < -this.moveSpeed) powerupjs.Camera.velocity.x = -this.moveSpeed;
    // if (V.y > 60) powerupjs.Camera.velocity.y = this.velocity.y;
    powerupjs.Camera.update(delta); // update camera position
    powerupjs.Camera.manageBoundaries(WorldSettings.currentLevel.cameraBounds);
}

Player.prototype.adjustHitbox = function () {

    this.hitbox = new powerupjs.Rectangle( // set hitbox smaller than bounding box
        this.boundingBox.x + this.width / 16,
        this.boundingBox.y + this.height / 16,
        this.boundingBox.width - this.width / 8,
        this.boundingBox.height - this.height / 16
    )

    this.circleHitbox = new powerupjs.Circle(
        this.position.x, this.position.y, this.hitbox.width / 2
    );

    this.stableBox = new powerupjs.Rectangle(this.hitbox.x + 0.5, this.hitbox.y, this.hitbox.width - 1, this.hitbox.height + 1);
}

Player.prototype.simulateGravity = function () {
    if ((this.tileLeft || this.tileRight) && this.velocity.y > 0) {
        this.velocity.y = WorldSettings.wallSlideSpeed * this.scale;
    }
    else {
        this.velocity.y += WorldSettings.gravity / this.scale;
    }


    if (this.velocity.y > WorldSettings.terminalVelocity * this.scale) this.velocity.y = WorldSettings.terminalVelocity * this.scale;

}

Player.prototype.handleCollisions = function () {

    for (var i = 0; i < WorldSettings.currentLevel.tileFields.length; i++) {  // for each tile field
        var field = WorldSettings.currentLevel.tileFields[i]; // get tile field
        for (var l = 0; l < field.length; l++) { // for each tile in field
            var tile = field.at(l); // get tile
            if (tile == null || tile.hitboxType == "none") // empty tile or non-collidable tile
                continue;

            var tileBounds = tile.hitbox; // get tile hitbox
            if (tile.hitbox.radius != null) {
                var boundingBox = this.circleHitbox;
                this.circleHitbox.draw()

            }
            else var boundingBox = new powerupjs.Rectangle(this.hitbox.x, this.hitbox.y, this.hitbox.width, this.hitbox.height); // copy of player hitbox
            boundingBox.height += 0.5; // extend hitbox downwards slightly to prevent getting stuck on corners

            if (!tileBounds.intersects(boundingBox) || tile.hitboxType == "void") // no collision
                continue;


            if (tile.hitboxType == "hurt") { // hurtful tile
                if (this.dashing) continue
                this.die()
                continue;
            }
            else {
                var depth = boundingBox.calculateIntersectionDepth(tileBounds); // get intersection depth
                if (Math.abs(depth.x) < Math.abs(depth.y)) { // horizontal collision
                    this.position.x += (depth.x * 1.1); // nudge out of collision
                    this.tileLeft = (depth.x > 0);
                    this.tileRight = (depth.x < 0);
                    this.detaching = false
                    if (this.dashing) {
                        this.dashing = false;
                        this.velocity.y = 0;
                    }
                    this.velocity.x = 0; // stop horizontal movement
                    continue
                }

                if (this.previousYPosition <= tileBounds.top) { // if landing on top of tile
                    if (!this.stableBox.intersects(tileBounds)) continue;
                    if (this.velocity.y > 0) this.grounded = true;
                    this.ableToDash = true;
                    this.velocity.y = 0; // stop downward velocity
                    this.baseVelocity = tile.velocity.x
                    // console.log(tile.velocity.x + ", " + this.velocity.x)
                    
                }
                else if (boundingBox.top <= tileBounds.bottom) { // if hitting head on bottom of tile
                    if (this.velocity.y < 0)
                        this.velocity.y *= -0.1;
                    this.capMoveSpeed(1.5);
                    this.jumpAvailable = false;
                    this.dashing = false;
                }
                if (boundingBox.intersects(tileBounds)) {
                    if (!this.stableBox.intersects(tileBounds)) continue; // prevent stupid clipping to corners in walls
                    this.position.y += depth.y; // nudge out of collision
                    this.detachFromWall();
                }
            }
            this.adjustHitbox();

        }
        if (this.velocity.y != 0) // if moving vertically, not grounded
            this.grounded = false;

    }
    this.previousYPosition = this.position.y;
}

Player.prototype.detachFromWall = function () {
    if (this.detaching) return
    this.detaching = true;
    this.detachTime = this.detachBufferTime;
    console.log()
}



Player.prototype.die = function () {
    this.position = this.spawnPosition.copy(); // respawn player
    this.velocity = new powerupjs.Vector2(0, 0);
    powerupjs.Camera.position = this.centerOfCamera;
}

Object.defineProperty(Player.prototype, "centerOfCamera", {
    get: function () {
        return new powerupjs.Vector2(this.position.x - powerupjs.Game.size.x / 2, // center camera on player
            this.position.y - powerupjs.Game.size.y / 2
        );
    }
})

Player.prototype.resetDirectionKeys = function () {
    if (!powerupjs.Keyboard.down(powerupjs.Keys.down) && !powerupjs.Keyboard.down(powerupjs.Keys.up)) {
        this.verticalKeysDown = ""
    }
    if (!powerupjs.Keyboard.down(powerupjs.Keys.right) && !powerupjs.Keyboard.down(powerupjs.Keys.left)) {
        this.horizonatalKeysDown = ""
    }
}

Player.prototype.capMoveSpeed = function(modifier) {
    var modifier = typeof modifier != 'undefined' ? modifier : 1;   // Adjust speed cap in certain scenarios
    if (this.velocity.x < (this.baseVelocity - this.moveSpeed) * modifier) this.velocity.x = (this.baseVelocity - this.moveSpeed) * modifier;
    if (this.velocity.x > (this.baseVelocity + this.moveSpeed) * modifier) this.velocity.x = (this.baseVelocity + this.moveSpeed) * modifier;
}

Player.prototype.handleMoving = function(delta) {
  if (powerupjs.Keyboard.down(powerupjs.Keys.left) && !this.dashing) {
        var speed = this.moveSpeed;
        this.directionFacing = "left"
        if (this.previousWallJumpDir == "right") {
            speed /= 2; // Make it harder to move back to wall
        }
        if (this.velocity.x > 0 && (this.grounded)) // if changing direction on ground, stop first
            this.velocity.x = 0;
        if (this.velocity.x > -speed) // if below max speed, accelerate
            this.velocity.x -= speed * (delta * this.accelerationMultiplier);

        this.mirror = true;
        this.detachFromWall();


    }
    else if (powerupjs.Keyboard.down(powerupjs.Keys.right) && !this.dashing) {
        var speed = this.moveSpeed;
        this.directionFacing = "right"
        if (this.previousWallJumpDir == "left") {
            speed /= 2;
        }
        if (this.velocity.x < 0 && (this.grounded)) // if changing direction on ground, stop first
            this.velocity.x = 0;
        if (this.velocity.x < speed)   // if below max speed, accelerate
            this.velocity.x += speed * (delta * this.accelerationMultiplier);
        this.mirror = false
        this.detachFromWall();


    }
    else {
        // airDrag : a boolean meant to manage air resistance. If set to false, the player will not stop midair
        // baseVelocity : if outside sources are adding velocity, carry momentum when dismounting
        if ((this.grounded || this.timeAfterWallJump > this.neutralJumpTime || this.baseVelocity == 0 ) && 
             this.airDrag && !this.dashing) // after 0.6 seconds, stop velocity
            this.velocity.x = this.baseVelocity; // no horizontal input, stop horizontal movement
        else {
            this.velocity.x ^ 0.8;
        }
        this.detachFromWall();
    }

    if (this.grounded) {
        this.airDrag = true;
        this.previousWallJumpDir = ""
    }
}

Player.prototype.handleJumps = function() {
    if (powerupjs.Keyboard.down(this.jumpKey)) {
        if (this.grounded && this.jumpAvailable) {
            this.velocity.y = this.jumpForce; // jump
            this.resetJumpVelo = true;
            this.grounded = false;
            this.jumpAvailable = false;
        }
        if ((this.tileLeft || this.tileRight) && this.jumpAvailable) {
            this.velocity.y = this.jumpForce;
            this.jumpAvailable = false;
            this.timeAfterWallJump = 0;
            this.resetJumpVelo = true;
            
            if (this.tileLeft) {
                this.velocity.x = -this.jumpForce / 2;
                this.previousWallJumpDir = "right"
            }
            if (this.tileRight) {
                this.velocity.x = this.jumpForce / 2;
                this.previousWallJumpDir = "left"
            }
            this.detachFromWall();
        }
    }
    else {
        this.jumpAvailable = true;
        if (!this.resetJumpVelo ) return;
        this.resetJumpVelo = false;
        if (this.velocity.y < 0) {
            this.velocity.y /= 3 * this.scale;    // cut jump short when jump key is released
        }
    }
}

Player.prototype.handleDashes = function() {
 if (powerupjs.Keyboard.down(powerupjs.Keys.up)) {
        this.verticalKeysDown = "up"
    }
    else if (powerupjs.Keyboard.down(powerupjs.Keys.down)) {
        this.verticalKeysDown = "down"
    }
    else {
        if (this.keyResetTime > 0.25) {
            this.resetDirectionKeys();
        }
    }
    if (powerupjs.Keyboard.down(powerupjs.Keys.left)) {
        this.horizonatalKeysDown = "left";
    }
    else if (powerupjs.Keyboard.down(powerupjs.Keys.right)) {
        this.horizonatalKeysDown = "right";
    }
    else {
        if (this.keyResetTime > 0.25) {
            this.resetDirectionKeys();
        }
    }


    if (powerupjs.Keyboard.pressed(this.dashKey) && this.ableToDash) {
        if (this.timeAfterDashing > 0.7) {
            this.timeAfterDashing = 0;
            this.ableToDash = false;
            this.preDashPos = this.worldPosition.copy();
            this.velocity = powerupjs.Vector2.zero;
            this.dashing = true;
            this.worldPosition.y -= 10;
            this.resetJumpVelo = false;

            if (this.horizonatalKeysDown == "left") {
                this.velocity.x = -this.dashSpeed;
                this.dashDistance = 125 * this.scale;
                if (this.horizonatalKeysDown != "") this.dashDistance = 70;
            } else if (this.horizonatalKeysDown == "right") {
                this.velocity.x = this.dashSpeed;
                this.dashDistance = 125 * this.scale;
                if (this.horizonatalKeysDown != "") this.dashDistance = 70;
            }
            if (this.verticalKeysDown == "down") {
                this.velocity.y = this.dashSpeed;
                this.dashDistance = 125 * this.scale;
                if (this.verticalKeysDown != "") this.dashDistance = 70;
            } else if (this.verticalKeysDown == "up") {
                this.velocity.y = -this.dashSpeed;
                this.dashDistance = 125 * this.scale;
                if (this.verticalKeysDown != "") this.dashDistance = 70;

            }

            if (this.verticalKeysDown == "" && this.horizonatalKeysDown == "") {

                if (this.directionFacing == "left") this.velocity.x = -this.dashSpeed;
                else if (this.directionFacing == "right") this.velocity.x = this.dashSpeed;
            }
        }
    }
}

Player.prototype.handleInput = function (delta) {
    powerupjs.AnimatedGameObject.prototype.handleInput.call(this, delta);
    this.timeAfterWallJump += delta;
    this.timeAfterDashing += delta;
    this.keyResetTime += delta

    // CAP SPEED ON GROUND
    if (!this.dashing && this.grounded) this.capMoveSpeed();

    this.handleMoving(delta);
    this.handleJumps();
    this.handleDashes();

   
}

Player.prototype.draw = function () {
    powerupjs.AnimatedGameObject.prototype.draw.call(this);
    if (powerupjs.Keyboard.down(powerupjs.Keys.P)) {
        this.hitbox.draw("red"); // draw hitbox for debugging
        this.circleHitbox.draw("red")
        this.stableBox.draw("blue")
    }

}
