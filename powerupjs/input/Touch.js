"use strict";

var powerupjs = (function (powerupjs) {

    function handleTouchStart(evt) { // touch start event
        evt.preventDefault(); // prevent default behavior
        var touches = evt.changedTouches; // get changed touches
        for (var i = 0; i < touches.length; i++) { // loop through touches
            powerupjs.Touch._touches.push(touches[i]); // add touch to list
            powerupjs.Touch._touchPresses.push(true); // mark touch as a press
        }
    }

    function handleTouchMove(evt) { // touch move event
        evt.preventDefault(); // prevent default behavior
        var touches = evt.changedTouches; // get changed touches
        for (var i = 0; i < touches.length; i++) { // loop through touches
            var id = powerupjs.Touch.getTouchIndexFromId(touches[i].identifier); // find touch index
            powerupjs.Touch._touches.splice(id, 1, touches[i]); // update touch position
        }
    }

    function handleTouchEnd(evt) { // touch end event
        evt.preventDefault(); // prevent default behavior
        var touches = evt.changedTouches; // get changed touches
        for (var i = 0; i < touches.length; ++i) { // loop through touches
            var id = powerupjs.Touch.getTouchIndexFromId(touches[i].identifier); // find touch index
            powerupjs.Touch._touches.splice(id, 1); // remove touch from list
            powerupjs.Touch._touchPresses.splice(id, 1); // remove touch press mark
        }
    }

    function Touch_Singleton() { // singleton class for touch input
        this._touches = []; // list of current touches
        this._touchPresses = []; // list of touch press states
        document.addEventListener('touchstart', handleTouchStart, false); // add event listeners
        document.addEventListener('touchend', handleTouchEnd, false); // add event listeners
        document.addEventListener('touchcancel', handleTouchEnd, false); // add event listeners
        document.addEventListener('touchleave', handleTouchEnd, false); // add event listeners
        document.body.addEventListener('touchmove', handleTouchMove, false); // add event listeners
    }

    Object.defineProperty(Touch_Singleton.prototype, "nrTouches", { // get number of current touches
        get: function () {
            return this._touches.length; // return touch count
        }
    });

    Object.defineProperty(Touch_Singleton.prototype, "isTouching", { // check if there are any current touches
        get: function () {
            return this._touches.length !== 0; // return true if there are touches
        }
    });

    Object.defineProperty(Touch_Singleton.prototype, "isTouchDevice", // check if device supports touch
        {
            get: function () {
                return ('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0); // check for touch support
            }
        });

    Touch_Singleton.prototype.getTouchIndexFromId = function (id) { // get touch index by identifier
        for (var i = 0, l = this._touches.length; i < l; ++i) { // loop through touches
            if (this._touches[i].identifier === id) // check for matching id
                return i; // return index
        }
        return -1; // not found
    };

    Touch_Singleton.prototype.reset = function () { // reset touch presses
        for (var i = 0, l = this._touchPresses.length; i < l; ++i) // loop through touch presses
            this._touchPresses[i] = false; // mark as not pressed
    };

    Touch_Singleton.prototype.getPosition = function (index) { // get touch position by index
        var canvasScale = powerupjs.Canvas2D.scale; // get canvas scale
        var canvasOffset = powerupjs.Canvas2D.offset; // get canvas offset
        var mx = (this._touches[index].pageX - canvasOffset.x) / canvasScale.x; // calculate x position
        var my = (this._touches[index].pageY - canvasOffset.y) / canvasScale.y; // calculate y position
        return new powerupjs.Vector2(mx, my); // return position vector
    };

    Touch_Singleton.prototype.getIndexInRect = function (rect) { // get index of touch within rectangle
        for (var i = 0, l = this._touches.length; i < l; ++i) { // loop through touches
            var pos = this.getPosition(i); // get touch position
            if (rect.contains(pos)) // check if touch is within rectangle
                return i; // return index
        }
        return powerupjs.Vector2.zero; // return zero vector if not found
    };

    Touch_Singleton.prototype.containsTouch = function (rect) { // check if any touch is within rectangle
        for (var i = 0, l = this._touches.length; i < l; ++i) { // loop through touches
            if (rect.contains(this.getPosition(i))) // check if touch is within rectangle
                return true; // return true if found
        }
        return false; // return false if not found
    };

    Touch_Singleton.prototype.containsTouchPress = function (rect) { // check if any touch press is within rectangle
        for (var i = 0, l = this._touches.length; i < l; ++i) { // loop through touches
            if (rect.contains(this.getPosition(i)) && this._touchPresses[i]) // check if touch press is within rectangle
                return true; // return true if found
        }
        return false; // return false if not found
    };

    powerupjs.Touch = new Touch_Singleton();
    return powerupjs;

})(powerupjs || {});
