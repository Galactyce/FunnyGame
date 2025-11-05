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
    this.dashCooldownTimer = 0;
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
    this.collidingTiles = new powerupjs.GameObjectList();
}

Player.prototype = Object.create(powerupjs.AnimatedGameObject.prototype);

Player.prototype.stopDashing = function() {
    this.dashing = false; // stop dashing
    this.velocity.x = 0; // reset horizontal velocity
    this.velocity.y = this.velocity.y / 4; // reduce vertical velocity
    this.airDrag = true; // enable air drag
    if (this.velocity.y < -WorldSettings.terminalVelocity * 10) this.velocity.y = -WorldSettings.terminalVelocity * 1; // cap upward velocity
}

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
        Math.abs(this.preDashPos.y - this.worldPosition.y) > this.dashDistance)) { // stop dashing after reaching dash distance
            console.log("Stopping dash");
        this.stopDashing();
    }

    // if (this.velocity.x < this.dashSpeed && this.velocity.x > -this.dashSpeed && this.dashing) {
    //     this.stopDashing(); // stop dashing if horizontal velocity drops too low
    // }

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
        powerupjs.Camera.position = this.centerOfCamera ; // snap camera to player if close enough
        return;
    }
    V = V.multiply(1 / powerupjs.Camera.smoothingFactor); // scale by smoothing factor
    powerupjs.Camera.velocity = V; // set camera velocity
    if (powerupjs.Camera.velocity.x > this.moveSpeed) powerupjs.Camera.velocity.x = this.moveSpeed; // cap camera velocity
    if (powerupjs.Camera.velocity.x < -this.moveSpeed) powerupjs.Camera.velocity.x = -this.moveSpeed; // cap camera velocity
    // if (V.y > 60) powerupjs.Camera.velocity.y = this.velocity.y;
    powerupjs.Camera.update(delta); // update camera position   
    powerupjs.Camera.manageBoundaries(WorldSettings.currentLevel.cameraBounds); // keep camera within level bounds
}

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

Player.prototype.simulateGravity = function () {
    if ((this.tileLeft || this.tileRight) && this.velocity.y > 0 && !this.grounded) { // wall sliding
        this.velocity.y = WorldSettings.wallSlideSpeed * this.scale; // set downward speed to wall slide speed
    }
    else {
        this.velocity.y += WorldSettings.gravity / this.scale; // apply gravity
    }

    if (this.velocity.y > WorldSettings.terminalVelocity * this.scale) this.velocity.y = WorldSettings.terminalVelocity * this.scale; // cap downward velocity
}

