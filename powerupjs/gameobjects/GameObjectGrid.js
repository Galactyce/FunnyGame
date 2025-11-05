"use strict";

var powerupjs = (function (powerupjs) {

    function GameObjectGrid(rows, columns, layer, id) { // game object grid constructor
        powerupjs.GameObjectList.call(this, layer, id); // call GameObjectList constructor

        this.cellWidth = 0; // width of each cell
        this.cellHeight = 0; // height of each cell
        this._rows = rows; // number of rows
        this._columns = columns; // number of columns
    }

    GameObjectGrid.prototype = Object.create(powerupjs.GameObjectList.prototype); // inherit from GameObjectList

    Object.defineProperty(GameObjectGrid.prototype, "rows", { // number of rows
        get: function () {
            return this._rows; // number of rows
        }
    });

    Object.defineProperty(GameObjectGrid.prototype, "columns", { // number of columns
        get: function () {
            return this._columns; // number of columns
        }
    });

    GameObjectGrid.prototype.add = function (gameobject) { // add game object to grid
        var row = Math.floor(this.length / this._columns); // calculate row
        var col = this.length % this._columns; // calculate column
        this._gameObjects.push(gameobject); // add to internal array
        this.length++; // increment length
        gameobject.parent = this; // set parent to this grid
        gameobject.position = new powerupjs.Vector2(col * this.cellWidth, row * this.cellHeight); // set position based on grid cell
    };

    GameObjectGrid.prototype.addAt = function (gameobject, col, row) { // add game object at specific grid cell
        this._gameObjects[row * this._columns + col] = gameobject; // add to internal array at calculated index
        this.length++; // increment length
        gameobject.parent = this; // set parent to this grid
        gameobject.position = new powerupjs.Vector2(col * this.cellWidth, row * this.cellHeight); // set position based on grid cell
    };

    GameObjectGrid.prototype.at = function (col, row) { // get game object at specific grid cell
        var index = row * this._columns + col; // calculate index
        if (index < 0 || index >= this.length) // index out of bounds
            return null; // return null
        else
            return this._gameObjects[index]; // return game object at index
    };

    GameObjectGrid.prototype.getAnchorPosition = function (gameobject) { // get position of game object in grid
        var l = this.length; // length of internal array
        for (var i = 0; i < l; ++i) // iterate through internal array
            if (this._gameObjects[i] == gameobject) { // found game object
                var row = Math.floor(i / this.columns); // calculate row
                var col = i - row * this.columns; // calculate column
                return new powerupjs.Vector2(col * this.cellWidth, row * this.cellHeight); // return position
            }
        return powerupjs.Vector2.zero; // not found, return zero vector
    };

    powerupjs.GameObjectGrid = GameObjectGrid;
    return powerupjs;

})(powerupjs || {});
