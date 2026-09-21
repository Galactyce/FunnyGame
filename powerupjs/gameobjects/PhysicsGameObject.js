"use strict";

var powerupjs = (function (powerupjs) {

    function PhysicsGameObject(layer, id) {
        powerupjs.AnimatedGameObject.call(this, layer, id);
        this.mass = 1;
        this.currentLevelIndex;
        this.previousYPosition;
        this.tileLeft = false;
        this.tileRight = false;
        this.airDrag = true;
        this.directionFacing = "right";
        this.accelerationMultiplier = 10;
        this.baseVelocity = 0;
        this.hitbox = new powerupjs.Rectangle(0, 0, 1, 1);
        this.circleHitbox = null;
        this.stableBox = null;
        this.collidingTiles = new powerupjs.GameObjectList();
        this.initialize();
    }

    PhysicsGameObject.prototype = Object.create(powerupjs.AnimatedGameObject.prototype);

    PhysicsGameObject.prototype.wellFormed = function () {
        return powerupjs.GameObject.prototype.wellFormed.call(this) &&
            typeof this.mass === "number" && isFinite(this.mass) && this.mass > 0;
    };

    PhysicsGameObject.prototype.wellFormedAssertions = function () {
        var valid = this.wellFormed();
        if (typeof console !== "undefined" && typeof console.assert === "function") {
            console.assert(valid, "PhysicsGameObject is not well-formed");
        }
        return valid;
    };

    PhysicsGameObject.prototype.initialize = function () {
        this.accelerationMultiplier = 10;
        this.airResistance = 0.65;
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
            return true;
        }
        else if (hitTileFromBelow) {
            if (this.velocity.y < 0) this.velocity.y *= -0.1;
            this.capMoveSpeed(1.5);
        }

        this.position.y += (depth.y * 1.1);
        this.adjustHitbox();
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
            var field = WorldSettings.currentLevel.room.tileFields.at(i);
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
        if (!this.airDrag && this.velocity.x == 0) {
            this.airDrag = true;
        }

    };

    PhysicsGameObject.prototype.adjustHitbox = function () {
        if (this.boundingBox && typeof this.width !== 'undefined' && typeof this.height !== 'undefined') {
            this.hitbox = new powerupjs.Rectangle(
                this.boundingBox.x,
                this.boundingBox.y,
                this.boundingBox.width,
                this.boundingBox.height
            );
            return;
        }

        this.hitbox = new powerupjs.Rectangle(this.position.x, this.position.y, 1, 1);
    };

    PhysicsGameObject.prototype.simulateGravity = function () {
        this.velocity.y += WorldSettings.gravity * this.scale;

        if (this.velocity.y > WorldSettings.terminalVelocity * this.scale) this.velocity.y = WorldSettings.terminalVelocity * this.scale;
    };

    PhysicsGameObject.prototype.handleCollisions = function () {
        this.clearPhysicsDebugHighlights();
        this.debugCollisionTiles = [];
        this.grounded = false;

        for (var i = 0; i < WorldSettings.currentLevel.room.tileFields.length; i++) {
            var field = WorldSettings.currentLevel.room.tileFields.at(i);

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
            var field = WorldSettings.currentLevel.room.tileFields.at(i);
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
            var field = WorldSettings.currentLevel.room.tileFields.at(i);
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

    PhysicsGameObject.prototype.applyForce = function(force, impulse) {
        var impulse = typeof impulse != 'undefined' ? impulse : false;
        if (impulse) {
            this.velocity.x += force.x / this.mass;
            this.velocity.y += force.y / this.mass;
        } else {
            this.velocity.x += force.x * powerupjs.Game.deltaTime / this.mass;
            this.velocity.y += force.y * powerupjs.Game.deltaTime / this.mass;
        }
    };

    Object.defineProperty(PhysicsGameObject.prototype, "isGrounded", {
        get: function() {
            return this.grounded;
        }
    });

    Object.defineProperty(PhysicsGameObject.prototype, "isFalling", {
        get: function() {
            return this.velocity.y > 0;
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

    Object.defineProperty(PhysicsGameObject.prototype, "moveSpeed", {
        get: function() {
            return this._moveSpeed;
        },
        set: function(value) {
            this._moveSpeed = value * this.scale;
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
