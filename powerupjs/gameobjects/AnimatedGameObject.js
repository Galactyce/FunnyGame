var powerupjs = (function (powerupjs) {

    function AnimatedGameObject(layer, id) { // animated game object constructor
        powerupjs.SpriteGameObject.call(this, null, layer, id); // call SpriteGameObject constructor

        this._animations = {}; // internal dictionary of animations
        this._current = null; // current animation
        this._time = 0; // time accumulator
    }

    AnimatedGameObject.prototype = Object.create(powerupjs.SpriteGameObject.prototype); // inherit from SpriteGameObject

    AnimatedGameObject.prototype.loadAnimation = function (animname, id, looping, frametime) { // load animation
        this._animations[id] = new powerupjs.Animation(animname, looping, frametime); // create new animation and store in dictionary
    };

    AnimatedGameObject.prototype.playAnimation = function (id) { // play animation by id
        if (this._current === this._animations[id]) // already playing this animation
            return; // do nothing
        this._sheetIndex = 0; // reset sheet index
        this._time = 0; // reset time accumulator
        this._current = this._animations[id]; // set current animation
        this.sprite = this._current.sprite; // set sprite to current animation's sprite
    };

    Object.defineProperty(AnimatedGameObject.prototype, "scale", {
        get: function () {
            return this.sprite.scale; // return sprite scale
        },
        set: function (value) {
            this.sprite.scale = value; // set sprite scale
        }
    })

    AnimatedGameObject.prototype.animationEnded = function () { // check if current animation has ended
        return !this._current.looping && this.sheetIndex >= this.sprite.nrSheetElements - 1; // return true if not looping and sheet index at last frame
    };

    AnimatedGameObject.prototype.update = function (delta) { // update animated game object
        this._time += delta; // accumulate time
        while (this._time > this._current.frameTime) { // while enough time has passed for a frame change
            this._time -= this._current.frameTime; // decrement time
            this._sheetIndex++; // advance to next frame
            if (this._sheetIndex > this.sprite.nrSheetElements - 1) // exceeded last frame
                if (this._current.looping) // is looping 
                    this._sheetIndex = 0; // reset to first frame
                else // not looping
                    this._sheetIndex = this.sprite.nrSheetElements - 1; // stay at last frame
        }
        powerupjs.SpriteGameObject.prototype.update.call(this, delta); // call base update
    };

    powerupjs.AnimatedGameObject = AnimatedGameObject;
    return powerupjs;

})(powerupjs || {});   
