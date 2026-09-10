// Holds the per-level setup routines that configure music, event nodes and enemy attacks.
function LevelDataManagerSingleton() {
    this.setups = {}; // "levelIndex" or "levelIndex:roomIndex" -> setup function
    this.defaultSetup = null;
    this.currentKey = null;
}

LevelDataManagerSingleton.prototype.key = function (levelIndex, roomIndex) {
    return typeof roomIndex === "number" ? levelIndex + ":" + roomIndex : String(levelIndex);
};

// Pass a roomIndex to configure a single room, or omit it to configure the whole level.
LevelDataManagerSingleton.prototype.register = function (levelIndex, roomIndex, setup) {
    if (typeof roomIndex === "function") {
        setup = roomIndex;
        roomIndex = undefined;
    }
    this.setups[this.key(levelIndex, roomIndex)] = setup;
};

LevelDataManagerSingleton.prototype.registerDefault = function (setup) {
    this.defaultSetup = setup;
};

// Retrieves the setup function for a given level and room, falling back to the default setup if none is registered.
LevelDataManagerSingleton.prototype.getSetup = function (levelIndex, roomIndex) {
    var roomSetup = this.setups[this.key(levelIndex, roomIndex)];
    if (typeof roomSetup === "function") return roomSetup;
    var levelSetup = this.setups[this.key(levelIndex)];
    if (typeof levelSetup === "function") return levelSetup;
    return this.defaultSetup;
};

// Called by PlayingState every time a level or room finishes loading.
LevelDataManagerSingleton.prototype.startLevel = function (playingState, levelIndex, roomIndex) {
    var setup = this.getSetup(levelIndex, roomIndex); // Retrieve the setup function for the specified level and room
    this.currentKey = this.key(levelIndex, roomIndex); // Store the current level and room key for reference
    if (typeof setup !== "function") return null;

    var context = {
        state: playingState,
        music: playingState ? playingState.music : (WorldSettings && WorldSettings.music),
        enemies: playingState ? playingState.enemies : null,
        player: playingState ? playingState.player : null,
        level: playingState ? playingState.currentLevel : null,
        room: playingState && playingState.currentLevel ? playingState.currentLevel.room : null,
        levelIndex: levelIndex,
        roomIndex: roomIndex
    };
    setup.call(this, context);
    return context;
};

// Convenience helper for setups: links every spawned enemy to one music event node.
LevelDataManagerSingleton.prototype.bindEnemyAttacks = function (enemies, eventID, attackFunction, music) {
    if (!enemies) return;
    for (var i = 0; i < enemies.length; i++) {
        var enemy = enemies.at(i);
        if (enemy && typeof enemy.registerAttack === "function")
            enemy.registerAttack(eventID, attackFunction, music);
    }
};

var LevelDataManager = new LevelDataManagerSingleton();

// Fallback setup: uses the song and event nodes saved on the room in the editor.
LevelDataManager.registerDefault(function (context) {
    var music = context.music;
    var room = context.room;
    if (!music || !room) return;

    var song = (room.song && sounds[room.song]) ? sounds[room.song] : null;
    var nodes = Array.isArray(room.eventNodes) ? room.eventNodes : [];

    music.setRoomSong(context.levelIndex, context.roomIndex, song, true, nodes.map(function (node) {
        return {
            id: String(node.id),
            start: parseFloat(node.start) || 0,
            end: parseFloat(node.end) || 0,
            rhythm: parseFloat(node.rhythm) || 0
        };
    }));
    music.playForRoom(context.levelIndex, context.roomIndex);

    for (var i = 0; i < nodes.length; i++) {
        this.bindEnemyAttacks(context.enemies, String(nodes[i].id), null, music);
    }
});
