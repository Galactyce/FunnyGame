function TravelPointTile(sprite) {
    Tile.call(this, sprite || sprites.warp);
    this.isTravelPointTile = true;
    this.travelPointID = 0;
    this.targetID = 0;
    this.lastClickTime = 0;
    this.doubleClickWindowMs = 300;
    this.IDLabel = new powerupjs.Label("Arial", "12px", ID.layer_overlays, 0, powerupjs.Color.white);
    this.hitboxType = "void";
}

TravelPointTile.prototype = Object.create(Tile.prototype);

TravelPointTile.prototype.manageHitboxes = function(sprite) {
    Tile.prototype.manageHitboxes.call(this, sprite);
    this.hitbox = this.boundingBox;
    this.hitboxType = "void";
}

TravelPointTile.prototype.handleInput = function(delta) {
    if (WorldSettings.currentState !== "editing") return;
    var editorState = powerupjs.GameStateManager.get(ID.game_state_editor);
    if (!editorState || editorState.mode !== "Editing") return;
    if (!powerupjs.Mouse.left.pressed) return;
    if (!this.boundingBox || !this.boundingBox.contains(powerupjs.Mouse.position)) return;

    var now = Date.now();
    if (now - this.lastClickTime > this.doubleClickWindowMs) {
        this.lastClickTime = now;
        return;
    }

    this.lastClickTime = 0;
    var input = prompt("Enter target travel point ID:", this.targetID > 0 ? String(this.targetID) : "");
    if (input === null) return;

    var nextTargetId = parseInt(input, 10);
    if (isNaN(nextTargetId) || nextTargetId < 0) return;

    this.targetID = nextTargetId;
    this.applyTargetToConnectedTiles();
}

TravelPointTile.prototype.applyTargetToConnectedTiles = function() {
    var field = this.parent;
    if (!field || typeof field.getTileAtIndex !== "function" || !this.index) return;

    var queue = [this];
    var visited = {};
    var target = this.targetID;

    while (queue.length > 0) {
        var tile = queue.shift();
        if (!tile || !tile.isTravelPointTile || !tile.index) continue;

        var key = field.getIndexKey(tile.index);
        if (!key || visited[key]) continue;
        visited[key] = true;
        tile.targetID = target;

        var neighbors = [
            new powerupjs.Vector2(tile.index.x - 1, tile.index.y),
            new powerupjs.Vector2(tile.index.x + 1, tile.index.y),
            new powerupjs.Vector2(tile.index.x, tile.index.y - 1),
            new powerupjs.Vector2(tile.index.x, tile.index.y + 1)
        ];

        for (var i = 0; i < neighbors.length; i++) {
            var neighbor = field.getTileAtIndex(neighbors[i]);
            if (neighbor && neighbor.isTravelPointTile) queue.push(neighbor);
        }
    }
}

TravelPointTile.prototype.draw = function() {
    Tile.prototype.draw.call(this);

    if (WorldSettings.currentState !== "editing") return;
    this.IDLabel.text = this.travelPointID + " -> " + this.targetID;
    this.IDLabel.position = new powerupjs.Vector2(this.screenPosition.x - 18, this.screenPosition.y - 24);
    this.IDLabel.draw();
}
