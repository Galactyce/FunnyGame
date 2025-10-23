"use strict";

var powerupjs = (function (powerupjs) {

    function Camera() {
        this.position = new powerupjs.Vector2(0, 0);
        this.velocity = new powerupjs.Vector2(0, 0);
        this.viewWidth = 0;
        this.viewHeight = 0;
        this.smoothingFactor = 2;
    }

    Camera.prototype.initialize = function () {
        this.viewWidth = powerupjs.Game.size.x;
        this.viewHeight = powerupjs.Game.size.y;
        // this.position = new powerupjs.Vector2(this.viewWidth / -2, this.viewHeight / -2);
    }

    Camera.prototype.update = function (delta) {
        this.position = this.position.add(this.velocity.multiply(delta)); // update camera position based on velocity
    }

    Camera.prototype.manageBoundaries = function(bounds) {
        console.log(this.position)
        if (this.position.x < bounds.x) this.position.x = bounds.x;
        if (this.position.y < bounds.y) this.position.y = bounds.y;
        if (this.position.x + this.viewWidth > bounds.right) this.position.x = bounds.right - this.viewWidth;
        if (this.position.y + this.viewHeight > bounds.bottom) this.position.y = bounds.bottom - this.viewHeight;
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
