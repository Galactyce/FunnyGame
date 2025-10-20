"use strict";

var powerupjs = (function (powerupjs) {

    function IGameLoopObject() {
    }

    IGameLoopObject.prototype.initialize = function () { // initialize the object
    };

    IGameLoopObject.prototype.handleInput = function (delta) { // handle input
    };

    IGameLoopObject.prototype.update = function (delta) { // update the object
    };

    IGameLoopObject.prototype.draw = function () { // draw the object
    };

    IGameLoopObject.prototype.reset = function () {
    };

    powerupjs.IGameLoopObject = IGameLoopObject;
    return powerupjs;

})(powerupjs || {});
