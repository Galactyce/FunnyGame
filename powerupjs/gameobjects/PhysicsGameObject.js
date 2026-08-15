"use strict";

var powerupjs = (function (powerupjs) {

    function PhysicsGameObject(layer, id) {
        powerupjs.AnimatedGameObject.call(this, layer, id);

        this.currentLevelIndex;
        this.previousYPosition;
        this.tileLeft = false;
        this.tileRight = false;
        this.previousWallJumpDir = "";
        this.jumpAvailable = true;
        this.airDrag = true;
        this.timeAfterWallJump = 0;
        this.directionFacing = "right";
        this.detaching = false;
        this.detachTime = 0;
        this.detachBufferTime = 0.2;
        this.accelerationMultiplier = 10;
        this.stableBox;
        this.resetJumpVelo = false;
        this.neutralJumpTime = 0.4;
        this.baseVelocity = 0;
        this.circleHitbox = new powerupjs.Circle();
        this.collidingTiles = new powerupjs.GameObjectList();
        this.jumpKey = (powerupjs.Keys && powerupjs.Keys.C) || 67;
        this.moveSpeed = 225;
        this.jumpForce = -460;
        this.airResistance = 0.65;
        this.wallJumpForce = 300;
        this.initialize();
    }

    PhysicsGameObject.prototype = Object.create(powerupjs.AnimatedGameObject.prototype);

    PhysicsGameObject.prototype.initialize = function () {
        this.detachBufferTime = 0.2;
        this.accelerationMultiplier = 10;
        this.neutralJumpTime = 0.4;
        this.airResistance = 0.65;
        this.wallJumpForce = 300;
    };

    PhysicsGameObject.prototype.getCollisionBounds = function(tile) {
        if (tile.hitbox.radius != null) {
            this.circleHitbox.draw();
            return this.circleHitbox;
        }

        return new powerupjs.Rectangle(this.hitbox.x, this.hitbox.y, this.hitbox.width, this.hitbox.height);
    };

    PhysicsGameObject.prototype.resolveTileCollision = function(tile, tileBounds, boundingBox) {
        var depth = boundingBox.calculateIntersectionDepth(tileBounds);

        if (this.resolveHorizontalTileCollision(depth, tileBounds)) {
            boundingBox = this.getCollisionBounds(tile);
            boundingBox.height += 0.5;
            depth = boundingBox.calculateIntersectionDepth(tileBounds);
        }

        this.resolveVerticalTileCollision(tile, tileBounds, boundingBox, depth);
    };

    PhysicsGameObject.prototype.resolveHorizontalTileCollision = function(depth, tileBounds) {
        if (Math.abs(depth.x) >= Math.abs(depth.y)) return false;

        this.position.x += depth.x * 1.1;
        this.adjustHitbox();

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
    };

    PhysicsGameObject.prototype.resolveVerticalTileCollision = function(tile, tileBounds, boundingBox, depth) {
        if (!boundingBox.intersects(tileBounds)) return;

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
        else if (hitTileFromBelow) {
            if (this.velocity.y < 0) this.velocity.y *= -0.1;
            this.capMoveSpeed(1.5);
            this.jumpAvailable = false;
        }

        this.position.y += (depth.y * 1.1);
        this.adjustHitbox();
        this.detachFromWall();
        return false;
    };

    PhysicsGameObject.prototype.isStandingOnTile = function(tileBounds) {
        var footSensor = new powerupjs.Rectangle(
            this.hitbox.x,
            this.hitbox.bottom - 2,
            this.hitbox.width,
            4
        );

        return this.velocity.y >= 0 &&
            tileBounds.intersects(footSensor) &&
            this.hitbox.bottom <= tileBounds.bottom + 4;
    };

    PhysicsGameObject.prototype.hasTileToSide = function(side) {
        if (!this.hitbox || !WorldSettings.currentLevel || !WorldSettings.currentLevel.room || !WorldSettings.currentLevel.room.tileFields) return false;

        var sideDistance = 8;
        var wallSensor = new powerupjs.Rectangle(
            side < 0 ? this.hitbox.x - sideDistance : this.hitbox.right - 2,
            this.hitbox.y + 4,
            sideDistance,
            Math.max(8, this.hitbox.height - 8)
        );

        for (var i = 0; i < WorldSettings.currentLevel.room.tileFields.length; i++) {
            var field = WorldSettings.currentLevel.room.tileFields[i];
            if (!field) continue;

            for (var l = 0; l < field.length; l++) {
                var tile = field.at(l);
                if (!tile || !tile.hitbox || tile.hitboxType == "none" || tile.hitboxType == "void") continue;
                if (tile.hitbox.intersects(wallSensor)) {
                    return true;
                }
            }
        }

        return false;
    };

    PhysicsGameObject.prototype.hasTileToLeft = function() {
        return this.hasTileToSide(-1);
    };

    PhysicsGameObject.prototype.hasTileToRight = function() {
        return this.hasTileToSide(1);
    };

    PhysicsGameObject.prototype.update = function (delta) {
        powerupjs.AnimatedGameObject.prototype.update.call(this, delta);
        this.origin = this.center;
        this.adjustHitbox();
        this.simulateGravity();
        this.handleCollisions();
        this.handleCameraPos(delta);
        if (this.position.y > WorldSettings.mapBottom) {
            this.die();
        }

        if (!this.airDrag && this.velocity.x == 0) {
            this.airDrag = true;
        }

        this.updateDetachState(delta);
    };

    PhysicsGameObject.prototype.adjustHitbox = function () {
        this.hitbox = new powerupjs.Rectangle(
            this.boundingBox.x + this.width / 16,
            this.boundingBox.y + this.height / 16,
            this.boundingBox.width - this.width / 8,
            this.boundingBox.height - this.height / 16
        );

        this.circleHitbox = new powerupjs.Circle(
            this.position.x, this.position.y, this.hitbox.width / 2
        );

        this.stableBox = new powerupjs.Rectangle(this.hitbox.x + 0.5, this.hitbox.y, this.hitbox.width - 1, this.hitbox.height + 1);
    };

    PhysicsGameObject.prototype.simulateGravity = function () {
        if ((this.tileLeft || this.tileRight) && this.velocity.y > 10 && !this.grounded) {
            this.velocity.y = WorldSettings.wallSlideSpeed * this.scale;
        }
        else {
            this.velocity.y += WorldSettings.gravity * this.scale;
        }

        if (this.velocity.y > WorldSettings.terminalVelocity * this.scale) this.velocity.y = WorldSettings.terminalVelocity * this.scale;
    };

    PhysicsGameObject.prototype.handleCollisions = function () {
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
        this.previousYPosition = this.position.y;
        this.updatePhysicsDebugArea();
    };

    PhysicsGameObject.prototype.refreshGroundedState = function() {
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
    };

    PhysicsGameObject.prototype.clearPhysicsDebugHighlights = function() {
        for (var i = 0; i < WorldSettings.currentLevel.room.tileFields.length; i++) {
            var field = WorldSettings.currentLevel.room.tileFields[i];
            for (var l = 0; l < field.length; l++) {
                var tile = field.at(l);
                if (tile == null) continue;
                tile.physicsHighlighted = false;
            }
        }
    };

    PhysicsGameObject.prototype.updatePhysicsDebugArea = function() {
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
    };

    PhysicsGameObject.prototype.die = function () {
        this.position = this.spawnPosition.copy();
        this.velocity = new powerupjs.Vector2(0, 0);
        powerupjs.Camera.position = this.centerOfCamera;
    };

    Object.defineProperty(PhysicsGameObject.prototype, "centerOfCamera", {
        get: function () {
            return new powerupjs.Vector2(this.position.x - powerupjs.Game.size.x / 2,
                this.position.y - powerupjs.Game.size.y / 2
            );
        }
    });

    PhysicsGameObject.prototype.capMoveSpeed = function(modifier) {
        var modifier = typeof modifier != 'undefined' ? modifier : 1;
        if (this.velocity.x < (this.baseVelocity - this.moveSpeed) * modifier) this.velocity.x = (this.baseVelocity - this.moveSpeed) * modifier;
        if (this.velocity.x > (this.baseVelocity + this.moveSpeed) * modifier) this.velocity.x = (this.baseVelocity + this.moveSpeed) * modifier;
    };

    PhysicsGameObject.prototype.jump = function() {
        this.velocity.y = this.jumpForce;
        this.jumpAvailable = false;
        this.timeAfterWallJump = 0;
        this.resetJumpVelo = true;
    };

    Object.defineProperty(PhysicsGameObject.prototype, "isGrounded", {
        get: function() {
            return this.grounded;
        }
    });

    Object.defineProperty(PhysicsGameObject.prototype, "isOnWall", {
        get: function() {
            return this.tileLeft || this.tileRight;
        }
    });

    Object.defineProperty(PhysicsGameObject.prototype, "isWallSliding", {
        get: function() {
            return (this.tileLeft || this.tileRight) && !this.grounded;
        }
    });

    Object.defineProperty(PhysicsGameObject.prototype, "isWallJumping", {
        get: function() {
            return this.previousWallJumpDir != "";
        }
    });

    Object.defineProperty(PhysicsGameObject.prototype, "isFalling", {
        get: function() {
            return this.velocity.y > 0;
        }
    });

    Object.defineProperty(PhysicsGameObject.prototype, "isJumping", {
        get: function() {
            return this.velocity.y < 0;
        }
    });

    Object.defineProperty(PhysicsGameObject.prototype, "isMoving", {
        get: function() {
            return this.velocity.x != 0;
        }
    });

    Object.defineProperty(PhysicsGameObject.prototype, "speed", {
        get: function() {
            return this.velocity.length();
        }
    });

    Object.defineProperty(PhysicsGameObject.prototype, "isDetaching", {
        get: function() {
            return this.detaching;
        }
    });

    Object.defineProperty(PhysicsGameObject.prototype, "isJumpCutting", {
        get: function() {
            return this.resetJumpVelo;
        }
    });

    Object.defineProperty(PhysicsGameObject.prototype, "moveSpeed", {
        get: function() {
            return this._moveSpeed;
        },
        set: function(value) {
            this._moveSpeed = value * this.scale;
        }
    });

    Object.defineProperty(PhysicsGameObject.prototype, "jumpForce", {
        get: function() {
            return this._jumpForce;
        },
        set: function(value) {
            this._jumpForce = value * this.scale;
        }
    });

    Object.defineProperty(PhysicsGameObject.prototype, "acceleration", {
        get: function() {
            return this.accelerationMultiplier;
        },
        set: function(value) {
            this.accelerationMultiplier = value;
        }
    });

    Object.defineProperty(PhysicsGameObject.prototype, "airResistance", {
        get: function() {
            return this._airResistance;
        },
        set: function(value) {
            this._airResistance = value;
        }
    });

    Object.defineProperty(PhysicsGameObject.prototype, "grounded", {
        get: function() {
            return this._grounded;
        },
        set: function(value) {
            this._grounded = value;
        }
    });

    Object.defineProperty(PhysicsGameObject.prototype, "onWall", {
        get: function() {
            if (this.tileLeft)
                return "left";
            else if (this.tileRight)
                return "right";
            else
                return null;
        }
    });

    Object.defineProperty(PhysicsGameObject.prototype, "neutralJumpTime", {
        get: function() {
            return this._neutralJumpTime;
        },
        set: function(value) {
            this._neutralJumpTime = value;
        }
    });

    Object.defineProperty(PhysicsGameObject.prototype, "tileColliding", {
        get: function() {
            return this.collidingTiles;
        }
    });

    Object.defineProperty(PhysicsGameObject.prototype, "baseVelocity", {
        get: function() {
            return this._baseVelocity;
        },
        set: function(value) {
            this._baseVelocity = value;
        }
    });

    powerupjs.PhysicsGameObject = PhysicsGameObject;
    return powerupjs;

})(powerupjs || {});
