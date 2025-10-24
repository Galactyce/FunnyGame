function Player(layer, id) {
    powerupjs.AnimatedGameObject.call(this, layer, id);
    this.currentLevelIndex;
    this.previousYPosition;
    this.jumpKey = powerupjs.Keys.C;
    this.dashKey = powerupjs.Keys.X;
    this.moveSpeed = 55;
    this.jumpForce = -155;
    this.spawnPosition;
    this.circleHitbox = new powerupjs.Circle();
    this.tileLeft = false;
    this.tileRight = false;
    this.previousWallJumpDir = ""
    this.jumpAvailable = true;
    this.airDrag = true;
    this.timeAfterWallJump = 0;
    this.timeAfterDashing = 0;
    this.dashSpeed = 500;
    this.preDashPos = powerupjs.Vector2.zero;
    this.dashDistance = 130
    this.dashing = false;
    this.directionFacing = "right";
    this.ableToDash = true;
}

Player.prototype = Object.create(powerupjs.AnimatedGameObject.prototype);

Player.prototype.update = function (delta) {
    powerupjs.AnimatedGameObject.prototype.update.call(this, delta);
    this.origin = this.center; // set origin to center for mirroring
    this.adjustHitbox(); // adjust hitbox to match position

    if (!this.dashing)
    this.simulateGravity(); // apply gravity
    this.handleCollisions(); // handle collisions before moving
    var V = this.centerOfCamera.subtract(powerupjs.Camera.position); // vector from camera to player
    V = V.multiply(1 / powerupjs.Camera.smoothingFactor); // scale by smoothing factor
    powerupjs.Camera.velocity = V; // set camera velocity
    if (powerupjs.Camera.velocity.x > this.moveSpeed) powerupjs.Camera.velocity.x = this.moveSpeed; // cap camera velocity
    if (powerupjs.Camera.velocity.x < -this.moveSpeed) powerupjs.Camera.velocity.x = -this.moveSpeed;
    if (powerupjs.Camera.velocity.y > this.moveSpeed) powerupjs.Camera.velocity.y = this.moveSpeed;
    if (powerupjs.Camera.velocity.y < -this.moveSpeed) powerupjs.Camera.velocity.y = -this.moveSpeed;
    powerupjs.Camera.update(delta); // update camera position
    powerupjs.Camera.manageBoundaries(WorldSettings.currentLevel.cameraBounds);
    if (this.position.y > WorldSettings.currentLevel.cameraBounds.bottom) {
        this.die();
    }

    if (!this.airDrag && this.velocity.x == 0) {
        this.airDrag = true; // reset air drag when stopped
    }

    console.log(Math.abs(this.preDashPos.y - this.worldPosition.y))
    if (Math.abs(this.preDashPos.x - this.worldPosition.x) > this.dashDistance ||
        Math.abs(this.preDashPos.y - this.worldPosition.y) > this.dashDistance ||
        this.timeAfterDashing > 1) {
        this.dashing = false
        if (this.velocity.y > WorldSettings.terminalVelocity) this.velocity.y = WorldSettings.terminalVelocity;
        if (this.velocity.y < -WorldSettings.terminalVelocity * 10) this.velocity.y = -WorldSettings.terminalVelocity * 10;
        this.airDrag = true;
    }


    if (Math.abs(this.velocity.x) > 1) {
        this.tileLeft = false;
        this.tileRight = false;
    }
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

}

