"use strict";

var powerupjs = (function (powerupjs) {

    function Camera() {
        this.position = new powerupjs.Vector2(0, 0);
        this.velocity = new powerupjs.Vector2(0, 0);
        this.viewWidth = 0;
        this.viewHeight = 0;
    }

    Camera.prototype.initialize = function () {
        this.viewWidth = powerupjs.Game.size.x;
        this.viewHeight = powerupjs.Game.size.y;
        // this.position = new powerupjs.Vector2(this.viewWidth / -2, this.viewHeight / -2);
                this.smoothingFactor = WorldSettings.cameraSmoothingFactor;

    }

    Camera.prototype.update = function (delta) {
        this.position = this.position.add(this.velocity.multiply(delta)); // update camera position based on velocity
    }

    Camera.prototype.manageBoundaries = function(bounds) {
        var camBounds = new powerupjs.Rectangle(
            bounds.x * WorldSettings.currentLevel.room.scale,
            bounds.y * WorldSettings.currentLevel.room.scale,
            bounds.width * WorldSettings.currentLevel.room.scale,
            bounds.height * WorldSettings.currentLevel.room.scale,

        )
        if (this.position.x < camBounds.x) this.position.x = camBounds.x;
        if (this.position.y < camBounds.y) this.position.y = camBounds.y;
        if (this.position.x + this.viewWidth > camBounds.x + camBounds.width) this.position.x = camBounds.x + camBounds.width - this.viewWidth;
        if (this.position.y + this.viewHeight > camBounds.y + camBounds.height) this.position.y = camBounds.y + camBounds.height - this.viewHeight;

        this.applyBarrierTiles();

        // Re-clamp after barrier resolution.
        if (this.position.x < camBounds.x) this.position.x = camBounds.x;
        if (this.position.y < camBounds.y) this.position.y = camBounds.y;
        if (this.position.x + this.viewWidth > camBounds.x + camBounds.width) this.position.x = camBounds.x + camBounds.width - this.viewWidth;
        if (this.position.y + this.viewHeight > camBounds.y + camBounds.height) this.position.y = camBounds.y + camBounds.height - this.viewHeight;
    }

    Camera.prototype.applyBarrierTiles = function() {
        if (WorldSettings.currentState !== "playing") return;
        if (!WorldSettings.currentLevel || !WorldSettings.currentLevel.room) return;

        var room = WorldSettings.currentLevel.room;
        if (!room.tileFields || room.tileFields.length === 0) return;

        var cameraRect = new powerupjs.Rectangle(this.position.x, this.position.y, this.viewWidth, this.viewHeight);
        var escapePadding = 1;

        var getBarrierFacing = function(tile) {
            var quarterTurn = Math.PI / 2;
            var rawRotation = (tile && typeof tile.rotation === "number") ? tile.rotation : 0;
            var normalized = ((rawRotation % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
            var snapped = Math.round(normalized / quarterTurn) % 4;

            // 0=up, 1=right, 2=down, 3=left
            if (snapped === 1) return "right";
            if (snapped === 2) return "down";
            if (snapped === 3) return "left";
            return "up";
        };

        for (var i = 0; i < room.tileFields.length; i++) {
            var field = room.tileFields.at(i);
            if (!field) continue;

            for (var t = 0; t < field.length; t++) {
                var tile = field.at(t);
                if (!tile || !tile.cameraBarrier || !tile.hitbox) continue;
                if (typeof tile.hitbox.width !== "number" || typeof tile.hitbox.height !== "number") continue;
                if (!cameraRect.intersects(tile.hitbox)) continue;

                var facing = getBarrierFacing(tile);
                if (facing === "right") {
                    this.position.x += (tile.hitbox.right - cameraRect.left) + escapePadding;
                }
                else if (facing === "left") {
                    this.position.x -= (cameraRect.right - tile.hitbox.left) + escapePadding;
                }
                else if (facing === "down") {
                    this.position.y += (tile.hitbox.bottom - cameraRect.top) + escapePadding;
                }
                else {
                    this.position.y -= (cameraRect.bottom - tile.hitbox.top) + escapePadding;
                }

                cameraRect.x = this.position.x;
                cameraRect.y = this.position.y;
            }
        }
    }



    Object.defineProperty(Camera.prototype, "center", {
        get: function () {
            return new powerupjs.Vector2(this.position.x + (this.viewWidth / 2),  // center of camera
                this.position.y + (this.viewHeight / 2));
        }
    })
    powerupjs.Camera = new Camera();
    return powerupjs;

})(powerupjs || {});   
