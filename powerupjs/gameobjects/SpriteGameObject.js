"use strict";

var powerupjs = (function (powerupjs) {

    function SpriteGameObject(sprite, layer, id) { // sprite game object constructor
        powerupjs.GameObject.call(this, layer, id); // call GameObject constructor

        this.sprite = sprite; // assign sprite

        this.origin = powerupjs.Vector2.zero; // default origin at top-left
        this.mirror = false; // not mirrored by default
        this._sheetIndex = 0; // default sheet index 0
        this.hitbox = null; // no hitbox by default
        this.ui = false; // not a UI element by default
        this.rotation = 0;
    }

    SpriteGameObject.prototype = Object.create(powerupjs.GameObject.prototype); // inherit from GameObject

    Object.defineProperty(SpriteGameObject.prototype, "size",
        {
            get: function () {
                return this.sprite.size; // return sprite size
            }
        });

    Object.defineProperty(SpriteGameObject.prototype, "scale", {
        get: function () {
            return this.sprite.scale; // return sprite scale
        },
        set: function (value) {
            if (this.sprite == null) return; // guard clause
            this.sprite.scale = value; // set sprite scale
        }
    })

    Object.defineProperty(SpriteGameObject.prototype, "width",
        {
            get: function () {
                return this.sprite.width; // return sprite width
            }
        });

    Object.defineProperty(SpriteGameObject.prototype, "height",
        {
            get: function () {
                return this.sprite.height; // return sprite height
            }
        });

    Object.defineProperty(SpriteGameObject.prototype, "center",
        {
            get: function () {
                return this.sprite.center; // return sprite center
            }
        });

    Object.defineProperty(SpriteGameObject.prototype, "sheetIndex",
        {
            get: function () {
                return this._sheetIndex; // return current sheet index
            },
            set: function (value) {
                if (value >= 0) // set sheet index if non-negative
                    this._sheetIndex = value % this.sprite.nrSheetElements; // wrap around if exceeds number of elements
            }
        });

    Object.defineProperty(SpriteGameObject.prototype, "screenCenterX",
        {
            get: function () {
                return (powerupjs.Game.size.x - this.width) / 2 + this.origin.x; // calculate screen center X
            }
        });

    Object.defineProperty(SpriteGameObject.prototype, "screenCenterY",
        {
            get: function () {
                return (powerupjs.Game.size.y - this.height) / 2 + this.origin.y; // calculate screen center Y
            }
        });

    Object.defineProperty(SpriteGameObject.prototype, "screenCenter",
        {
            get: function () {
                return powerupjs.Game.size.subtract(this.size).divideBy(2).addTo(this.origin); // calculate screen center point
            }
        });

    Object.defineProperty(SpriteGameObject.prototype, "boundingBox",
        {
            get: function () {
                var leftTop = this.worldPosition.subtractFrom((this.origin)); // calculate top-left corner
                return new powerupjs.Rectangle(leftTop.x, leftTop.y, this.width, this.height); // return bounding box rectangle
            }
        });

    SpriteGameObject.prototype.draw = function () {
        if (this._visible) {
            if (this.ui) { // if UI element, draw at world position
                this.sprite.draw(this.worldPosition, this.origin, this.rotation, this._sheetIndex, this.mirror); // draw sprite at world position
                return; // exit after drawing UI element
            }
            
            this.sprite.draw(this.screenPosition, this.origin, this.rotation, this._sheetIndex, this.mirror); // draw sprite at screen position
        }
    };

    SpriteGameObject.prototype.collidesWith = function (obj) { // pixel-perfect collision detection
        if (!this.visible || !obj.visible || !this.boundingBox.intersects(obj.boundingBox)) // bounding boxes do not intersect
            return false; // no collision
        var intersect = this.boundingBox.intersection(obj.boundingBox); // get intersection rectangle
        var local = intersect.position.subtractFrom(this.worldPosition.subtractFrom(this.origin)); // local coords in this sprite
        var objLocal = intersect.position.subtractFrom(obj.worldPosition.subtractFrom(obj.origin)); // local coords in other sprite
        for (var x = 0; x < intersect.width; x++) // for each pixel in intersection
            for (var y = 0; y < intersect.height; y++) { // for each pixel in intersection
                if (this.getAlpha(Math.floor(local.x + x), Math.floor(local.y + y)) !== 0
                    && obj.getAlpha(Math.floor(objLocal.x + x), Math.floor(objLocal.y + y)) !== 0) // both pixels are opaque
                    return true; // collision detected
            }
        return false; // no collision found
    };

    SpriteGameObject.prototype.getAlpha = function (x, y) { // get alpha value of pixel at (x, y) in local sprite coords
        return this.sprite.getAlpha(x, y, this._sheetIndex, this.mirror); // delegate to sprite method
    };

    powerupjs.SpriteGameObject = SpriteGameObject;
    return powerupjs;

})(powerupjs || {});   
