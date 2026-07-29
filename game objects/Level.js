function Level() {
    powerupjs.GameObjectList.call(this);
    // Level contains a list of rooms and tracks the active room index.
    this.rooms = new powerupjs.GameObjectList();
    this.currentRoomIndex = 0;

    // Keep one default room so existing flows always have an active room.
    this.rooms.add(new Room());
    this.name;
    // Add rooms list as a child so draw/update/input flow remains list-driven.
    this.add(this.rooms)
}

Level.prototype = Object.create(powerupjs.GameObjectList.prototype);

Level.prototype.addRoom = function(room) {
    var roomToAdd = room || new Room();
    this.rooms.add(roomToAdd);
    return roomToAdd;
}

Level.prototype.indexOfRoom = function(room) {
    for (var i = 0; i < this.rooms.length; i++) {
        if (this.rooms.at(i) === room) return i;
    }
    return -1;
}

Level.prototype.switchToRoom = function(roomIndex) {
    if (roomIndex < 0 || roomIndex >= this.rooms.length) return;
    this.currentRoomIndex = roomIndex;
    var currentRoom = this.room;
    currentRoom.loadBackground();
    currentRoom.loadTiles();
}

Level.prototype.removeRoom = function(room) {
    if (!room) return;
    this.rooms.remove(room);
}

Object.defineProperty(Level.prototype, "room", {
    get: function() {
        if (this.rooms.length === 0) {
            this.rooms.add(new Room());
            this.currentRoomIndex = 0;
        }

        if (this.currentRoomIndex < 0 || this.currentRoomIndex >= this.rooms.length) {
            this.currentRoomIndex = 0;
        }
        return this.rooms.at(this.currentRoomIndex);
    },
    set: function(value) {
        var roomValue = value || new Room();
        var existingIndex = this.indexOfRoom(roomValue);
        if (existingIndex >= 0) {
            this.currentRoomIndex = existingIndex;
            return;
        }
        if (this.rooms.length === 0) {
            this.rooms.add(roomValue);
            this.currentRoomIndex = 0;
            return;
        }
        this.rooms._gameObjects[this.currentRoomIndex] = roomValue;
        roomValue.parent = this.rooms;
    }
});

Level.prototype.update = function(delta) {
    // The room receives update through GameObjectList traversal.
    // This method intentionally remains light to preserve old call sites.
    powerupjs.GameObjectList.prototype.update.call(this, delta)
}
