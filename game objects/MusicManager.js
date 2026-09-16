function MusicManager(layer, id) {
    powerupjs.GameObjectList.call(this, layer, id);
    this.currentSong = null;
    this.songTime = 0;
    this._previousSongTime = 0;
    this._volume = 0.3;
    this.beatListeners = [];
    this.roomSongs = {}; // "levelIndex:roomIndex" -> song entry
    this.defaultSong = null;
    this._currentSource = null; // whatever was handed to playSong, used to avoid restarts
}

MusicManager.prototype = Object.create(powerupjs.GameObjectList.prototype);

Object.defineProperty(MusicManager.prototype, "volume", {
    get: function () {
        return this._volume;
    },
    set: function (value) {
        this._volume = value;
        if (this.currentSong !== null && this.currentSong.snd !== null)
            this.currentSong.volume = value;
    }
});

Object.defineProperty(MusicManager.prototype, "playing", {
    get: function () {
        return this.currentSong !== null && this.currentSong.snd !== null && !this.currentSong.snd.paused;
    }
});

MusicManager.prototype.playSong = function (sound, looping) {
    this.stop();
    this._currentSource = sound; // store the source to avoid unnecessary restarts
    if (sound instanceof powerupjs.Sound)
        this.currentSong = sound;
    else
        this.currentSong = new powerupjs.Sound(sound, typeof looping !== 'undefined' ? looping : true);
    if (this.currentSong.snd !== null)
        this.currentSong.volume = this._volume;
    else
        this.currentSong = sounds.reassurance;
    this.currentSong.play();
    this._ensurePlayback();
    this.resetEventNodes();
};



// Browsers block audio until the page has been interacted with, so retry on the first input.
MusicManager.prototype._ensurePlayback = function () {
    var snd = this.currentSong !== null ? this.currentSong.snd : null;
    if (!snd) return;

    var attempt = function () {
        var promise = snd.play();
        if (promise && typeof promise.catch === "function")
            promise.catch(function () { });
    };

    var onGesture = function () {
        attempt();
        document.removeEventListener("mousedown", onGesture);
        document.removeEventListener("keydown", onGesture);
        document.removeEventListener("touchstart", onGesture);
    };

    attempt();
    document.addEventListener("mousedown", onGesture);
    document.addEventListener("keydown", onGesture);
    document.addEventListener("touchstart", onGesture);
};

MusicManager.prototype.stop = function () {
    if (this.currentSong !== null && this.currentSong.snd !== null) {
        this.currentSong.snd.pause();
        this.currentSong.snd.currentTime = 0;
    }
    this.currentSong = null;
    this._currentSource = null;
    this.songTime = 0;
    this._previousSongTime = 0;
    this.resetEventNodes();
};

MusicManager.prototype.pause = function () {
    if (this.currentSong !== null && this.currentSong.snd !== null)
        this.currentSong.snd.pause();
};

MusicManager.prototype.resume = function () {
    if (this.currentSong !== null && this.currentSong.snd !== null)
        this.currentSong.snd.play();
};

// Accepts an existing EventNode, or the arguments to build one.
MusicManager.prototype.addEventNode = function (node, start, end, rhythm, action) {
    if (!(node instanceof EventNode))
        node = new EventNode(node, start, end, rhythm, action);
    if (node.parent !== null && node.parent !== this)
        node.parent.remove(node);
    this.add(node);
    return node;
};

MusicManager.prototype.removeEventNode = function (node) {
    if (node)
        this.remove(node);
};

MusicManager.prototype.findEventNode = function (eventID) {
    for (var i = 0; i < this.length; i++) {
        var node = this.at(i);
        if (node instanceof EventNode && node.eventID === eventID)
            return node;
    }
    return null;
};

MusicManager.prototype.resetEventNodes = function () {
    for (var i = 0; i < this.length; i++) {
        var node = this.at(i);
        if (node instanceof EventNode)
            node.reset();
    }
};

