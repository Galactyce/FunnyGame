"use strict";

var powerupjs = (function (powerupjs) {

    GameObjectList.prototype = Object.create(powerupjs.GameObject.prototype); // inherit from GameObject

    function GameObjectList(layer, id) { // game object list constructor
        powerupjs.GameObject.call(this, layer, id); // call GameObject constructor

        this._gameObjects = []; // internal array of game objects
    }

    Object.defineProperty(GameObjectList.prototype, "length", { // length property
        get: function () {
            return this._gameObjects.length; // return number of game objects
        }
    });

    GameObjectList.prototype.add = function (gameobject) { // add game object to list
        this._gameObjects.push(gameobject); // add to internal array
        gameobject.parent = this; // set parent to this list
        this._gameObjects.sort(function (a, b) { // sort by layer
            return a.layer - b.layer; // ascending order
        });
    };

    GameObjectList.prototype.remove = function (gameobject) { // remove game object from list
        for (var i = 0, l = this._gameObjects.length; i < l; ++i) { // iterate through internal array
            if (gameobject !== this._gameObjects[i]) // not the one to remove
                continue; // skip
            this._gameObjects.splice(i, 1); // remove from internal array
            gameobject.parent = null; // clear parent reference
            return; // exit after removal
        }
    };

    GameObjectList.prototype.at = function (index) { // get game object at index
        if (index < 0 || index >= this._gameObjects.length) // index out of bounds
            return null; // return null
        return this._gameObjects[index]; // return game object at index
    };

    GameObjectList.prototype.clear = function () { // clear all game objects from list
        for (var i = 0, l = this._gameObjects.length; i < l; ++i) // iterate through internal array
            this._gameObjects[i].parent = null; // clear parent reference
        this._gameObjects = []; // reset internal array
    };

    GameObjectList.prototype.find = function (id) { // find game object by id
        for (var i = 0, l = this._gameObjects.length; i < l; ++i) { // iterate through internal array
            if (this._gameObjects[i].id === id) // id match
                return this._gameObjects[i]; // return found game object
            if (this._gameObjects[i] instanceof powerupjs.GameObjectList) { // if game object is a list
                var obj = this._gameObjects[i].find(id); // search recursively
                if (obj !== null) // found in child list
                    return obj; // return found game object
            }
        }
        return null; // not found
    };

    GameObjectList.prototype.handleInput = function (delta) { // handle input for all game objects
        for (var i = this._gameObjects.length - 1; i >= 0; --i) // iterate in reverse order
            this._gameObjects[i].handleInput(delta); // delegate input handling
    };

    GameObjectList.prototype.update = function (delta) { // update all game objects
        for (var i = 0, l = this._gameObjects.length; i < l; ++i) // iterate through internal array
            this._gameObjects[i].update(delta); // delegate update
    };

    GameObjectList.prototype.draw = function () { // draw all game objects
        for (var i = 0, l = this._gameObjects.length; i < l; ++i) // iterate through internal array
            if (this._gameObjects[i].visible) // if visible
                this._gameObjects[i].draw(); // delegate draw
    };

    GameObjectList.prototype.reset = function () { // reset all game objects
        for (var i = 0, l = this._gameObjects.length; i < l; ++i) // iterate through internal array
            this._gameObjects[i].reset(); // delegate reset
    };

    powerupjs.GameObjectList = GameObjectList;
    return powerupjs;

})(powerupjs || {});
