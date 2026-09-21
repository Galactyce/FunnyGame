// Editor menu for choosing a room's song and editing its rhythm event nodes.
function MusicMenuGUI(layer) {
    powerupjs.GameObjectList.call(this, typeof layer !== 'undefined' ? layer : ID.layer_overlays);

    this.menu = new MenuObject(600, 180, "Music");
    this.add(this.menu);

    this.songText = this.menu.createTextObject("Song:", 30, 62, "Pixel", "18px", powerupjs.Color.white);
    this.nodeText = this.menu.createTextObject("Node:", 30, 88, "Pixel", "18px", powerupjs.Color.white);

    this.songButton = this.menu.createButton("Song", 70, 130);
    this.addNodeButton = this.menu.createButton("Add", 170, 130);
    this.editNodeButton = this.menu.createButton("Edit", 270, 130);
    this.deleteNodeButton = this.menu.createButton("Delete", 370, 130);

    this.previousNodeButton = this.menu.createButton(null, 450, 120, sprites.arrowButtons);
    this.previousNodeButton.sheetIndex = 0;
    this.nextNodeButton = this.menu.createButton(null, 500, 120, sprites.arrowButtons);
    this.nextNodeButton.sheetIndex = 1;

    this.menu.addCloseButton(new powerupjs.Vector2(565, 7));

    this.selectedNodeIndex = 0;
}

MusicMenuGUI.prototype = Object.create(powerupjs.GameObjectList.prototype);


MusicMenuGUI.prototype.getRoom = function () {
    var level = WorldSettings.currentLevel;
    return level ? level.room : null;
};

MusicMenuGUI.prototype.getNodes = function () {
    var room = this.getRoom();
    if (!room) return [];
    if (!Array.isArray(room.eventNodes)) room.eventNodes = [];
    return room.eventNodes;
};

MusicMenuGUI.prototype.getSelectedNode = function () {
    var nodes = this.getNodes();
    if (this.selectedNodeIndex < 0 || this.selectedNodeIndex >= nodes.length) return null;
    return nodes[this.selectedNodeIndex];
};

// Uses prompts, matching how travel point IDs are already entered in the editor.
MusicMenuGUI.prototype.promptForNode = function (existing) {
    var source = existing || { id: "attack", start: 0, end: 999, rhythm: 1 };

    var id = prompt("Event node ID (used by enemy attacks):", source.id);
    if (id === null) return null;

    var start = parseFloat(prompt("Start time in seconds:", source.start));
    if (isNaN(start)) return null;

    var end = parseFloat(prompt("End time in seconds:", source.end));
    if (isNaN(end)) return null;

    var rhythm = parseFloat(prompt("Seconds between triggers (0 = fire once):", source.rhythm));
    if (isNaN(rhythm)) return null;

    return { id: String(id), start: start, end: end, rhythm: rhythm };
};

MusicMenuGUI.prototype.handleInput = function (delta) {
    powerupjs.GameObjectList.prototype.handleInput.call(this, delta);
    if (!this.visible) return;

    var room = this.getRoom();
    if (!room) return;
    var nodes = this.getNodes();

    if (this.menu.boundingBox.contains(powerupjs.Mouse.screenPosition) && this.parent) {
        this.parent.editingTiles = false; // stop tile placement while the menu is in the way
    }

    if (this.songButton.pressed) {
        var songKeys = Object.keys(sounds);
        var song = prompt("Song key from sounds:\n" + songKeys.join(", "), room.song || "");
        if (song !== null) room.song = song.trim();
    }

    if (this.addNodeButton.pressed) {
        var newNode = this.promptForNode(null);
        if (newNode) {
            nodes.push(newNode);
            this.selectedNodeIndex = nodes.length - 1;
        }
    }

    if (this.editNodeButton.pressed) {
        var selected = this.getSelectedNode();
        if (selected) {
            var edited = this.promptForNode(selected);
            if (edited) nodes[this.selectedNodeIndex] = edited;
        }
    }

    if (this.deleteNodeButton.pressed && nodes.length > 0) {
        nodes.splice(this.selectedNodeIndex, 1);
        if (this.selectedNodeIndex >= nodes.length) this.selectedNodeIndex = nodes.length - 1;
    }

    if (this.previousNodeButton.pressed && nodes.length > 0) {
        this.selectedNodeIndex = (this.selectedNodeIndex - 1 + nodes.length) % nodes.length;
    }

    if (this.nextNodeButton.pressed && nodes.length > 0) {
        this.selectedNodeIndex = (this.selectedNodeIndex + 1) % nodes.length;
    }
};

MusicMenuGUI.prototype.update = function (delta) {
    powerupjs.GameObjectList.prototype.update.call(this, delta);

    var room = this.getRoom();
    if (!room) return;
    var nodes = this.getNodes();
    if (this.selectedNodeIndex < 0) this.selectedNodeIndex = 0;

    this.songText.text = "Song: " + (room.song ? room.song : "(none)");

    var node = this.getSelectedNode();
    if (!node) {
        this.nodeText.text = "Event nodes: none";
        return;
    }
    this.nodeText.text = "Node " + (this.selectedNodeIndex + 1) + "/" + nodes.length +
        "  id: " + node.id + "  " + node.start + "s-" + node.end + "s  every " + node.rhythm + "s";
};
