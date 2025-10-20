"use strict";

var powerupjs = (function (powerupjs) {

    function Button(sprite, layer, id) {
        sprite = typeof sprite !== 'undefined' ? sprite : sprites.button_default;
        powerupjs.SpriteGameObject.call(this, sprite, layer, id);

        this.pressed = false;
        this.down = false;
    }

    Button.prototype = Object.create(powerupjs.SpriteGameObject.prototype);

    Button.prototype.handleInput = function (delta) {
        var boundingBox = this.boundingBox;
        this.pressed = this.visible && (powerupjs.Touch.containsTouchPress(boundingBox) ||
            powerupjs.Mouse.containsMousePress(boundingBox));
        this.down = this.visible && (powerupjs.Touch.containsTouch(boundingBox) ||
            powerupjs.Mouse.containsMouseDown(boundingBox));
    };

    powerupjs.Button = Button;
    return powerupjs;

})(powerupjs || {});   
