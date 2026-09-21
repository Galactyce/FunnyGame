"use strict";

var powerupjs = (function (powerupjs) {

    function Button(sprite, layer, id, hoverSprite, pressedSprite) {
        sprite = typeof sprite !== 'undefined' ? sprite : sprites.button_default;
        powerupjs.SpriteGameObject.call(this, sprite, layer, id);

        this.normalSprite = sprite; // base sprite for this button's style
        this.hoverSprite = hoverSprite || null; // optional hover variant; leave unset to keep the normal sprite
        this.pressedSprite = pressedSprite || null; // optional pressed/down variant; leave unset to keep the normal/hover sprite

        this.pressed = false;
        this.down = false;
        this.hovered = false;
    }

    Button.prototype = Object.create(powerupjs.SpriteGameObject.prototype);

    Button.prototype.handleInput = function (delta) { // handle input method
        var boundingBox = this.boundingBox; // get button bounding box
        this.hovered = boundingBox.contains(powerupjs.Mouse.position) || boundingBox.contains(powerupjs.Touch.position);
        this.pressed = this.visible && (powerupjs.Touch.containsTouchPress(boundingBox) ||
            powerupjs.Mouse.containsMousePress(boundingBox)); // check for press
        this.down = this.visible && (powerupjs.Touch.containsTouch(boundingBox) ||
            powerupjs.Mouse.containsMouseDown(boundingBox)); // check for down

        if (this.down && this.pressedSprite) { // pressed takes priority over hover
            this.sprite = this.pressedSprite;
        } else if (this.hovered && this.hoverSprite) {
            this.sprite = this.hoverSprite;
        } else {
            this.sprite = this.normalSprite;
        }
    };

   

    Object.defineProperty(Button.prototype, "sprite", {
        get: function () {
            return this._sprite;
        },
        set: function (value) {
            this._sprite = value;
        }
    });

  

    powerupjs.Button = Button;
    return powerupjs;

})(powerupjs || {});   