Player.prototype.simulateGravity = function () {
    if ((this.tileLeft || this.tileRight) && this.velocity.y > 0) {
        this.velocity.y = WorldSettings.wallSlideSpeed;
    }
    else {
        this.velocity.y += WorldSettings.gravity;
    }
   

    

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

            var stableBox = new powerupjs.Rectangle(this.hitbox.x + 5, this.hitbox.y, this.hitbox.width - 10, this.hitbox.height + 1);
            if (!tileBounds.intersects(boundingBox)) // no collision
                continue;
            if (tile.hitboxType == "hurt") { // hurtful tile
                this.die()
                continue;
            }
            this.dashing = false;
            var depth = boundingBox.calculateIntersectionDepth(tileBounds); // get intersection depth
            if (Math.abs(depth.x) < Math.abs(depth.y)) { // horizontal collision
                    this.position.x += (depth.x * 1.1); // nudge out of collision
                    this.tileLeft = (depth.x > 0);
                    this.tileRight = (depth.x < 0);
                    this.velocity.x = 0; // stop horizontal movement
                    continue
            }
            
            if (this.previousYPosition <= tileBounds.top ) { // if landing on top of tile
                if (!stableBox.intersects(tileBounds)) continue;
                if (this.velocity.y > 0) this.grounded = true;
                this.ableToDash = true;
                this.velocity.y = 0; // stop downward velocity
                this.tileLeft = false;
                this.tileRight = false;
            }
            if (boundingBox.top <= tileBounds.bottom) { // if hitting head on bottom of tile
                this.velocity.y *= -0.1; // small bounce when hitting head
                this.tileLeft = false;
                this.tileRight = false;
               
            }
            if (boundingBox.intersects(tileBounds)) {
                if (!stableBox.intersects(tileBounds)) continue; // prevent stupid clipping to corners in walls
                this.position.y += depth.y; // nudge out of collision
                this.tileLeft = false;
                this.tileRight = false;
            }
            this.adjustHitbox();

        }
        if (this.velocity.y != 0) // if moving vertically, not grounded
            this.grounded = false;

    }
    this.previousYPosition = this.position.y;
}

Player.prototype.die = function () {
    this.position = this.spawnPosition.copy(); // respawn player
    this.velocity = new powerupjs.Vector2(0, 0);
    powerupjs.Camera.position = this.centerOfCamera;
}

Object.defineProperty(Player.prototype, "centerOfCamera", {
    get: function() {
        return new powerupjs.Vector2(this.position.x - powerupjs.Game.size.x / 2, // center camera on player
        this.position.y - powerupjs.Game.size.y / 2
    );
    }
})


