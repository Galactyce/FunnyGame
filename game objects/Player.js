// Creates the player object and initializes movement and collision state.
function Player(layer, id) {
    powerupjs.PhysicsGameObject.call(this, layer, id);
    this.spawnPosition = new powerupjs.Vector2(0, 0);
    this.weapon = typeof Weapon !== "undefined" ? new Weapon() : null;
    this.loadAnimation(sprites.player["idle"], "idle", true, 0.05);
    this.loadAnimation(sprites.player["run"], "run", true, 0.05);
    this.loadAnimation(sprites.player["jump"], "jump", true, 0.2);
    this.loadAnimation(sprites.player["fall"], "fall", true, 0.2);
    this.playAnimation("idle");
}

Player.prototype = Object.create(powerupjs.PhysicsGameObject.prototype);

Player.prototype.update = function (delta) {
    powerupjs.PhysicsGameObject.prototype.update.call(this, delta);
    this.handleCameraPos(delta);
    this.manageWeapon(delta);
};

Player.prototype.manageWeapon = function(delta) {
    if (this.weapon) {
        var spriteOffsetX = this.weapon.sprite ? this.weapon.sprite.width * 0.55 : 10;
        var spriteOffsetY = this.weapon.sprite ? this.weapon.sprite.height * 0.2 : 0;
        
        this.weapon.mirror = this.mirror;
        this.weapon.position.x = this.position.x + this.origin.x + (this.mirror ? -10 : 10);
        this.weapon.position.y = this.position.y;
        this.weapon.update(delta);
    }
}

Player.prototype.handleCameraPos = function(delta) {
    var V = this.centerOfCamera.subtract(powerupjs.Camera.position);
    if (Math.abs(V.y) < 4 && Math.abs(V.x) < 4) {
        powerupjs.Camera.position = this.centerOfCamera;
        return;
    }

    var strictSmoothing = Math.max(1, powerupjs.Camera.smoothingFactor * 0.6);
    V = V.multiply(1 / strictSmoothing);
    powerupjs.Camera.velocity = V;
    var cameraSpeedCap = this.moveSpeed * 2;
    if (powerupjs.Camera.velocity.x > cameraSpeedCap) powerupjs.Camera.velocity.x = cameraSpeedCap;
    if (powerupjs.Camera.velocity.x < -cameraSpeedCap) powerupjs.Camera.velocity.x = -cameraSpeedCap;
    powerupjs.Camera.update(delta);
    powerupjs.Camera.manageBoundaries(WorldSettings.currentLevel.room.cameraBounds);
};

Object.defineProperty(Player.prototype, "centerOfCamera", {
    get: function () {
        return new powerupjs.Vector2(this.position.x - powerupjs.Game.size.x / 2,
            this.position.y - powerupjs.Game.size.y / 2
        );
    }
});

Player.prototype.updateDetachState = function(delta) {
    if (!this.detaching) return;

    this.detachTime -= delta;
    if (this.detachTime > 0) return;

    this.tileLeft = false;
    this.tileRight = false;
    this.detaching = false;
};

Player.prototype.detachFromWall = function () {
    if (this.detaching) return;
    this.detaching = true;
    this.detachTime = this.detachBufferTime;
};

