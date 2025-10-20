"use strict";

var powerupjs = (function (powerupjs) {

    function GameObject(layer, id) { // game object constructor
        powerupjs.IGameLoopObject.call(this); // call IGameLoopObject constructor

        this.layer = typeof layer !== 'undefined' ? layer : 0; // default layer 0
        this.id = typeof id !== 'undefined' ? id : 0; // default id 0
        this.parent = null; // no parent by default
        this.position = powerupjs.Vector2.zero; // default position at origin
        this.velocity = powerupjs.Vector2.zero; // default velocity zero
        this._visible = true; // visible by default
    }

    GameObject.prototype = Object.create(powerupjs.IGameLoopObject.prototype); // inherit from IGameLoopObject

    Object.defineProperty(GameObject.prototype, "visible", // visibility property
        {
            get: function () {
                if (this.parent === null) // if no parent
                    return this._visible; // return own visibility
                else
                    return this._visible && this.parent.visible; // return combined visibility
            },

            set: function (value) {
                this._visible = value; // set own visibility
            }
        });

    Object.defineProperty(GameObject.prototype, "root", // root object property
        {
            get: function () {
                if (this.parent === null) // if no parent
                    return this; // return self
                else
                    return this.parent.root; // recursively get parent's root
            }
        });

    Object.defineProperty(GameObject.prototype, "worldPosition", // world position property
        {
            get: function () {
                if (this.parent !== null) { // if has parent
                    return this.parent.worldPosition.addTo(this.position); // add parent's world position
                }
                else
                    return this.position.copy(); // return own position
            }
        });

    Object.defineProperty(GameObject.prototype, "screenPosition", { // screen position property
        get: function () {
            return this.worldPosition.subtractFrom(powerupjs.Camera.position); // adjust world position by camera position
        }
    })

    GameObject.prototype.reset = function () { // reset game object to default state
        this._visible = true; // set visible
    };

    GameObject.prototype.update = function (delta) { // update game object
        this.position.addTo(this.velocity.multiply(delta)); // update position based on velocity
    };

    powerupjs.GameObject = GameObject;
    return powerupjs;

})(powerupjs || {});