MusicManager.prototype.clearEventNodes = function () {
    for (var i = this.length - 1; i >= 0; i--) {
        var node = this.at(i);
        if (node instanceof EventNode)
            this.remove(node);
    }
};

MusicManager.prototype.roomKey = function (levelIndex, roomIndex) {
    return levelIndex + ":" + roomIndex;
};

// nodes is an optional array of { id, start, end, rhythm, action } applied when the song starts.
MusicManager.prototype.setRoomSong = function (levelIndex, roomIndex, sound, looping, nodes) {
    this.roomSongs[this.roomKey(levelIndex, roomIndex)] = {
        sound: sound,
        looping: typeof looping !== 'undefined' ? looping : true,
        nodes: nodes || []
    };
};

MusicManager.prototype.setDefaultSong = function (sound, looping, nodes) {
    this.defaultSong = {
        sound: sound,
        looping: typeof looping !== 'undefined' ? looping : true,
        nodes: nodes || []
    };
};

MusicManager.prototype.getRoomSong = function (levelIndex, roomIndex) {
    var entry = this.roomSongs[this.roomKey(levelIndex, roomIndex)];
    return entry ? entry : this.defaultSong;
};

// Starts the room's song, or keeps the current one playing if the room uses the same track.
MusicManager.prototype.playForRoom = function (levelIndex, roomIndex) {
    var entry = this.getRoomSong(levelIndex, roomIndex);
    if (!entry || !entry.sound) {
        this.stop();
        this.clearEventNodes();
        return null;
    }
    if (entry.sound === this._currentSource && this.playing)
        return entry;

    this.clearEventNodes();
    this.playSong(entry.sound, entry.looping);
    for (var i = 0; i < entry.nodes.length; i++) {
        var config = entry.nodes[i];
        if (config instanceof EventNode)
            this.addEventNode(config);
        else if (config)
            this.addEventNode(config.id, config.start, config.end, config.rhythm, config.action);
    }
    return entry;
};

// Listens to every node; a per-node listener can be added with node.addListener instead.
MusicManager.prototype.addBeatListener = function (listener) {
    if (listener && this.beatListeners.indexOf(listener) < 0)
        this.beatListeners.push(listener);
    return listener;
};

MusicManager.prototype.removeBeatListener = function (listener) {
    var index = this.beatListeners.indexOf(listener);
    if (index >= 0)
        this.beatListeners.splice(index, 1);
};

// Lets objects poll instead of subscribing: true only on the frame the beat fired.
MusicManager.prototype.justTriggered = function (eventID) {
    var node = this.findEventNode(eventID);
    return node !== null && node.triggeredThisFrame;
};

MusicManager.prototype.subscribe = function (eventID, listener) {
    var node = this.findEventNode(eventID);
    if (node === null)
        return null;
    return node.addListener(listener);
};

MusicManager.prototype._notifyBeat = function (node, beat, songTime) {
    for (var i = 0; i < this.beatListeners.length; i++) {
        var listener = this.beatListeners[i];
        if (typeof listener === "function")
            listener(node, beat, songTime);
        else if (typeof listener.onBeat === "function")
            listener.onBeat(beat, songTime, node);
    }
};

MusicManager.prototype.update = function (delta) {
    if (this.currentSong !== null && this.currentSong.snd !== null)
        this.songTime = this.currentSong.snd.currentTime;
    else
        this.songTime = 0;

    if (this.songTime < this._previousSongTime) // the song looped back to the start
        this.resetEventNodes();
    this._previousSongTime = this.songTime;

    for (var i = 0; i < this.length; i++) {
        var node = this.at(i);
        if (!(node instanceof EventNode)) {
            node.update(delta);
            continue;
        }
        node.updateToTime(this.songTime);
        if (node.triggeredThisFrame)
            this._notifyBeat(node, node.beat, this.songTime);
    }
};

powerupjs.MusicManager = MusicManager;