"use strict";

var powerupjs = (function (powerupjs) {

    function Animation(sprite, looping, frameTime) {
        this.sprite = sprite; // associated sprite sheet
        this.frameTime = typeof frameTime != 'undefined' ? frameTime : 0.1; // default frame time
        this.looping = looping; // is the animation looping
        this.elapsedTime = 0; // time since last frame change
        this.currentFrame = 0; // current frame index
    }

    powerupjs.Animation = Animation;
    return powerupjs;

})(powerupjs || {});   
