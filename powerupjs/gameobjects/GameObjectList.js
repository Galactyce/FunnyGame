"use strict";

var powerupjs = (function (powerupjs) {

    GameObjectList.prototype = Object.create(powerupjs.GameObject.prototype); // inherit from GameObject

    function GameObjectList(layer, id) { // game object list constructor
        powerupjs.GameObject.call(this, layer, id); // call GameObject constructor
        this.scale = 1;
        this._ui = false;
        this._gameObjects = []; // internal array of game objects
        this.length = 0; // number of game objects
    }

    GameObjectList.prototype.wellFormed = function () {
        return powerupjs.GameObject.prototype.wellFormed.call(this) &&
            Array.isArray(this._gameObjects) &&
            this.length === this._gameObjects.length &&
            typeof this.scale === "number" && isFinite(this.scale) && this.scale > 0;
    };

    GameObjectList.prototype.wellFormedAssertions = function () {
        var valid = this.wellFormed();
        if (typeof console !== "undefined" && typeof console.assert === "function") {
            console.assert(valid, "GameObjectList is not well-formed");
        }
        return valid;
    };

 

    GameObjectList.prototype.add = function (gameobject) { // add game object to list
        if (this._ui && gameobject) gameobject.ui = true;
        this._gameObjects.push(gameobject); // add to internal array
        gameobject.parent = this; // set parent to this list
        this.length = this._gameObjects.length; // keep length in sync with backing array
        this._gameObjects.sort(function (a, b) { // sort by layer
            return a.layer - b.layer; // ascending order
        });
    };

    Object.defineProperty(GameObjectList.prototype, "ui", {
        get: function () {
            return this._ui;
        },
        set: function (value) {
            this._ui = value === true;
            for (var i = 0; i < this._gameObjects.length; i++) {
                if (this._gameObjects[i]) this._gameObjects[i].ui = this._ui;
            }
        }
    });

    GameObjectList.prototype.remove = function (gameobject) { // remove game object from list
        for (var i = 0, l = this._gameObjects.length; i < l; ++i) { // iterate through backing array
            if (gameobject !== this._gameObjects[i]) // not the one to remove
                continue; // skip
            this._gameObjects.splice(i, 1); // remove from internal array
            gameobject.parent = null; // clear parent reference
            this.length = this._gameObjects.length; // keep length in sync after removal
            return; // exit after removal
        }
    };

    GameObjectList.prototype.bringToFront = function (gameobject) {
        var index = this._gameObjects.indexOf(gameobject);
        if (index < 0 || index === this._gameObjects.length - 1) return;
        this._gameObjects.splice(index, 1);
        this._gameObjects.push(gameobject);
    };

    GameObjectList.prototype.at = function (index) { // get game object at index
        if (index < 0 || index >= this.length) // index out of bounds
            return null; // return null
        return this._gameObjects[index]; // return game object at index
    };

    GameObjectList.prototype.clear = function () { // clear all game objects from list
        for (var i = 0, l = this.length; i < l; ++i) // iterate through internal array
            this._gameObjects[i].parent = null; // clear parent reference
        this._gameObjects = []; // reset internal array
        this.length = 0; // reset length
    };

    GameObjectList.prototype.find = function (id) { // find game object by id
        for (var i = 0, l = this.length; i < l; ++i) { // iterate through internal array
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
        var objects = this._gameObjects.slice(); // snapshot so objects may remove themselves
        for (var i = objects.length - 1; i >= 0; --i) // iterate in reverse order
            objects[i].handleInput(delta); // delegate input handling
    };

    GameObjectList.prototype.update = function (delta) { // update all game objects
        var objects = this._gameObjects.slice(); // snapshot so objects may remove themselves
        for (var i = 0, l = objects.length; i < l; ++i) // iterate through the snapshot
            objects[i].update(delta); // delegate update
    };

    GameObjectList.prototype.draw = function () { // draw all game objects
        var objects = this._gameObjects.slice(); // snapshot so objects may remove themselves
        for (var i = 0, l = objects.length; i < l; ++i) // iterate through the snapshot
            if (objects[i].visible) // if visible
                objects[i].draw(); // delegate draw
    };

    GameObjectList.prototype.reset = function () { // reset all game objects
        for (var i = 0, l = this.length; i < l; ++i) // iterate through internal array
            this._gameObjects[i].reset(); // delegate reset
    };

    powerupjs.GameObjectList = GameObjectList;
    return powerupjs;

})(powerupjs || {});
