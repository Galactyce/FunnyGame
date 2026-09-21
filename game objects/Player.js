// Creates the player object and initializes movement and collision state.
function Player(layer, id) {
    CharacterController.call(this, layer, id);
    this.spawnPosition = new powerupjs.Vector2(0, 0);
    this.circleHitbox = new powerupjs.Circle();
    this.stableBox = new powerupjs.Rectangle(0, 0, 1, 1);
    this.weapon = typeof Weapon !== "undefined" ? new Weapon() : null;
    this.loadAnimation(sprites.player["idle"], "idle", true, 0.05);
    this.loadAnimation(sprites.player["run"], "run", true, 0.05);
    this.loadAnimation(sprites.player["jump"], "jump", true, 0.2);
    this.loadAnimation(sprites.player["fall"], "fall", true, 0.2);
    this.playAnimation("idle");
    this.initialize();
}

Player.prototype = Object.create(CharacterController.prototype);
Player.prototype.constructor = Player;



Player.prototype.adjustHitbox = function () {
    powerupjs.PhysicsGameObject.prototype.adjustHitbox.call(this);
    this.hitbox = new powerupjs.Rectangle(
        this.boundingBox.x + this.width / 16,
        this.boundingBox.y + this.height / 16,
        this.boundingBox.width - this.width / 8,
        this.boundingBox.height - this.height / 16
    );
    this.circleHitbox = new powerupjs.Circle(this.position.x, this.position.y, this.hitbox.width / 2);
    this.stableBox = new powerupjs.Rectangle(this.hitbox.x + 0.5, this.hitbox.y, this.hitbox.width - 1, this.hitbox.height + 1);
};

Player.prototype.update = function (delta) {
    CharacterController.prototype.update.call(this, delta);
    this.handleCameraPos(delta);
    this.manageWeapon(delta);
    if (this.position.y > WorldSettings.mapBottom) {
        this.die();
    }
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

Player.prototype.handleMoving = function(delta) {
    if (!powerupjs.Keyboard || !powerupjs.Keyboard.down || !powerupjs.Keys) return;

    var keyLeft = powerupjs.Keyboard.down(powerupjs.Keys.left) || powerupjs.Keyboard.down(powerupjs.Keys.A);
    var keyRight = powerupjs.Keyboard.down(powerupjs.Keys.right) || powerupjs.Keyboard.down(powerupjs.Keys.D);

    this.tileLeft = this.hasTileToLeft();
    this.tileRight = this.hasTileToRight();

    if (keyLeft) {
        this.directionFacing = "left";
        this.move(-1, delta);
    }
    else if (keyRight) {
        this.directionFacing = "right";
        this.move(1, delta);
    }
    else {
        this.stopMoving();
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
            this.wallJump(this.tileLeft ? "left" : "right");
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