"use strict";

var powerupjs = (function (powerupjs) {

    function Canvas2D_Singleton() {
        this._canvas = null; // main canvas
        this._canvasContext = null; // context for drawing
        this._div = null; // div containing the canvas
        this._pixeldrawingCanvas = null; // offscreen canvas for pixel drawing
        this._canvasOffset = powerupjs.Vector2.zero; // offset of canvas in the page
    }

    Object.defineProperty(Canvas2D_Singleton.prototype, "offset",
        {
            get: function () {
                return this._canvasOffset;
            }
        });

    Object.defineProperty(Canvas2D_Singleton.prototype, "scale",
        {
            get: function () {
                return new powerupjs.Vector2(this._canvas.width / powerupjs.Game.size.x, // scale factors
                    this._canvas.height / powerupjs.Game.size.y);
            }
        });

    Canvas2D_Singleton.prototype.initialize = function (divName, canvasName) {
        this._canvas = document.getElementById(canvasName); // get canvas element
        this._div = document.getElementById(divName); // get div element

        if (this._canvas.getContext) // check for canvas support
            this._canvasContext = this._canvas.getContext('2d'); // get 2D context
        else {
            alert('Your browser is not HTML5 compatible.!'); // alert if no support
            return;
        }

        this._pixeldrawingCanvas = document.createElement('canvas'); // create offscreen canvas
        this._pixeldrawingCanvas.width = powerupjs.Game.size.x;
        this._pixeldrawingCanvas.height = powerupjs.Game.size.y;

        window.onresize = this.resize; // handle window resize
        this.resize(); // initial resize
    };

    Canvas2D_Singleton.prototype.clear = function () {
        this._canvasContext.clearRect(0, 0, this._canvas.width, this._canvas.height);
    };

    Canvas2D_Singleton.prototype.resize = function () {
        var gameCanvas = powerupjs.Canvas2D._canvas; // get main canvas
        var gameArea = powerupjs.Canvas2D._div; // get div containing canvas
        var widthToHeight = powerupjs.Game.size.x / powerupjs.Game.size.y; // aspect ratio
        var newWidth = window.innerWidth; // new width based on window size
        var newHeight = window.innerHeight; // new height based on window size
        var newWidthToHeight = newWidth / newHeight; // new aspect ratio

        if (newWidthToHeight > widthToHeight) { // wider than aspect ratio
            newWidth = newHeight * widthToHeight; // adjust width
        } else {
            newHeight = newWidth / widthToHeight; // adjust height
        }
        gameArea.style.width = newWidth + 'px'; // set div size
        gameArea.style.height = newHeight + 'px'; // set div size

        gameArea.style.marginTop = (window.innerHeight - newHeight) / 2 + 'px'; // center div
        gameArea.style.marginLeft = (window.innerWidth - newWidth) / 2 + 'px'; // center div
        gameArea.style.marginBottom = (window.innerHeight - newHeight) / 2 + 'px'; // center div
        gameArea.style.marginRight = (window.innerWidth - newWidth) / 2 + 'px'; // center div

        gameCanvas.width = newWidth; // set canvas size
        gameCanvas.height = newHeight; // set canvas size

        var offset = powerupjs.Vector2.zero; // calculate canvas offset
        if (gameCanvas.offsetParent) { // traverse offset parents
            do {
                offset.x += gameCanvas.offsetLeft; // accumulate left offset
                offset.y += gameCanvas.offsetTop; // accumulate top offset
            } while ((gameCanvas = gameCanvas.offsetParent)); // move to parent
        }
        powerupjs.Canvas2D._canvasOffset = offset; // store canvas offset
    };

    Canvas2D_Singleton.prototype.drawImage = function (sprite, position, rotation, scale, origin, sourceRect, mirror) {
        var canvasScale = this.scale; // get canvas scale factors

        mirror = typeof mirror !== 'undefined' ? mirror : false;

        position = typeof position !== 'undefined' ? position : powerupjs.Vector2.zero;
        rotation = typeof rotation !== 'undefined' ? rotation : 0;
        scale = typeof scale !== 'undefined' ? scale : 1;
        origin = typeof origin !== 'undefined' ? origin : powerupjs.Vector2.zero;
        sourceRect = typeof sourceRect !== 'undefined' ? sourceRect : new powerupjs.Rectangle(0, 0, sprite.width, sprite.height);

        this._canvasContext.save(); // save current context state
        if (mirror) { // mirrored drawing
            this._canvasContext.scale(scale * canvasScale.x * -1, scale * canvasScale.y); // flip horizontally
            this._canvasContext.translate(-position.x - sourceRect.width, position.y); // adjust position
            this._canvasContext.rotate(rotation); // apply rotation
            this._canvasContext.drawImage(sprite, sourceRect.x, sourceRect.y, // draw image
                sourceRect.width, sourceRect.height, // source rectangle
                sourceRect.width - origin.x, -origin.y, // destination position
                sourceRect.width, sourceRect.height); // destination size
        }
        else {
            this._canvasContext.scale(scale * canvasScale.x, scale * canvasScale.y); // normal scaling
            this._canvasContext.translate(position.x, position.y); // translate to position
            this._canvasContext.rotate(rotation); // apply rotation
            this._canvasContext.drawImage(sprite, sourceRect.x, sourceRect.y, // draw image
                sourceRect.width, sourceRect.height, // source rectangle
                -origin.x, -origin.y, // destination position
                sourceRect.width, sourceRect.height); // destination size
        }
        this._canvasContext.restore(); // restore context state
    };

    Canvas2D_Singleton.prototype.drawText = function (text, position, origin, color, textAlign, fontname, fontsize) {
        var canvasScale = this.scale;

        position = typeof position !== 'undefined' ? position : powerupjs.Vector2.zero;
        origin = typeof origin !== 'undefined' ? origin : powerupjs.Vector2.zero;
        color = typeof color !== 'undefined' ? color : powerupjs.Color.black;
        textAlign = typeof textAlign !== 'undefined' ? textAlign : "top";
        fontname = typeof fontname !== 'undefined' ? fontname : "Courier New";
        fontsize = typeof fontsize !== 'undefined' ? fontsize : "20px";

        this._canvasContext.save();
        this._canvasContext.scale(canvasScale.x, canvasScale.y);
        this._canvasContext.translate(position.x - origin.x, position.y - origin.y);
        this._canvasContext.textBaseline = 'top';
        this._canvasContext.font = fontsize + " " + fontname;
        this._canvasContext.fillStyle = color.toString();
        this._canvasContext.textAlign = textAlign;
        this._canvasContext.fillText(text, 0, 0);
        this._canvasContext.restore();
    };

    Canvas2D_Singleton.prototype.drawPixel = function (x, y, color) {
        var canvasscale = this.scale;
        this._canvasContext.save();
        this._canvasContext.scale(canvasscale.x, canvasscale.y);
        this._canvasContext.fillStyle = color.toString();
        this._canvasContext.fillRect(x, y, 1, 1);
        this._canvasContext.restore();
    };

    Canvas2D_Singleton.prototype.drawRectangle = function (x, y, width, height, color) {
        var canvasScale = this.scale;
        this._canvasContext.save();
        this._canvasContext.scale(canvasScale.x, canvasScale.y);
        this._canvasContext.strokeStyle = typeof color !== 'undefined' ? color : "blue"
        this._canvasContext.strokeRect(x, y, width, height);
        this._canvasContext.restore();
    };

    Canvas2D_Singleton.prototype.drawCircle = function(x, y, radius, color) {
        var canvasScale = this.scale;
        this._canvasContext.save();
        this._canvasContext.beginPath();
        this._canvasContext.scale(canvasScale.x, canvasScale.y);
        this._canvasContext.strokeStyle = typeof color !== 'undefined' ? color : "blue"
        this._canvasContext.arc(x, y, radius, 0, 2 * Math.PI, false);
        this._canvasContext.stroke();
        this._canvasContext.restore();
    }

    powerupjs.Canvas2D = new Canvas2D_Singleton();

    return powerupjs;

})(powerupjs || {});
