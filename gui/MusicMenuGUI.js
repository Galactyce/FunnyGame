// Editor menu for choosing a room's song and editing its rhythm event nodes.
function MusicMenuGUI(layer) {
    powerupjs.GameObjectList.call(this, typeof layer !== 'undefined' ? layer : ID.layer_overlays);

    this.frame = new powerupjs.SpriteGameObject(sprites.woodenFrame);
    this.frame.ui = true;
    this.add(this.frame);

    this.songLabel = new powerupjs.Label("Arial", "18px", ID.layer_overlays_2, 0, powerupjs.Color.white);
    this.songLabel.position = new powerupjs.Vector2(30, 15);
    this.songLabel.ui = true;
    this.add(this.songLabel);

    this.nodeLabel = new powerupjs.Label("Arial", "18px", ID.layer_overlays_2, 0, powerupjs.Color.white);
    this.nodeLabel.position = new powerupjs.Vector2(30, 40);
    this.nodeLabel.ui = true;
    this.add(this.nodeLabel);

    this.songButton = this.createButton("Song", 70, 95);
    this.addNodeButton = this.createButton("Add", 170, 95);
    this.editNodeButton = this.createButton("Edit", 270, 95);
    this.deleteNodeButton = this.createButton("Delete", 370, 95);

    this.previousNodeButton = new powerupjs.Button(sprites.arrowButtons, ID.layer_overlays_2);
    this.previousNodeButton.position = new powerupjs.Vector2(450, 85);
    this.previousNodeButton.sheetIndex = 0;
    this.previousNodeButton.scale = 0.6;
    this.previousNodeButton.ui = true;
    this.add(this.previousNodeButton);

    this.nextNodeButton = new powerupjs.Button(sprites.arrowButtons, ID.layer_overlays_2);
    this.nextNodeButton.position = new powerupjs.Vector2(500, 85);
    this.nextNodeButton.sheetIndex = 1;
    this.nextNodeButton.scale = 0.6;
    this.nextNodeButton.ui = true;
    this.add(this.nextNodeButton);

    this.selectedNodeIndex = 0;
}

MusicMenuGUI.prototype = Object.create(powerupjs.GameObjectList.prototype);

MusicMenuGUI.prototype.createButton = function (text, x, y) {
    var button = new LabelledButton(sprites.button_default, text, "Arial", "14px", ID.layer_overlays_2);
    button.position = new powerupjs.Vector2(x, y);
    button.scale = 0.6;
    button.ui = true;
    this.add(button);
    return button;
};

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

    if (this.frame.boundingBox.contains(powerupjs.Mouse.screenPosition) && this.parent) {
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

    this.songLabel.text = "Song: " + (room.song ? room.song : "(none)");

    var node = this.getSelectedNode();
    if (!node) {
        this.nodeLabel.text = "Event nodes: none";
        return;
    }
    this.nodeLabel.text = "Node " + (this.selectedNodeIndex + 1) + "/" + nodes.length +
        "  id: " + node.id + "  " + node.start + "s-" + node.end + "s  every " + node.rhythm + "s";
};
