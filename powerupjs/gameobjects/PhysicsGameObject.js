"use strict";

var powerupjs = (function (powerupjs) {

    function PhysicsGameObject(layer, id) {
        powerupjs.AnimatedGameObject.call(this, layer, id);
        this.applyGravity = true;
        this.mass = 1;
        this.currentLevelIndex;
        this.previousYPosition;
        this.tileLeft = false;
        this.tileRight = false;
        this.airDrag = true;
        this.directionFacing = "right";
        this.accelerationMultiplier = 10;
        this.baseVelocity = 0;
        this.actualVelocity = powerupjs.Vector2.zero;
        this.hitbox = new powerupjs.Rectangle(0, 0, 1, 1);
        this.circleHitbox = null;
        this.stableBox = null;
        this.collidingTiles = new powerupjs.GameObjectList();
        this.useGravity = true;
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

    PhysicsGameObject.prototype.getCollisionBounds = function() {
        return this.hitbox;
    };

    function roundedContact(bounds, tileBounds, padding) {
        padding = padding || 0;
        if (bounds.radius != null) {
            return new powerupjs.Circle(bounds.x, bounds.y, bounds.radius + padding).getContact(tileBounds);
        }
        var contact = new powerupjs.Circle(
            tileBounds.x, tileBounds.y, tileBounds.radius + padding
        ).getContact(bounds);
        if (contact) contact.normal.multiplyWith(-1);
        return contact;
    }

    PhysicsGameObject.prototype.resolveRoundedTileCollision = function(tileBounds, bounds) {
        var contact = roundedContact(bounds, tileBounds);
        if (!contact || contact.depth <= 0) return;
        this.position.addTo(contact.normal.multiply(contact.depth));
        var inwardSpeed = this.velocity.x * contact.normal.x + this.velocity.y * contact.normal.y;
        if (inwardSpeed < 0) this.velocity.subtractFrom(contact.normal.multiply(inwardSpeed));
        if (contact.normal.x > 0.5) this.tileLeft = true;
        if (contact.normal.x < -0.5) this.tileRight = true;
        this.adjustHitbox();
        return contact;
    };

    PhysicsGameObject.prototype.resolveTileCollision = function(tile, tileBounds, boundingBox) {
        if (tileBounds.radius != null || boundingBox.radius != null) {
            this.resolveRoundedTileCollision(tileBounds, boundingBox);
            return;
        }
        var depth = boundingBox.calculateIntersectionDepth(tileBounds);
        var previousBounds = this.previousCollisionBounds;
        var enteredFromSide = previousBounds &&
            (previousBounds.right <= tileBounds.left + 0.001 ||
            previousBounds.left >= tileBounds.right - 0.001);
        if (enteredFromSide || Math.abs(depth.x) < Math.abs(depth.y)) {
            this.resolveHorizontalTileCollision(depth, tileBounds);
            return;
        }
        this.resolveVerticalTileCollision(tile, tileBounds, boundingBox, depth);
    };

    PhysicsGameObject.prototype.resolveHorizontalTileCollision = function(depth, tileBounds) {
        this.position.x += depth.x;
        this.adjustHitbox();

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
            this.position.y += depth.y;
            this.adjustHitbox();
            return true;
        }
        else if (hitTileFromBelow) {
            if (this.velocity.y < 0) this.velocity.y *= -0.1;
            this.capMoveSpeed(1.5);
        }

        this.position.y += depth.y;
        this.adjustHitbox();
        return false;
    };

    PhysicsGameObject.prototype.isStandingOnTile = function(tileBounds) {
        if (this.hitbox.radius != null || tileBounds.radius != null) {
            var contact = roundedContact(this.hitbox, tileBounds, 2);
            return contact !== null && contact.normal.y < -0.5 &&
                this.velocity.x * contact.normal.x + this.velocity.y * contact.normal.y <= 0.001;
        }
        var footSensor = new powerupjs.Rectangle(
            this.hitbox.x,
            this.hitbox.bottom - 2,
            this.hitbox.width,
            4
        );

        return this.velocity.y >= 0 &&
            this.hitbox.right > tileBounds.left + 0.001 &&
            this.hitbox.left < tileBounds.right - 0.001 &&
            tileBounds.intersects(footSensor) &&
            Math.abs(this.hitbox.bottom - tileBounds.top) <= 2;
    };

    PhysicsGameObject.prototype.hasTileToSide = function(side) {
        if (!this.hitbox || !WorldSettings.currentLevel || !WorldSettings.currentLevel.room || !WorldSettings.currentLevel.room.tileFields) return false;

        var sideDistance = 8;
        var wallSensor = new powerupjs.Rectangle(
            side < 0 ? this.hitbox.left - sideDistance : this.hitbox.right - 2,
            this.hitbox.top + 4,
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

    function rectangleRayFraction(start, direction, bounds) {
        var enter = 0;
        var exit = 1;
        var axes = [
            [start.x, direction.x, bounds.left, bounds.right],
            [start.y, direction.y, bounds.top, bounds.bottom]
        ];
        for (var i = 0; i < axes.length; i++) {
            var axis = axes[i];
            if (axis[1] === 0) {
                if (axis[0] < axis[2] || axis[0] > axis[3]) return null;
                continue;
            }
            var near = (axis[2] - axis[0]) / axis[1];
            var far = (axis[3] - axis[0]) / axis[1];
            enter = Math.max(enter, Math.min(near, far));
            exit = Math.min(exit, Math.max(near, far));
            if (enter > exit) return null;
        }
        return enter;
    }

    function circleRayFraction(start, direction, bounds) {
        var x = start.x - bounds.x;
        var y = start.y - bounds.y;
        var c = x * x + y * y - bounds.radius * bounds.radius;
        if (c <= 0) return 0;
        var a = direction.x * direction.x + direction.y * direction.y;
        if (a === 0) return null;
        var b = x * direction.x + y * direction.y;
        var discriminant = b * b - a * c;
        if (discriminant < 0) return null;
        var fraction = (-b - Math.sqrt(discriminant)) / a;
        return fraction >= 0 && fraction <= 1 ? fraction : null;
    }

    // Cast a finite segment in the same room coordinates used by tile hitboxes.
    PhysicsGameObject.prototype.raycast = function(target, start) {
        start = typeof start === "undefined" ? this.position : start;
        if (!start || !target ||
            typeof start.x !== "number" || !isFinite(start.x) ||
            typeof start.y !== "number" || !isFinite(start.y) ||
            typeof target.x !== "number" || !isFinite(target.x) ||
            typeof target.y !== "number" || !isFinite(target.y)) {
            throw new TypeError("raycast requires finite start and target coordinates.");
        }   // Validate start and target coordinates
        if (typeof WorldSettings === "undefined" || !WorldSettings.currentLevel ||
            !WorldSettings.currentLevel.room || !WorldSettings.currentLevel.room.tileFields) {
            throw new Error("raycast requires a current room with tileFields.");
        }   // Validate the presence of a current room with tileFields

        var direction = new powerupjs.Vector2(target.x - start.x, target.y - start.y);
        var fields = WorldSettings.currentLevel.room.tileFields;
        var nearest = null;
        for (var i = 0; i < fields.length; i++) {
            var field = fields.at(i);
            if (!field) continue;
            for (var j = 0; j < field.length; j++) {
                var tile = field.at(j);
                if (!tile || !tile.hitbox || tile.hitboxType === "none" ||
                    tile.hitboxType === "void") continue;
                var bounds = tile.hitbox;
                var fraction = bounds.radius != null
                    ? circleRayFraction(start, direction, bounds)
                    : rectangleRayFraction(start, direction, bounds);
                if (fraction !== null && (nearest === null || fraction < nearest.fraction)) { // Update nearest intersection if this one is closer
                    nearest = {
                        tile: tile,
                        point: new powerupjs.Vector2(
                            start.x + direction.x * fraction,
                            start.y + direction.y * fraction
                        ),
                        distance: direction.length * fraction,
                        fraction: fraction
                    };
                }
            }
        }
        return nearest;
    };

    PhysicsGameObject.prototype.calculateActualVelocity = function(previousPosition, delta) {
        if (!previousPosition ||
            typeof previousPosition.x !== "number" || !isFinite(previousPosition.x) ||
            typeof previousPosition.y !== "number" || !isFinite(previousPosition.y)) {
            throw new TypeError("calculateActualVelocity requires finite previous position coordinates.");
        }
        if (typeof delta !== "number" || !isFinite(delta) || delta < 0) {
            throw new RangeError("calculateActualVelocity requires a finite, non-negative delta in seconds.");
        }
        return delta === 0 ? powerupjs.Vector2.zero : this.position.subtract(previousPosition).divide(delta);
    };

    PhysicsGameObject.prototype.update = function (delta) {
        var previousPosition = this.position.copy();
        this.updateAnimation(delta);
        this.origin = this.center;
        this.adjustHitbox();
        this.previousCollisionBounds = new powerupjs.Rectangle(
            this.hitbox.left, this.hitbox.top, this.hitbox.width, this.hitbox.height
        );
        this.position.addTo(this.velocity.multiply(delta));
        this.adjustHitbox();
        this.simulateGravity();
        this.handleCollisions();
        this.actualVelocity = this.calculateActualVelocity(previousPosition, delta);
        this.previousCollisionBounds = null;
        if (!this.airDrag && this.velocity.x == 0) {
            this.airDrag = true;
        }

    };

    PhysicsGameObject.prototype.adjustHitbox = function (bounds) {
        if (!bounds) {
            bounds = this.boundingBox && typeof this.width !== 'undefined' && typeof this.height !== 'undefined'
                ? this.boundingBox
                : new powerupjs.Rectangle(this.position.x, this.position.y, 1, 1);
        }
        this.hitbox = this.createHitbox(bounds);
        this.circleHitbox = new powerupjs.Circle(
            bounds.center.x, bounds.center.y, Math.max(bounds.width, bounds.height) / 2
        );
    };

    PhysicsGameObject.prototype.simulateGravity = function () {
        if (!this.applyGravity) return;
        if (!this.useGravity) return;

        var gravity = WorldSettings.gravityDefault;
        if (typeof gravity !== "number" || !isFinite(gravity)) gravity = 0;

        this.velocity.y += gravity * this.scale;

        var terminalVelocity = WorldSettings.terminalVelocity;
        if (typeof terminalVelocity !== "number" || !isFinite(terminalVelocity)) {
            terminalVelocity = 530;
        }
        terminalVelocity *= this.scale;
        if (this.velocity.y > terminalVelocity) this.velocity.y = terminalVelocity;
    };

    PhysicsGameObject.prototype.handleCollisions = function () {
        this.clearPhysicsDebugHighlights();
        this.debugCollisionTiles = [];
        this.grounded = false;

        this.checkTileCollisions();
        this.refreshGroundedState();
        this.previousYPosition = this.position.y;
        this.updatePhysicsDebugArea();
    };

    PhysicsGameObject.prototype.checkTileCollisions = function () {
        for (var i = 0; i < WorldSettings.currentLevel.room.tileFields.length; i++) {
            var field = WorldSettings.currentLevel.room.tileFields.at(i);

            for (var l = 0; l < field.length; l++) {
                var tile = field.at(l);
                if (tile == null || tile.hitboxType == "none") continue;

                var tileBounds = tile.hitbox;
                var boundingBox = this.getCollisionBounds(tile);

                if (!tileBounds.intersects(boundingBox) || tile.hitboxType == "void") {
                    this.collidingTiles.remove(tile);
                    continue;
                }
                // A shared edge is contact, not penetration into a neighboring tile.
                if (tileBounds.radius == null && boundingBox.radius == null &&
                    (boundingBox.right <= tileBounds.left + 0.001 ||
                    boundingBox.left >= tileBounds.right - 0.001 ||
                    boundingBox.bottom <= tileBounds.top + 0.001 ||
                    boundingBox.top >= tileBounds.bottom - 0.001)) continue;

                tile.physicsHighlighted = WorldSettings.debugMode;
                this.collidingTiles.add(tile);
                var firstContact = this.debugCollisionTiles.indexOf(tile) === -1;
                if (firstContact) this.debugCollisionTiles.push(tile);

                if (tile.hitboxType == "hurt") {
                    if (firstContact) this.hitHurtbox(tile.damage);
                    if (tileBounds.radius != null) continue;
                }

                this.resolveTileCollision(tile, tileBounds, boundingBox);
            }
        }
    };

    PhysicsGameObject.prototype.refreshGroundedState = function() {
        for (var i = 0; i < WorldSettings.currentLevel.room.tileFields.length; i++) {
            var field = WorldSettings.currentLevel.room.tileFields.at(i);
            for (var l = 0; l < field.length; l++) {
                var tile = field.at(l);
                if (tile == null ||
                    (tile.hitboxType != "solid" && tile.hitboxType != "hurt") ||
                    (tile.hitboxType == "hurt" && tile.hitbox.radius != null)) continue;
                if (this.isStandingOnTile(tile.hitbox)) {
                    this.grounded = true;
                    if (this.hitbox.radius != null || tile.hitbox.radius != null) {
                        var contact = roundedContact(this.hitbox, tile.hitbox, 2);
                        var inwardSpeed = this.velocity.x * contact.normal.x + this.velocity.y * contact.normal.y;
                        if (inwardSpeed < 0) this.velocity.subtractFrom(contact.normal.multiply(inwardSpeed));
                    } else {
                        this.velocity.y = 0;
                    }
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

    PhysicsGameObject.prototype.hitHurtbox = function() {
        // Implement the logic for when the object hits a hurtbox
        // This could involve taking damage, playing an animation, etc.
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

    Object.defineProperty(PhysicsGameObject.prototype, "tileHit", {
        get: function() {
            if (this.hasTileToRight()) return 1;
            else if (this.hasTileToLeft()) return -1;
            else return 0;
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

    Object.defineProperty(PhysicsGameObject.prototype, "tileCcoolliding", {
        get: function() {
            return this.collidingTiles.length > 0;
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
