"use strict";

var powerupjs = (function (powerupjs) {

    function GameStateManager_Singleton() {
        this._gameStates = []; // list of game states
        this._currentGameState = null; // current active game state
    }

    GameStateManager_Singleton.prototype.add = function (gamestate) { // add a new game state
        this._gameStates.push(gamestate); // add to list
        this._currentGameState = gamestate; // set as current state
        return this._gameStates.length - 1; // return index
    };

    GameStateManager_Singleton.prototype.get = function (id) {
        if (id < 0 || id >= this._gameStates.length) // invalid id
            return null; // return null
        else // valid id
            return this._gameStates[id]; // return game state
    };

    GameStateManager_Singleton.prototype.switchTo = function (id) {
        if (id < 0 || id >= this._gameStates.length) // invalid id
            return; // do nothing
        this._currentGameState = this._gameStates[id]; // switch to game state
        this._currentGameState.reset(); // reset game state
    };

    GameStateManager_Singleton.prototype.handleInput = function (delta) { // handle input
        if (this._currentGameState != null) // current game state exists
            this._currentGameState.handleInput(delta); // delegate input handling
    };

    GameStateManager_Singleton.prototype.update = function (delta) {
        if (this._currentGameState != null) // current game state exists
            this._currentGameState.update(delta); // delegate update
    };

    GameStateManager_Singleton.prototype.draw = function () {
        if (this._currentGameState != null) // current game state exists
            this._currentGameState.draw(); // delegate draw
    };

    GameStateManager_Singleton.prototype.reset = function () {
        if (this._currentGameState != null) // current game state exists
            this._currentGameState.reset(); // delegate reset
    };

    powerupjs.GameStateManager = new GameStateManager_Singleton();
    return powerupjs;

})(powerupjs || {});

