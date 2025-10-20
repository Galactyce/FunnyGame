"use strict";

var powerupjs = (function (powerupjs) {

    function handleMouseMove(evt) { // handle mouse move event
        var canvasScale = powerupjs.Canvas2D.scale; // get canvas scale
        var canvasOffset = powerupjs.Canvas2D.offset; // get canvas offset
        var mx = (evt.pageX - canvasOffset.x) / canvasScale.x; // calculate x position
        var my = (evt.pageY - canvasOffset.y) / canvasScale.y; // calculate y position
        powerupjs.Mouse._position = new powerupjs.Vector2(mx, my); // update mouse position
    }

    function handleMouseDown(evt) { // handle mouse down event
        handleMouseMove(evt); // update mouse position

        if (evt.which === 1) { // left button
            if (!powerupjs.Mouse._left.down) // if not already down
                powerupjs.Mouse._left.pressed = true; // mark as pressed
            powerupjs.Mouse._left.down = true; // mark as down
        } else if (evt.which === 2) { // middle button
            if (!powerupjs.Mouse._middle.down) // if not already down
                powerupjs.Mouse._middle.pressed = true; // mark as pressed
            powerupjs.Mouse._middle.down = true; // mark as down
        } else if (evt.which === 3) { // right button
            if (!powerupjs.Mouse._right.down) // if not already down
                powerupjs.Mouse._right.pressed = true; // mark as pressed
            powerupjs.Mouse._right.down = true; // mark as down
        }
    }

    function handleMouseUp(evt) { // handle mouse up event
        handleMouseMove(evt); // update mouse position

        if (evt.which === 1) // left button
            powerupjs.Mouse._left.down = false; // mark as not down
        else if (evt.which === 2) // middle button
            powerupjs.Mouse._middle.down = false; // mark as not down
        else if (evt.which === 3) // right button
            powerupjs.Mouse._right.down = false; // mark as not down
    }

    function Mouse_Singleton() { // mouse input singleton
        this._position = powerupjs.Vector2.zero; // mouse position
        this._left = new powerupjs.ButtonState(); // left button state
        this._middle = new powerupjs.ButtonState(); // middle button state
        this._right = new powerupjs.ButtonState(); // right button state
        document.onmousemove = handleMouseMove; // set mouse move handler
        document.onmousedown = handleMouseDown; // set mouse down handler
        document.onmouseup = handleMouseUp; // set mouse up handler
    }

    Object.defineProperty(Mouse_Singleton.prototype, "left", // left button state
        {
            get: function () {
                return this._left; // return left button state
            }
        });

    Object.defineProperty(Mouse_Singleton.prototype, "middle", // middle button state
        {
            get: function () {
                return this._middle; // return middle button state
            }
        });

    Object.defineProperty(Mouse_Singleton.prototype, "right", // right button state
        {
            get: function () {
                return this._right; // return right button state
            }
        });

    Object.defineProperty(Mouse_Singleton.prototype, "position", // mouse position in world coordinates
        {
            get: function () {
                return this._position.copy().addTo(powerupjs.Camera.position); // return world position
            }
        });

    Object.defineProperty(Mouse_Singleton.prototype, "screenPosition", // mouse position on screen
        {
            get: function () {
                return this._position.copy(); // return screen position
            }
        });

    Mouse_Singleton.prototype.reset = function () { // reset button pressed states
        this._left.pressed = false; // reset left button pressed state
        this._middle.pressed = false; // reset middle button pressed state
        this._right.pressed = false; // reset right button pressed state
    };

    Mouse_Singleton.prototype.containsMouseDown = function (rect) { // check if mouse is down within rectangle
        return this._left.down && rect.contains(this._position); // return true if down and within rectangle
    };

    Mouse_Singleton.prototype.containsMousePress = function (rect) { // check if mouse is pressed within rectangle
        return this._left.pressed && rect.contains(this._position); // return true if pressed and within rectangle
    };

    powerupjs.Mouse = new Mouse_Singleton();
    return powerupjs;

})(powerupjs || {});