Player.prototype.handleCollisions = function () {

    for (var i = 0; i < WorldSettings.currentLevel.tileFields.length; i++) {  // for each tile field
        var field = WorldSettings.currentLevel.tileFields[i]; // get tile field
        for (var l = 0; l < field.length; l++) { // for each tile in field
            var tile = field.at(l); // get tile
            if (tile == null || tile.hitboxType == "none") // empty tile or non-collidable tile
                continue; // skip to next tile

            var tileBounds = tile.hitbox; // get tile hitbox
            if (tile.hitbox.radius != null) { // circular hitbox
                var boundingBox = this.circleHitbox; // copy of player hitbox
                this.circleHitbox.draw(); // draw circle hitbox
            }
            else var boundingBox = new powerupjs.Rectangle(this.hitbox.x, this.hitbox.y, this.hitbox.width, this.hitbox.height); // copy of player hitbox
            boundingBox.height += 0.5; // extend hitbox downwards slightly to prevent getting stuck on corners

            if (!tileBounds.intersects(boundingBox) || tile.hitboxType == "void") {// no collision
                this.collidingTiles.remove(tile);
                continue; // skip to next tile
            }
            this.collidingTiles.add(tile); // add tile to colliding tiles

            if (tile.hitboxType == "hurt") { // hurtful tile
                if (this.dashing) continue; // skip if dashing
                this.die(); // player dies
                continue; // skip to next tile
            }
            else {
                var depth = boundingBox.calculateIntersectionDepth(tileBounds); // get intersection depth
                if (Math.abs(depth.x) < Math.abs(depth.y)) { // horizontal collision
                    this.position.x += (depth.x * 1.1); // nudge out of collision
                    this.tileLeft = (depth.x > 0); // set tile left/right flags
                    this.tileRight = (depth.x < 0); // set tile left/right flags
                    this.detaching = false; // reset detaching flag
                    this.stopDashing(); // stop dashing if colliding horizontally
                    this.velocity.x = 0; // stop horizontal movement
                    continue; // skip to next tile
                }

                if (this.previousYPosition <= tileBounds.top) { // if landing on top of tile
                    if (!this.stableBox.intersects(tileBounds)) continue; // skip if not intersecting stable box
                    if (this.velocity.y > 0) this.grounded = true; // set grounded if moving downward
                    this.ableToDash = true; // allow dashing
                    this.velocity.y = 0; // stop downward velocity
                    this.baseVelocity = tile.velocity.x; // set base velocity to tile's velocity
                    
                }
                else if (boundingBox.top <= tileBounds.bottom) { // if hitting head on bottom of tile
                    if (this.velocity.y < 0) this.velocity.y *= -0.1; // reverse and reduce upward velocity
                    this.capMoveSpeed(1.5); // cap movement speed
                    this.jumpAvailable = false; // disable jumping
                    this.stopDashing(); // stop dashing
                }
                if (boundingBox.intersects(tileBounds)) {
                    if (!this.stableBox.intersects(tileBounds)) continue; // prevent stupid clipping to corners in walls
                    this.position.y += depth.y; // nudge out of collision
                    this.detachFromWall(); // detach from wall if necessary
                }
            }
            this.adjustHitbox();

        }
        if (this.velocity.y != 0) // if moving vertically, not grounded
            this.grounded = false;

    }
    this.previousYPosition = this.position.y; // store previous Y position for next frame
}

Player.prototype.detachFromWall = function () {
    if (this.detaching) return; // prevent multiple detachments
    this.detaching = true; // set detaching to true
    this.detachTime = this.detachBufferTime; // set detach time
}



Player.prototype.die = function () {
    this.position = this.spawnPosition.copy(); // respawn player
    this.velocity = new powerupjs.Vector2(0, 0); // reset velocity
    powerupjs.Camera.position = this.centerOfCamera; // reset camera position
}

Object.defineProperty(Player.prototype, "centerOfCamera", {
    get: function () {
        return new powerupjs.Vector2(this.position.x - powerupjs.Game.size.x / 2, // center camera on player
            this.position.y - powerupjs.Game.size.y / 2
        );
    }
})

Player.prototype.resetDirectionKeys = function () { // reset direction keys if no input
    if (!powerupjs.Keyboard.down(powerupjs.Keys.down) && !powerupjs.Keyboard.down(powerupjs.Keys.up)) {
        this.verticalKeysDown = ""; // reset vertical keys
    } 
    if (!powerupjs.Keyboard.down(powerupjs.Keys.right) && !powerupjs.Keyboard.down(powerupjs.Keys.left)) {
        this.horizonatalKeysDown = ""; // reset horizontal keys
    }
}

Player.prototype.capMoveSpeed = function(modifier) {
    var modifier = typeof modifier != 'undefined' ? modifier : 1;   // Adjust speed cap in certain scenarios
    if (this.velocity.x < (this.baseVelocity - this.moveSpeed) * modifier) this.velocity.x = (this.baseVelocity - this.moveSpeed) * modifier;
    if (this.velocity.x > (this.baseVelocity + this.moveSpeed) * modifier) this.velocity.x = (this.baseVelocity + this.moveSpeed) * modifier;
}

