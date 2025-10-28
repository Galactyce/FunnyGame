"use strict";

var powerupjs = (function (powerupjs) {

    function calculateTextSize(fontname, fontsize, text) {
        var div = document.createElement("div");
        div.style.position = "absolute";
        div.style.left = -1000;
        div.style.top = -1000;
        document.body.appendChild(div);
        text = typeof text !== 'undefined' ? text : "M";
        div.style.fontSize = "" + fontsize;
        div.style.fontFamily = fontname;
        div.innerHTML = text;
        var size = new powerupjs.Vector2(div.offsetWidth, div.offsetHeight);
        document.body.removeChild(div);
        return size;
    }

    function Label(fontname, fontsize, layer, id) {
        powerupjs.GameObject.call(this, layer, id);

        this.color = powerupjs.Color.black;
        this.origin = powerupjs.Vector2.zero;
        this._fontname = typeof fontname !== 'undefined' ? fontname : "Courier New";
        this._fontsize = typeof fontsize !== 'undefined' ? fontsize : "20px";
        this._contents = "";
        this._align = "left";
        this._size = powerupjs.Vector2.zero;
        this.originalContents;
    }

    Label.prototype = Object.create(powerupjs.GameObject.prototype);

    Object.defineProperty(Label.prototype, "size",
        {
            get: function () {
                return this._size;
            }
        });

    Object.defineProperty(Label.prototype, "width",
        {
            get: function () {
                return this._size.x;
            }
        });

    Object.defineProperty(Label.prototype, "height",
        {
            get: function () {
                return this._size.y;
            }
        });

    Object.defineProperty(Label.prototype, "center",
        {
            get: function () {
                return new powerupjs.Vector2(this._size.x / 2, this._size.y / 2);
            }
        });

    Object.defineProperty(Label.prototype, "screenCenterX",
        {
            get: function () {
                return (powerupjs.Game.size.x - this.width) / 2 + this.origin.x;
            }
        });

    Object.defineProperty(Label.prototype, "screenCenterY",
        {
            get: function () {
                return (powerupjs.Game.size.y - this.height) / 2 + this.origin.y;
            }
        });

    Object.defineProperty(Label.prototype, "screenCenter",
        {
            get: function () {
                return powerupjs.Game.size.subtract(this.size).divideBy(2).addTo(this.origin);
            }
        });

    Object.defineProperty(Label.prototype, "text",
        {
            get: function () {
                return this._contents;
            },

            set: function (value) {
                if (this._contents == "") this.originalContents = value;
                this._contents = value;
                this._size = calculateTextSize(this._fontname, this._fontsize, value);
                
            }
        });

    Object.defineProperty(Label.prototype, "boundingBox", {
        get: function() {
            return new powerupjs.Rectangle(this.position.x - this.origin.x, this.position.y - this.origin.y, this.width, this.height);
        }
    }) 

    Label.prototype.draw = function () {
        if (!this.visible)
            return;
        powerupjs.Canvas2D.drawText(this._contents, this.worldPosition,
            this.origin, this.color, this._align,
            this._fontname, this._fontsize);
    };

    Label.prototype.resetText = function() {
        this.text = this.originalContents;
    }

    powerupjs.Label = Label;
    return powerupjs;

})(powerupjs || {});
