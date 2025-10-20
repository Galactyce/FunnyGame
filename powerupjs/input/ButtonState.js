"use strict";

var powerupjs = (function (powerupjs) {
    function ButtonState() { // button state constructor
        this.down = false; // is the button currently down
        this.pressed = false; // was the button pressed this frame
    }

    powerupjs.ButtonState = ButtonState;
    return powerupjs;

})(powerupjs || {});
