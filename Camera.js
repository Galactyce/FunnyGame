"use strict";

var powerupjs = (function (powerupjs) {

    function Camera() {
        this.position = new powerupjs.Vector2(0, 0);
        

    }

    Camera.prototype.initialize = function() {
        this.viewWidth = powerupjs.Game.size.x;
        this.viewHeight = powerupjs.Game.size.y;
        // this.position = new powerupjs.Vector2(this.viewWidth / -2, this.viewHeight / -2);
    }

    Object.defineProperty(Camera.prototype, "center", {
        get: function() {
            return new powerupjs.Vector2(this.position.x + (this.viewWidth / 2), 
                this.position.y + (this.viewHeight / 2));
        }
    })
    powerupjs.Camera = new Camera();
    return powerupjs;

})(powerupjs || {});   