Player.prototype.handleMoving = function(delta) {
    if (!powerupjs.Keyboard || !powerupjs.Keyboard.down || !powerupjs.Keys) return;

    var keyLeft = powerupjs.Keyboard.down(powerupjs.Keys.left) || powerupjs.Keyboard.down(powerupjs.Keys.A);
    var keyRight = powerupjs.Keyboard.down(powerupjs.Keys.right) || powerupjs.Keyboard.down(powerupjs.Keys.D);

    this.tileLeft = this.hasTileToLeft();
    this.tileRight = this.hasTileToRight();

    if (keyLeft) {
        var speed = this.moveSpeed;
        this.directionFacing = "left";
        if (this.previousWallJumpDir == "right") speed /= 2;
        if (this.velocity.x > 0 && this.grounded) this.velocity.x = 0;
        if (this.velocity.x > -speed) this.velocity.x -= speed * (delta * this.accelerationMultiplier);
        this.mirror = true;
        if (!this.grounded && (this.tileLeft || this.tileRight)) {
            this.detachFromWall();
        }
    }
    else if (keyRight) {
        var speed = this.moveSpeed;
        this.directionFacing = "right";
        if (this.previousWallJumpDir == "left") speed /= 2;
        if (this.velocity.x < 0 && this.grounded) this.velocity.x = 0;
        if (this.velocity.x < speed) this.velocity.x += speed * (delta * this.accelerationMultiplier);
        this.mirror = false;
        if (!this.grounded && (this.tileLeft || this.tileRight)) {
            this.detachFromWall();
        }
    }
    else {
        if ((this.grounded || this.timeAfterWallJump > this.neutralJumpTime) && Math.abs(this.baseVelocity) < 1 && this.airDrag)
            this.velocity.x = this.baseVelocity;
        else
            this.velocity.x *= this.airResistance;
        this.tileLeft = false;
        this.tileRight = false;
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
};

Player.prototype.isJumpPressed = function() {
    if (!powerupjs.Keyboard || !powerupjs.Keyboard.down) return false;

    var jumpKeys = this.jumpKey;
    if (!Array.isArray(jumpKeys)) {
        jumpKeys = [jumpKeys];
    }

    for (var i = 0; i < jumpKeys.length; i++) {
        if (typeof jumpKeys[i] !== 'undefined' && powerupjs.Keyboard.down(jumpKeys[i])) {
            return true;
        }
    }

    return false;
};

Player.prototype.handleJumps = function() {
    if (!powerupjs.Keyboard || !powerupjs.Keyboard.down || typeof this.jumpKey === "undefined") return;

    this.tileLeft = this.hasTileToLeft();
    this.tileRight = this.hasTileToRight();

    if (this.isJumpPressed()) {
        if (this.grounded && this.jumpAvailable) {
            this.jump();
            return;
        }
        if ((this.tileLeft || this.tileRight) && this.jumpAvailable && !this.grounded) {
            this.jump();

            if (this.tileLeft) {
                this.velocity.x = this.wallJumpForce;
                this.previousWallJumpDir = "right";
            }
            if (this.tileRight) {
                this.velocity.x = -this.wallJumpForce;
                this.previousWallJumpDir = "left";
            }
            this.detachFromWall();
        }
    }
    else {
        this.jumpAvailable = true;
        if (!this.resetJumpVelo) return;
        this.resetJumpVelo = false;
        if (this.velocity.y < 0) {
            this.velocity.y /= 3;
        }
    }
};

Player.prototype.handleInput = function (delta) {
    powerupjs.AnimatedGameObject.prototype.handleInput.call(this, delta);
    if (!powerupjs.Keyboard || !powerupjs.Keyboard.down || !powerupjs.Keys) return;

    this.timeAfterWallJump += delta;

    if (powerupjs.Keyboard.pressed && powerupjs.Keyboard.pressed(powerupjs.Keys.P)) {
        WorldSettings.debugMode = !WorldSettings.debugMode;
        if (!WorldSettings.debugMode) {
            this.clearPhysicsDebugHighlights();
            this.debugCollisionTiles = [];
            this.updatePhysicsDebugArea();
        }
    }

    if (powerupjs.Mouse && powerupjs.Mouse.left && powerupjs.Mouse.left.pressed && this.weapon) {
        this.weapon.swing(delta);
    }

    if (this.grounded) this.capMoveSpeed();
    this.handleMoving(delta);
    this.handleJumps();
};

// Draws the player and optional debug hitboxes.
Player.prototype.draw = function () {
    if (this.weapon && this.weapon.swinging) {
        
        this.weapon.draw();
    }
    powerupjs.AnimatedGameObject.prototype.draw.call(this);
    if (powerupjs.Keyboard && powerupjs.Keyboard.down && powerupjs.Keys && powerupjs.Keyboard.down(powerupjs.Keys.P)) {
        this.hitbox.draw("red");
        this.circleHitbox.draw("red");
        this.stableBox.draw("blue");
    }
    
};