"use strict";

var powerupjs = (function (powerupjs) {

    // Camera that controls which part of the game world is visible on screen.
    //
    // The camera position is the world-space coordinate of the viewport's
    // top-left corner. Its width and height describe how much of the world is
    // visible, while velocity describes movement applied during each update.
    // The camera is kept inside the active room and can also be pushed away
    // from tiles marked as camera barriers. The exported singleton is shared by
    // rendering, gameplay, and any system that needs the current view center.
    function Camera() {
        this.position = new powerupjs.Vector2(0, 0);
        this.velocity = new powerupjs.Vector2(0, 0);
        this.viewWidth = 0;
        this.viewHeight = 0;
    }

    // Initialize the camera for the current game configuration. The viewport
    // dimensions come from Game.size so camera coordinates match the logical
    // game resolution rather than the browser's scaled canvas dimensions.
    // The smoothing value is loaded here for camera-following code that uses
    // this setting; this class itself moves directly from its velocity.
    Camera.prototype.initialize = function () {
        this.viewWidth = powerupjs.Game.size.x;
        this.viewHeight = powerupjs.Game.size.y;
        // this.position = new powerupjs.Vector2(this.viewWidth / -2, this.viewHeight / -2);
        this.smoothingFactor = WorldSettings.cameraSmoothingFactor;

    }

    // Advance the camera by velocity * delta, where delta is the elapsed time
    // for the update. Position is replaced with the resulting Vector2, then
    // rounded to whole pixels so sprites and tiles do not land on fractional
    // screen coordinates that can produce blurred edges or visible seams.
    Camera.prototype.update = function (delta) {
        this.position = this.position.add(this.velocity.multiply(delta)); // update camera position based on velocity
        this.position.x = Math.round(this.position.x);
        this.position.y = Math.round(this.position.y);
    }

    // Keep the viewport inside the supplied room bounds and resolve collisions
    // with camera barrier tiles. Bounds are expressed in room/tile coordinates,
    // so they are multiplied by the room scale before comparison with the
    // camera's world-space position.
    //
    // The camera is clamped once before barrier handling to establish a valid
    // starting position. Barrier resolution may move it again, so the method
    // repeats the clamp afterward and rounds the final position for rendering.
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
        this.position.x = Math.round(this.position.x);
        this.position.y = Math.round(this.position.y);
    }

    // Resolve camera-only barriers while the game is playing. A rectangle the
    // size of the viewport is tested against every tile field in the active
    // room. Only tiles marked cameraBarrier and carrying a valid hitbox take
    // part in the test; ordinary gameplay tiles are ignored.
    //
    // A barrier's rotation determines the direction in which it blocks the
    // camera: zero points up, PI/2 points right, PI points down, and 3*PI/2
    // points left. When an intersection is found, the camera is moved just
    // beyond the barrier along that axis, and the temporary camera rectangle
    // is updated so multiple barriers can be resolved in the same pass.
    Camera.prototype.applyBarrierTiles = function() {
        if (WorldSettings.currentState !== "playing") return;
        if (!WorldSettings.currentLevel || !WorldSettings.currentLevel.room) return;

        var room = WorldSettings.currentLevel.room;
        if (!room.tileFields || room.tileFields.length === 0) return;

        // var cameraRect = new powerupjs.Rectangle(this.position.x, this.position.y, this.viewWidth, this.viewHeight);
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
                if (!this.viewportRect.intersects(tile.hitbox)) continue;

                var facing = getBarrierFacing(tile);
                if (facing === "right") {
                    this.position.x += (tile.hitbox.right - this.viewportRect.left) + escapePadding;
                }
                else if (facing === "left") {
                    this.position.x -= (this.viewportRect.right - tile.hitbox.left) + escapePadding;
                }
                else if (facing === "down") {
                    this.position.y += (tile.hitbox.bottom - this.viewportRect.top) + escapePadding;
                }
                else {
                    this.position.y -= (this.viewportRect.bottom - tile.hitbox.top) + escapePadding;
                }
            }
        }
    }



    // Return the world-space center of the visible viewport. This is derived
    // from the top-left position and current view dimensions rather than being
    // stored separately, so it always remains synchronized with the camera.
    Object.defineProperty(Camera.prototype, "center", {
        get: function () {
            return new powerupjs.Vector2(this.position.x + (this.viewWidth / 2),  // center of camera
                this.position.y + (this.viewHeight / 2));
        }
    })

    Object.defineProperty(Camera.prototype, "viewportRect", {
        get: function () { return new powerupjs.Rectangle(this.position.x, this.position.y,
            this.viewWidth, this.viewHeight);
        }
    })

    powerupjs.Camera = new Camera();
    return powerupjs;

})(powerupjs || {});   
