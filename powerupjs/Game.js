"use strict";

var powerupjs = (function (powerupjs) {

    var requestAnimationFrame = (function () {
        return window.requestAnimationFrame || // standard method
            window.webkitRequestAnimationFrame || // webkit method
            window.mozRequestAnimationFrame || // firefox method
            window.msRequestAnimationFrame || // IE method
            window.oRequestAnimationFrame || // opera method
            window.msRequestAnimationFrame || // IE10 method
            function (callback) { // fallback
                window.setTimeout(callback, 1000 / 60); // fallback to 60 fps
            };
    })();

    function Game_Singleton() {
        this._totalTime = 0;
        this._size = null;
        this._spritesStillLoading = 0;
        this._totalSprites = 0;
        this.savedDate = Date.now()
    }

    Object.defineProperty(Game_Singleton.prototype, "totalTime",
        {
            get: function () {
                return this._totalTime; // total elapsed time
            }
        });

    Object.defineProperty(Game_Singleton.prototype, "size",
        {
            get: function () {
                return this._size; // game size
            }
        });

    Object.defineProperty(Game_Singleton.prototype, "screenCenter",
        {
            get: function () {
                return new powerupjs.Vector2(this._size.x / 2, this._size.y / 2); // center of screen
            }
        });

    Object.defineProperty(Game_Singleton.prototype, "screenRect",
        {
            get: function () {
                return new powerupjs.Rectangle(0, 0, this._size.x, this._size.y); // rectangle representing screen
            }
        });

    Game_Singleton.prototype.start = function (divName, canvasName, x, y) { // start the game
        this._size = new powerupjs.Vector2(x, y); // set game size

        powerupjs.Canvas2D.initialize(divName, canvasName); // initialize canvas
        this.loadAssets(); // load assets
        this.assetLoadingLoop(); // start asset loading loop
    };

    Game_Singleton.prototype.initialize = function () {
    };

    Game_Singleton.prototype.loadAssets = function () {
    };
    Game_Singleton.prototype.assetLoadingLoop = function () {
        powerupjs.Canvas2D.clear(); // clear canvas

        powerupjs.Canvas2D.drawText("Loading Assets...", powerupjs.Vector2.zero, powerupjs.Vector2.zero, "white", "left", "Arial", "30px"); // draw loading text
        powerupjs.Canvas2D.drawText(Math.round((powerupjs.Game._totalSprites - powerupjs.Game._spritesStillLoading) /
            powerupjs.Game._totalSprites * 100) + "%"); // draw loading percentage

        if (powerupjs.Game._spritesStillLoading > 0) // check if sprites are still loading
            requestAnimationFrame(powerupjs.Game.assetLoadingLoop); // continue loading loop
        else { // all assets loaded
            window.setTimeout(powerupjs.Game.initialize, 500); // initialize game
            window.setTimeout(powerupjs.Game.mainLoop, 1000); // start drawing loop
            window.setTimeout(powerupjs.Game.drawingLoop, 1000); // start drawing loop
        }
    };

    Game_Singleton.prototype.drawingLoop = function () {
        powerupjs.Canvas2D.clear(); // clear canvas
        powerupjs.GameStateManager.draw(); // draw game state
        requestAnimationFrame(powerupjs.Game.drawingLoop); // request next frame
    }

    Game_Singleton.prototype.mainLoop = function () { // main game loop
        var delta = 1 / 60; // fixed delta time for simplicity
        powerupjs.Game._totalTime += delta; // update total time

        powerupjs.GameStateManager.handleInput(delta); // handle input
        powerupjs.GameStateManager.update(delta); // update game state
        

        powerupjs.Keyboard.reset(); // reset keyboard state
        powerupjs.Mouse.reset(); // reset mouse state
        powerupjs.Touch.reset(); // reset touch state
        // console.log(Date.now() - (powerupjs.Game.savedDate + delta))
        // powerupjs.Game.savedDate = Date.now()
        window.setTimeout(powerupjs.Game.mainLoop, delta); // schedule next frame
    };

    powerupjs.Game = new Game_Singleton();
    return powerupjs;

}(powerupjs || {}));
