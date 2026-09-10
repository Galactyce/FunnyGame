function EventNode(id, start, end, rhythm, action) {
    powerupjs.GameObject.call(this);
    this.eventID = id;
    this.startTime = start;
    this.endTime = end;
    this.rhythm = typeof rhythm !== 'undefined' ? rhythm : 0;
    this.action = typeof action !== 'undefined' ? action : null;
    this.active = false;
    this.beat = -1;
    this.listeners = [];
    this.triggeredThisFrame = false;
}

EventNode.prototype = Object.create(powerupjs.GameObject.prototype);

EventNode.prototype.reset = function () {
    powerupjs.GameObject.prototype.reset.call(this);
    this.active = false;
    this.beat = -1;
    this.triggeredThisFrame = false;
};

// A listener is either a function or an object with an onBeat(beat, songTime, node) method.
EventNode.prototype.addListener = function (listener) {
    if (listener && this.listeners.indexOf(listener) < 0)
        this.listeners.push(listener);
    return listener;
};

EventNode.prototype.removeListener = function (listener) {
    var index = this.listeners.indexOf(listener);
    if (index >= 0)
        this.listeners.splice(index, 1);
};

EventNode.prototype.trigger = function (beat, songTime) {
    this.triggeredThisFrame = true;
    if (this.action !== null)
        this.action.call(this, beat, songTime);
    for (var i = 0; i < this.listeners.length; i++) {
        var listener = this.listeners[i];
        if (typeof listener === "function")
            listener(beat, songTime, this);
        else if (typeof listener.onBeat === "function")
            listener.onBeat(beat, songTime, this);
    }
};

// Driven by MusicManager with the song's playback time instead of the frame delta,
// so triggers stay locked to the audio rather than the frame rate.
EventNode.prototype.updateToTime = function (songTime) {
    this.triggeredThisFrame = false;

    if (songTime < this.startTime || songTime > this.endTime) {
        this.active = false;
        this.beat = -1;
        return;
    }

    this.active = true;

    if (this.rhythm <= 0) {
        if (this.beat < 0) {
            this.beat = 0;
            this.trigger(0, songTime);
        }
        return;
    }

    var beat = Math.floor((songTime - this.startTime) / this.rhythm);
    while (this.beat < beat) {
        this.beat += 1;
        this.trigger(this.beat, songTime);
    }
};

EventNode.prototype.update = function (delta) {
    powerupjs.GameObject.prototype.update.call(this, delta);
};

powerupjs.EventNode = EventNode;
