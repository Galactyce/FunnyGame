"use strict";

var powerupjs = (function (powerupjs) {

    function Rectangle(x, y, w, h) { // rectangle constructor
        this.x = typeof x !== 'undefined' ? x : 0; // default to 0
        this.y = typeof y !== 'undefined' ? y : 0; // default to 0
        this.width = typeof w !== 'undefined' ? w : 1; // default to 1
        this.height = typeof h !== 'undefined' ? h : 1;  // default to 1
    }

    Object.defineProperty(Rectangle.prototype, "left", { // left edge property
        get: function () {
            return this.x; // return x coordinate
        }
    });

    Object.defineProperty(Rectangle.prototype, "right", { // right edge property
        get: function () {
            return this.x + this.width; // return right edge coordinate
        }
    });

    Object.defineProperty(Rectangle.prototype, "top", { // top edge property
        get: function () {
            return this.y; // return y coordinate
        }
    });

    Object.defineProperty(Rectangle.prototype, "bottom", { // bottom edge property
        get: function () {
            return this.y + this.height; // return bottom edge coordinate
        }
    });

    Object.defineProperty(Rectangle.prototype, "center", { // center point property
        get: function () {
            return this.position.addTo(this.size.divideBy(2)); // return center point
        }
    });

    Object.defineProperty(Rectangle.prototype, "position", { // position property
        get: function () {
            return new powerupjs.Vector2(this.x, this.y); // return position vector
        }
    });

    Object.defineProperty(Rectangle.prototype, "size", { // size property
        get: function () {
            return new powerupjs.Vector2(this.width, this.height); // return size vector
        }
    });

    Rectangle.prototype.contains = function (v) { // check if point is inside rectangle
        v = typeof v !== 'undefined' ? v : new powerupjs.Vector2(); // default to zero vector
        return (v.x >= this.left && v.x <= this.right && // check x bounds
            v.y >= this.top && v.y <= this.bottom); // check y bounds
    };

    Rectangle.prototype.intersects = function (rect) { // check if rectangles intersect
        return (this.left <= rect.right && this.right >= rect.left && // check x overlap
            this.top <= rect.bottom && this.bottom >= rect.top); // check y overlap
    };

    Rectangle.prototype.calculateIntersectionDepth = function (rect) { // calculate intersection depth with another rectangle
        var minDistance = this.size.addTo(rect.size).divideBy(2); // minimum distance to avoid intersection
        var distance = this.center.subtractFrom(rect.center); // actual distance between centers
        var depth = powerupjs.Vector2.zero; // initialize depth vector
        if (distance.x > 0) // if this is to the right of rect
            depth.x = minDistance.x - distance.x; // calculate depth on x axis
        else // if this is to the left of rect
            depth.x = -minDistance.x - distance.x; // calculate depth on x axis
        if (distance.y > 0) // if this is below rect
            depth.y = minDistance.y - distance.y; // calculate depth on y axis
        else // if this is above rect
            depth.y = -minDistance.y - distance.y; // calculate depth on y axis
        return depth; // return intersection depth
    };

    Rectangle.prototype.intersection = function (rect) { // calculate intersection rectangle with another rectangle
        var xmin = Math.max(this.left, rect.left); // calculate left edge of intersection
        var xmax = Math.min(this.right, rect.right); // calculate right edge of intersection
        var ymin = Math.max(this.top, rect.top); // calculate top edge of intersection
        var ymax = Math.min(this.bottom, rect.bottom); // calculate bottom edge of intersection
        return new powerupjs.Rectangle(xmin, ymin, xmax - xmin, ymax - ymin); // return intersection rectangle
    };

    Rectangle.prototype.draw = function (color) { // draw rectangle for debugging
        color = typeof color !== 'undefined' ? color : powerupjs.Color.black; // default color black
        powerupjs.Canvas2D.drawRectangle(this.x - powerupjs.Camera.position.x, this.y - powerupjs.Camera.position.y // draw rectangle at camera-adjusted position
            , this.width, this.height, color); // with specified size and color
    };

    powerupjs.Rectangle = Rectangle;
    return powerupjs;

})(powerupjs || {});