Player.prototype.handleMoving = function(delta) {
  if (powerupjs.Keyboard.down(powerupjs.Keys.left) && !this.dashing) { // moving left
        var speed = this.moveSpeed; // set speed for moving left
        this.directionFacing = "left"; // set direction facing to left
        if (this.previousWallJumpDir == "right") {
            speed /= 2; // Make it harder to move back to wall
        }
        if (this.velocity.x > 0 && (this.grounded)) // if changing direction on ground, stop first
            this.velocity.x = 0; // stop horizontal movement
        if (this.velocity.x > -speed) // if below max speed, accelerate
            this.velocity.x -= speed * (delta * this.accelerationMultiplier); // accelerate left

        this.mirror = true; // set mirror to true when moving left
        this.detachFromWall(); // detach from wall if necessary


    }
    else if (powerupjs.Keyboard.down(powerupjs.Keys.right) && !this.dashing) { // moving right
        var speed = this.moveSpeed; // set speed for moving right
        this.directionFacing = "right"; // set direction facing to right
        if (this.previousWallJumpDir == "left") {
            speed /= 2; // Make it harder to move back to wall
        }
        if (this.velocity.x < 0 && (this.grounded)) // if changing direction on ground, stop first
            this.velocity.x = 0; // stop horizontal movement
        if (this.velocity.x < speed)   // if below max speed, accelerate
            this.velocity.x += speed * (delta * this.accelerationMultiplier);  // accelerate right

        this.mirror = false; // set mirror to false when moving right
        this.detachFromWall(); // detach from wall if necessary


    }
    else {
        // airDrag : a boolean meant to manage air resistance. If set to false, the player will not stop midair
        // baseVelocity : if outside sources are adding velocity, carry momentum when dismounting
        if ((this.grounded || this.timeAfterWallJump > this.neutralJumpTime) && Math.abs(this.baseVelocity < 1) && this.airDrag && !this.dashing) // after 0.6 seconds, stop velocity
            this.velocity.x = this.baseVelocity; // no horizontal input, stop horizontal movement
        else {
            if (!this.dashing)
                this.velocity.x *= this.airResistance; // apply air drag
        }
        this.detachFromWall(); // detach from wall if necessary
    }

    if (this.grounded) {
        this.airDrag = true; // enable air drag when grounded
        this.previousWallJumpDir = ""; // reset previous wall jump direction
    }
}

