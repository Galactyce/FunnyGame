"use strict";

var powerupjs = (function (powerupjs) {

    function Vector2(x, y) { // 2D vector constructor
        this.x = typeof x !== 'undefined' ? x : 0; // default to 0
        this.y = typeof y !== 'undefined' ? y : 0; // default to 0
    }

    Object.defineProperty(Vector2, "zero", { // zero vector static property
        get: function () {
            return new powerupjs.Vector2(); // return zero vector
        }
    });

    Object.defineProperty(Vector2.prototype, "isZero", // check if vector is zero
        {
            get: function () {
                return this.x === 0 && this.y === 0; // return true if both components are zero
            }
        });

    Object.defineProperty(Vector2.prototype, "length", { // vector length property
        get: function () {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }
    });

    Vector2.prototype.addTo = function (v) { // add vector or scalar to this vector
        if (v.constructor == Vector2) { // if v is a Vector2
            this.x += v.x; // add x components
            this.y += v.y; // add y components
        }
        else if (v.constructor == Number) { // if v is a Number
            this.x += v; // add to x component
            this.y += v; // add to y component
        }
        return this; // return this vector
    };

    Vector2.prototype.add = function (v) { // return new vector that is the sum of this and v
        var result = this.copy(); // copy this vector
        return result.addTo(v); // add v to the copy and return it
    };

    Vector2.prototype.subtractFrom = function (v) { // subtract vector or scalar from this vector
        if (v.constructor == Vector2) {
            this.x -= v.x; // subtract x components
            this.y -= v.y; // subtract y components
        }
        else if (v.constructor == Number) {
            this.x -= v; // subtract from x component
            this.y -= v; // subtract from y component
        }
        return this; // return this vector
    };

    Vector2.prototype.subtract = function (v) { // return new vector that is the difference of this and v
        var result = this.copy(); // copy this vector
        return result.subtractFrom(v); // subtract v from the copy and return it
    };

    Vector2.prototype.divideBy = function (v) { // divide this vector by vector or scalar
        if (v.constructor == Vector2) { // if v is a Vector2
            this.x /= v.x; // divide x components
            this.y /= v.y; // divide y components
        }
        else if (v.constructor == Number) { // if v is a Number
            this.x /= v; // divide x component
            this.y /= v; // divide y component
        }
        return this; // return this vector
    };

    Vector2.prototype.divide = function (v) { // return new vector that is this vector divided by v
        var result = this.copy(); // copy this vector
        return result.divideBy(v); // divide the copy by v and return it
    };

    Vector2.prototype.multiplyWith = function (v) { // multiply this vector by vector or scalar
        if (v.constructor == Vector2) { // if v is a Vector2
            this.x *= v.x; // multiply x components
            this.y *= v.y; // multiply y components 
        }
        else if (v.constructor == Number) { // if v is a Number
            this.x *= v; // multiply x component
            this.y *= v; // multiply y component
        }
        return this; // return this vector
    };

    Vector2.prototype.multiply = function (v) { // return new vector that is this vector multiplied by v
        var result = this.copy(); // copy this vector
        return result.multiplyWith(v); // multiply the copy by v and return it
    };

    Vector2.prototype.toString = function () { // string representation of vector
        return "(" + this.x + ", " + this.y + ")"; // return formatted string
    };

    Vector2.prototype.normalize = function () { // normalize this vector
        var length = this.length; // get length
        if (length === 0) // if length is zero, do nothing
            return;
        this.divideBy(length); // divide by length to normalize
    };

    Vector2.prototype.copy = function () { // return a copy of this vector
        return new powerupjs.Vector2(this.x, this.y); // create new vector with same components
    };

    Vector2.prototype.equals = function (obj) { // check equality with another vector
        return this.x === obj.x && this.y === obj.y; // return true if both components are equal
    };

    powerupjs.Vector2 = Vector2;
    return powerupjs;

})(powerupjs || {});
