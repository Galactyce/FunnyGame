"use strict";

var powerupjs = (function (powerupjs) {

    function SpriteSheet(imageName, isAnimated) { // creates a new sprite sheet from an image
        console.log("Loading sprite: " + imageName); // log sprite loading
        powerupjs.Game._spritesStillLoading += 1; // increment sprites still loading
        powerupjs.Game._totalSprites += 1; // increment total sprites
        this.colorShift = 0;
        this._image = new Image(); // create new image

        this._image.src = imageName; // set image source
        this._sheetColumns = 1; // initialize sheet columns
        this._sheetRows = 1; // initialize sheet rows
        this._collisionMask = null; // initialize collision mask
        this.scale = 1; // default scale
        var sprite = this; // reference to this sprite sheet
        this.isAnimated = isAnimated;
        this._image.onload = function () { // when image loads
            console.log("Sprite loaded: " + imageName); // log sprite loaded
            powerupjs.Game._spritesStillLoading -= 1; // decrement sprites still loading
        };

        // determine the number of sheet rows and columns
        var pathSplit = imageName.split('/'); // split path by '/'
        var fileName = pathSplit[pathSplit.length - 1]; // get the file name
        var fileSplit = fileName.split("/")[0].split(".")[0].split("@"); // split by '@' to find sheet info
        if (fileSplit.length > 1)
            this._sheetColumns = parseInt(fileSplit[1]);
        if (fileSplit.length <= 1) // no sheet info
            return; // exit
        var colRow = fileSplit[fileSplit.length - 1].split("x"); // split by 'x' to get columns and rows
        this._sheetColumns = parseInt(colRow[0]); // set sheet columns
        if (colRow.length === 2) // if rows specified
            this._sheetRows = colRow[1]; // set sheet rows
    }

    Object.defineProperty(SpriteSheet.prototype, "image", // get the image
        {
            get: function () {
                return this._image; // return the image
            }
        });

    Object.defineProperty(SpriteSheet.prototype, "width", // get width of a single sprite
        {
            get: function () {
                return this._image.width / this._sheetColumns; // calculate width
            }
        });

    Object.defineProperty(SpriteSheet.prototype, "height", // get height of a single sprite
        {
            get: function () {
                return this._image.height / this._sheetRows; // calculate height
            }
        });

    Object.defineProperty(SpriteSheet.prototype, "size", // get size of a single sprite
        {
            get: function () {
                return new powerupjs.Vector2(this.width, this.height); // return size vector
            }
        });

    Object.defineProperty(SpriteSheet.prototype, "center", // get center of a single sprite
        {
            get: function () {
                return this.size.divideBy(2); // calculate center
            }
        });

    Object.defineProperty(SpriteSheet.prototype, "nrSheetElements", // get number of sprites in sheet
        {
            get: function () {
                return this._sheetRows * this._sheetColumns; // calculate number of elements
            }
        });

    SpriteSheet.prototype.shiftImageColor = function(hueDegrees) {
        return new Promise((resolve) => {
            this._image.crossOrigin = 'Anonymous';
            // Create an off-screen canvas to do the drawing
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set canvas dimensions to match the source image
            canvas.width = this._image.width
            canvas.height = this._image.height

            // Apply the hue-rotate filter to the context before drawing
            ctx.filter = `hue-rotate(${hueDegrees}deg)`;

            // Draw the image onto the canvas
            ctx.drawImage(this._image, 0, 0);

            // Get the image data from the canvas as a data URL
            const imageDataUrl = canvas.toDataURL("image/png");

            // Create a new Image object and set its source to the data URL
            const shiftedImage = new Image();
            shiftedImage.onload = () => {
                resolve(shiftedImage);
            };
            shiftedImage.src = imageDataUrl;

            console.log(shiftedImage.src)
            this._image = shiftedImage
        });
    }

    SpriteSheet.prototype.getAlpha = function (x, y, sheetIndex, mirror) { // get alpha value at pixel
        if (this._collisionMask === null) // if no collision mask
            return 255; // fully opaque

        var columnIndex = sheetIndex % this._sheetColumns; // calculate column index
        var rowIndex = Math.floor(sheetIndex / this._sheetColumns) % this._sheetRows; // calculate row index
        var textureX = columnIndex * this.width + x; // calculate x position in texture
        if (mirror) // if mirrored
            textureX = (columnIndex + 1) * this.width - x - 1; // adjust x position
        var textureY = rowIndex * this.height + y; // calculate y position in texture
        var arrayIndex = Math.floor(textureY * this._image.width + textureX); // calculate index in collision mask array
        if (arrayIndex < 0 || arrayIndex >= this._collisionMask.length) // if index out of bounds
            return 0; // fully transparent
        else
            return this._collisionMask[arrayIndex]; // return alpha value
    };

    SpriteSheet.prototype.draw = function (position, origin, scale, rotation, sheetIndex, mirror) { // draw a specific sprite from the sheet
        sheetIndex = typeof sheetIndex !== 'undefined' ? sheetIndex : 0;
        var columnIndex = sheetIndex % this._sheetColumns; // calculate column index
        var rowIndex = Math.floor(sheetIndex / this._sheetColumns) % this._sheetRows; // calculate row index
        origin = typeof origin !== 'undefined' ? origin : powerupjs.Vector2.zero; // default origin
        mirror = typeof mirror !== 'undefined' ? mirror : false; // default mirror
        var imagePart = new powerupjs.Rectangle(columnIndex * this.width, rowIndex * this.height,
            this.width, this.height); // define source rectangle
        
        powerupjs.Canvas2D.drawImage(this._image, position, rotation, scale, origin, imagePart, mirror); // draw the image
        

    };

    powerupjs.SpriteSheet = SpriteSheet;
    return powerupjs;

})(powerupjs || {});
