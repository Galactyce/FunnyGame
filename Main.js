
"use strict";

var ID = {};
var sprites = {};
var sounds = {};

powerupjs.Game.loadAssets = function () {
    var loadSprite = function (sprite, collisionMask) {
        return new powerupjs.SpriteSheet("sprites/" + sprite/*, collisionMask*/);
    };

    var loadSound = function (sound, looping) {
        return new powerupjs.Sound("sounds/" + sound, looping);
    };

    sprites.button_default = loadSprite("button_default.png");
    sprites.defaultTile = loadSprite("placeholder_tile.png");
    sprites.spike = loadSprite("spike.png")
    sprites.player_idle = loadSprite("Idle@11.png")
    sprites.frame = loadSprite("frame.jpeg")
    sprites.woodenFrame = loadSprite("wooden_frame5x2.png")
    sprites.editorBlockSelector = loadSprite("editorBlockSelectFrame.png")
    sprites.portal = loadSprite("portal.png")

};

powerupjs.Game.initialize = function () {
    // // play the music
    // sounds.music.volume = 0.3;
    // sounds.music.play();
    powerupjs.Camera.initialize();
    // define the layers
    ID.layer_background = 1;
    ID.layer_background_1 = 2;
    ID.layer_background_2 = 3;
    ID.layer_background_3 = 4;
    ID.layer_tiles = 10;
    ID.layer_objects = 20;
    ID.layer_overlays = 30;
    ID.layer_overlays_1 = 31;
    ID.layer_overlays_2 = 32;

    // define object IDs
    ID.player = 1;
    ID.timer = 2;
    ID.tiles = 3;
    ID.exit = 4;
    ID.hint_timer = 5;
    ID.button_walkleft = 6;
    ID.button_walkright = 7;
    ID.button_jump = 8;
    ID.player_spawn = 9;

    ID.game_state_title = powerupjs.GameStateManager.add(new TitleMenuState());
    ID.game_state_editor = powerupjs.GameStateManager.add(new GameplayEditorState());
    ID.game_state_playing = powerupjs.GameStateManager.add(new PlayingState());
    powerupjs.GameStateManager.switchTo(ID.game_state_title);

    WorldSettings.blockSprites = [ // list of block sprites
        sprites.defaultTile,
        sprites.spike
    ]
    WorldSettings.loadLevels(); // load levels from window.LEVELS

    powerupjs.GameStateManager.get(ID.game_state_editor).objectMenu.loadBlocks(); // load blocks into object menu
    powerupjs.GameStateManager.get(ID.game_state_editor).loadLayers(); // load editor layers
};
