function Level() {
    powerupjs.GameObjectList.call(this);
    // Level contains a list of rooms and tracks the active room index.
    this.rooms = new powerupjs.GameObjectList();
    this.currentRoomIndex = 0;

    // Keep one default room so existing flows always have an active room.
    this.rooms.add(new Room(0));
    this.name;
    // Add rooms list as a child so draw/update/input flow remains list-driven.
    this.add(this.rooms)
    this.travelPoints = []; // array to hold level-wide travel points

}

Level.prototype = Object.create(powerupjs.GameObjectList.prototype);

Level.prototype.wellFormed = function() {
    return powerupjs.GameObjectList.prototype.wellFormed.call(this) &&
        this.rooms && this.rooms.length > 0 &&
        this.currentRoomIndex >= 0 && this.currentRoomIndex < this.rooms.length;
};

Level.prototype.wellFormedAssertions = function() {
    var valid = this.wellFormed();
    if (typeof console !== "undefined" && typeof console.assert === "function") {
        console.assert(valid, "Level is not well-formed");
    }
    return valid;
};

Level.prototype.addRoom = function(room) {
    var roomToAdd = room || new Room(this.rooms.length);
    if (typeof roomToAdd.roomID !== "number") roomToAdd.roomID = this.rooms.length;
    this.rooms.add(roomToAdd);
    return roomToAdd;
}

Level.prototype.collectTravelPoints = function() {
    this.travelPoints = [];
    for (var r = 0; r < this.rooms.length; r++) {
        var room = this.rooms.at(r);
        if (!room || !Array.isArray(room.travelPoints)) continue;
        for (var t = 0; t < room.travelPoints.length; t++) {
            var point = room.travelPoints[t];
            if (!point) continue;
            this.travelPoints.push(point);
        }
    }
}

Level.prototype.getNextTravelPointId = function() {
    this.collectTravelPoints();
    var maxId = 0;
    for (var i = 0; i < this.travelPoints.length; i++) {
        var point = this.travelPoints[i];
        if (!point || typeof point.id !== 'number') continue;
        if (point.id > maxId) maxId = point.id;
    }
    return maxId + 1;
}

Level.prototype.linkTravelPoints = function() {
    this.collectTravelPoints();
    for (var i = 0; i < this.travelPoints.length; i++) {
        var travelPoint = this.travelPoints[i];
        travelPoint.targetTravelPoint = null;
        if (travelPoint.targetID > 0) {
            var targetTravelPoint = this.travelPoints.find(tp => tp.id === travelPoint.targetID);
            if (targetTravelPoint && targetTravelPoint !== travelPoint) {
                travelPoint.targetTravelPoint = targetTravelPoint;
            }
        }
    }
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
            this.rooms.add(new Room(0));
            this.currentRoomIndex = 0;
        }

        if (this.currentRoomIndex < 0 || this.currentRoomIndex >= this.rooms.length) {
            this.currentRoomIndex = 0;
        }
        return this.rooms.at(this.currentRoomIndex);
    },
    set: function(value) {
        var roomValue = value || new Room(this.currentRoomIndex);
        if (typeof roomValue.roomID !== "number") roomValue.roomID = this.currentRoomIndex;
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