Player.prototype.handleJumps = function() { // jump handling
    if (powerupjs.Keyboard.down(this.jumpKey)) { // jump key pressed
        if (this.grounded && this.jumpAvailable) { // jump from ground
            this.jump(); // perform jump
            return;
        }
        if ((this.tileLeft || this.tileRight) && this.jumpAvailable && !this.grounded) { // wall jump
            this.jump(); // perform jump
            
            if (this.tileLeft) { // wall on left side
                this.velocity.x = -this.jumpForce / 2; // push right
                this.previousWallJumpDir = "right"; // remember direction
            }
            if (this.tileRight) { // wall on right side
                this.velocity.x = this.jumpForce / 2; // push left
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
            this.velocity.y /= 3 * this.scale;    // cut jump short when jump key is released
        }
    }
}

Player.prototype.jump = function() {
    this.velocity.y = this.jumpForce; // jump
    this.jumpAvailable = false; // prevent double jump
    this.timeAfterWallJump = 0; // reset wall jump timer
    this.resetJumpVelo = true; // allow jump cut
}

Player.prototype.handleDashes = function() { // dash handling
    if (powerupjs.Keyboard.down(powerupjs.Keys.up)) {
        this.verticalKeysDown = "up"; // up key pressed
        this.keyResetTime = 0; // reset key reset timer
    }
    else if (powerupjs.Keyboard.down(powerupjs.Keys.down)) {
        this.verticalKeysDown = "down"; // down key pressed
        this.keyResetTime = 0; // reset key reset timer
    }
    else {
        if (this.keyResetTime > this._keyBufferTime) { // reset if no key pressed for key buffer time (for input buffering)
            this.resetDirectionKeys(); // reset vertical keys
        }
    }
    if (powerupjs.Keyboard.down(powerupjs.Keys.left)) {
        this.horizonatalKeysDown = "left"; // left key pressed
        this.keyResetTime = 0; // reset key reset timer
    }
    else if (powerupjs.Keyboard.down(powerupjs.Keys.right)) {
        this.horizonatalKeysDown = "right"; // right key pressed
        this.keyResetTime = 0; // reset key reset timer
    }
    else {
        if (this.keyResetTime > this._keyBufferTime) { // reset if no key pressed for 0.25 seconds (for input buffering)
            this.resetDirectionKeys(); // reset horizontal keys
        }
    }


    if (powerupjs.Keyboard.pressed(this.dashKey) && this.ableToDash) { // dash key pressed and able to dash
        this.dash(); // perform dash
        // this.keyResetTime = 0; // reset key reset timer
    }
}

Player.prototype.dash = function() {
    if (this.dashCooldownTimer > this.dashCooldown) { // check dash cooldown
        this.dashCooldownTimer = 0; // reset dash timer
        this.ableToDash = false; // prevent multiple dashes
        this.preDashPos = this.worldPosition.copy(); // store position before dash
        this.velocity = powerupjs.Vector2.zero; // reset velocity
        this.dashing = true; // start dashing
        this.worldPosition.y -= 10; // adjust position
        this.resetJumpVelo = false; // prevent jump cut during dash

        if (this.horizonatalKeysDown == "left") { // dash left
            this.velocity.x = -this.dashSpeed; // set dash velocity
            this.dashDistance = this.maxDashDistance; // set dash distance
            if (this.verticalKeysDown != "" && this.horizonatalKeysDown != "") this.dashDistance = 70; // shorter dash if diagonal
        } else if (this.horizonatalKeysDown == "right") { // dash right
            this.velocity.x = this.dashSpeed; // set dash velocity
            this.dashDistance = this.maxDashDistance; // set dash distance
            if (this.verticalKeysDown != "" && this.horizonatalKeysDown != "") this.dashDistance = 70; // shorter dash if diagonal
        }
        if (this.verticalKeysDown == "down") { // dash down
            this.velocity.y = this.dashSpeed; // set dash velocity
            this.dashDistance = this.maxDashDistance; // set dash distance
            if (this.verticalKeysDown != "" && this.horizonatalKeysDown != "") this.dashDistance = 70; // shorter dash if diagonal
        } else if (this.verticalKeysDown == "up") { // dash up
            this.velocity.y = -this.dashSpeed; // set dash velocity
            this.dashDistance = this.maxDashDistance; // set dash distance
            if (this.verticalKeysDown != "" && this.horizonatalKeysDown != "") this.dashDistance = 70; // shorter dash if diagonal
        }

        if (this.verticalKeysDown == "" && this.horizonatalKeysDown == "") {

            if (this.directionFacing == "left") this.velocity.x = -this.dashSpeed; // set dash velocity
            else if (this.directionFacing == "right") this.velocity.x = this.dashSpeed; // set dash velocity
        }
    }
}

Player.prototype.handleInput = function (delta) {
    powerupjs.AnimatedGameObject.prototype.handleInput.call(this, delta);
    this.timeAfterWallJump += delta; // wall jump timer
    this.dashCooldownTimer += delta; // dash cooldown timer
    this.keyResetTime += delta; // key reset timer

    // CAP SPEED ON GROUND
    if (!this.dashing && this.grounded) this.capMoveSpeed(); // cap speed on ground

    this.handleMoving(delta); // handle movement
    this.handleJumps(); // handle jumps
    this.handleDashes(); // handle dashes

   
}

Player.prototype.draw = function () {
    powerupjs.AnimatedGameObject.prototype.draw.call(this);
    if (powerupjs.Keyboard.down(powerupjs.Keys.P)) { // draw hitboxes for debugging
        this.hitbox.draw("red"); // draw hitbox for debugging
        this.circleHitbox.draw("red"); // draw circle hitbox for debugging
        this.stableBox.draw("blue"); // draw stable box for debugging
    }

}
