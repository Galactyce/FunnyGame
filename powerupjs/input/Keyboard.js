"use strict";

var powerupjs = (function (powerupjs) {

    function handleKeyDown(evt) { // key down event handler
        var code = evt.keyCode; // get key code
        if (code < 0 || code > 255) // ignore out of range codes
            return; //--- IGNORE ---
        if (!powerupjs.Keyboard._keyStates[code].down) // if key not already down
            powerupjs.Keyboard._keyStates[code].pressed = true; // mark as pressed
        powerupjs.Keyboard._keyStates[code].down = true; // mark as down
    }

    function handleKeyUp(evt) { // key up event handler
        var code = evt.keyCode; // get key code
        if (code < 0 || code > 255) // ignore out of range codes
            return; //--- IGNORE ---
        powerupjs.Keyboard._keyStates[code].down = false; // mark as not down
    }

    function Keyboard_Singleton() { // keyboard input singleton
        this._keyStates = []; // array of key states
        for (var i = 0; i < 256; ++i) // initialize key states
            this._keyStates.push(new powerupjs.ButtonState()); // create new button state
        document.onkeydown = handleKeyDown; // set key down handler
        document.onkeyup = handleKeyUp; // set key up handler
    }

    Keyboard_Singleton.prototype.reset = function () { // reset key pressed states
        for (var i = 0; i < 256; ++i) // loop through all keys
            this._keyStates[i].pressed = false; // reset pressed state
    };

    Keyboard_Singleton.prototype.pressed = function (key) { // check if key was pressed
        return this._keyStates[key].pressed; // return pressed state
    };

    Keyboard_Singleton.prototype.down = function (key) { // check if key is down
        return this._keyStates[key].down; // return down state
    };

    powerupjs.Keyboard = new Keyboard_Singleton();
    return powerupjs;

})(powerupjs || {});