Player.prototype.handleInput = function (delta) {
    powerupjs.AnimatedGameObject.prototype.handleInput.call(this, delta);
    this.timeAfterWallJump += delta;
    this.timeAfterDashing += delta;

    if (powerupjs.Keyboard.down(powerupjs.Keys.left)) {
        var speed = this.moveSpeed;
        this.directionFacing = "left"
        if (!this.airDrag && this.previousWallJumpDir == "right") {
            speed = this.moveSpeed / 2.2;
        }
        if (this.velocity.x > 0 && this.grounded) // if changing direction on ground, stop first
            this.velocity.x = 0;
        if (this.velocity.x > -this.moveSpeed) // if below max speed, accelerate
            this.velocity.x -= speed * (delta * 2);
        if (this.velocity.x < -this.moveSpeed && !this.dashing) this.velocity.x = -this.moveSpeed;

        this.mirror = true;
        this.tileRight = false;
        
        
    }
    else if (powerupjs.Keyboard.down(powerupjs.Keys.right)) {
        var speed = this.moveSpeed;
        this.directionFacing = "right"

        if (!this.airDrag && this.previousWallJumpDir == "left") {
            speed = this.moveSpeed / 2.2;
        }
        if (this.velocity.x < 0 && this.grounded) // if changing direction on ground, stop first
            this.velocity.x = 0;
        if (this.velocity.x < speed)   // if below max speed, accelerate
            this.velocity.x += speed * (delta * 2);
        if (this.velocity.x > this.moveSpeed && !this.dashing) this.velocity.x = this.moveSpeed;
        this.mirror = false
        this.tileLeft = false;
        
    }
    else {
         if ((this.grounded || this.airDrag || this.timeAfterWallJump > 0.6) && !this.dashing) // after 0.6 seconds, stop velocity
            this.velocity.x = 0; // no horizontal input, stop horizontal movement
         else {

        }
        this.tileLeft = false;
        this.tileRight = false;
    }
    if (powerupjs.Keyboard.down(this.jumpKey)) {
        if (this.grounded && this.jumpAvailable) {
            this.velocity.y = this.jumpForce; // jump
            this.grounded = false;
            this.jumpAvailable = false;
        }
        if ((this.tileLeft || this.tileRight) && this.velocity.y > 0 && this.jumpAvailable) {
            this.velocity.y = this.jumpForce;
            this.airDrag = false;
            this.jumpAvailable = false;
            this.timeAfterWallJump = 0;
            if (this.tileLeft) {
                this.velocity.x = -this.jumpForce / 1.5;
                this.previousWallJumpDir = "right"
            }
            if (this.tileRight) {
                this.velocity.x = this.jumpForce / 1.5;
                this.previousWallJumpDir = "left"
            }
            this.tileLeft = false;
            this.tileRight = false;
        }
    }
    else {
        this.jumpAvailable = true;
        if (this.velocity.y < 0) {
            this.velocity.y /= 1.06;    // cut jump short when jump key is released
        }
    }

    if (powerupjs.Keyboard.pressed(this.dashKey) && this.ableToDash) {
        if (this.timeAfterDashing > 0.7) {
            this.timeAfterDashing = 0;
            this.ableToDash = false;
            this.preDashPos = this.worldPosition.copy();
            this.velocity = powerupjs.Vector2.zero;
            this.dashing = true;
            var directionPicked = false;
            this.worldPosition.y -= 10;
            var sideToSide = (powerupjs.Keyboard.down(powerupjs.Keys.left) || powerupjs.Keyboard.down(powerupjs.Keys.right))
            if (powerupjs.Keyboard.down(powerupjs.Keys.up)) {
                if (sideToSide) this.velocity.y = -this.dashSpeed * (Math.sqrt(2)/2)
                else
                    this.velocity.y = -this.dashSpeed * 0.8;

                directionPicked = true;
            }
            else if (powerupjs.Keyboard.down(powerupjs.Keys.down)) {
                if (sideToSide) this.velocity.y = this.dashSpeed * (Math.sqrt(2)/2)
                else
                    this.velocity.y = this.dashSpeed;

                directionPicked = true;
            }
            if (powerupjs.Keyboard.down(powerupjs.Keys.left)) {
                if (sideToSide) {
                    this.velocity.x = -this.dashSpeed * (Math.sqrt(2)/2);
                    this.dashDistance = 130 * (Math.sqrt(2)/2);
                }
                else {
                    this.velocity.x = -this.dashSpeed;
                    this.dashDistance = 130;
                }
                directionPicked = true;

            }
            else if (powerupjs.Keyboard.down(powerupjs.Keys.right)) {
                if (sideToSide) {
                    this.velocity.x = this.dashSpeed * (Math.sqrt(2)/2);
                    this.dashDistance = 130 * (Math.sqrt(2)/2);
                }
                else {
                    this.velocity.x = this.dashSpeed;
                    this.dashDistance = 130;
                }
                directionPicked = true;

            }

            if (!directionPicked) {

                if (this.directionFacing == "left") this.velocity.x = -this.dashSpeed;
                else if (this.directionFacing == "right") this.velocity.x = this.dashSpeed;
            }
        }
    }
}

Player.prototype.draw = function () {
    powerupjs.AnimatedGameObject.prototype.draw.call(this);
    if (powerupjs.Keyboard.down(powerupjs.Keys.P)) {
        this.hitbox.draw("red"); // draw hitbox for debugging
        this.circleHitbox.draw("red")
        var stableBox = new powerupjs.Rectangle(this.hitbox.x + 5, this.hitbox.y, this.hitbox.width - 10, this.hitbox.height);
        stableBox.draw("blue")
    }

    
}
