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
            bounds.x * WorldSettings.currentLevel.scale,
            bounds.y * WorldSettings.currentLevel.scale,
            bounds.width * WorldSettings.currentLevel.scale,
            bounds.height * WorldSettings.currentLevel.scale,

        )
        if (this.position.x < camBounds.x) this.position.x = camBounds.x;
        if (this.position.y < camBounds.y) this.position.y = camBounds.y;
        if (this.position.x + this.viewWidth > camBounds.x + camBounds.width) this.position.x = camBounds.x + camBounds.width - this.viewWidth;
        if (this.position.y + this.viewHeight > camBounds.y + camBounds.height) this.position.y = camBounds.y + camBounds.height - this.viewHeight;
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
