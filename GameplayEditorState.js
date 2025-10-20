function GameplayEditorState(layer) {
    powerupjs.GameObjectList.call(this, layer);
    this.levelEditing;
    this.currentEditorLayer = 0;
    this.selectedBlock;
    this.mode = "Drawing";
    this.drawingRect = new powerupjs.Rectangle(100, 100, powerupjs.Game.size.x - 100, powerupjs.Game.size.y - 100);

    this.editorLayers = new powerupjs.GameObjectList();
    var field = new TileField();
    field.editorLayer = 0;
    this.editorLayers.add(field);
    this.add(this.editorLayers);

    this.objectMenu = new ObjectMenuGUI();
    this.objectMenu.position = new powerupjs.Vector2(400, 600);
    this.add(this.objectMenu);

    this.playButton = new LabelledButton(sprites.button_default, "Return", "Arial", "20px", ID.layer_overlays);
    this.playButton.position = new powerupjs.Vector2(900, 15);
    this.add(this.playButton);

    this.modeButton = new LabelledButton(sprites.button_default, this.mode, "Arial", "20px", ID.layer_overlays);
    this.modeButton.position = new powerupjs.Vector2(200, 700);
    this.add(this.modeButton);

    this.playerStartPos = new DraggableObject(sprites.portal, ID.layer_overlays_2, ID.player_spawn);
    this.playerStartPos.position = new powerupjs.Vector2(400, 400);
    this.add(this.playerStartPos);
}

GameplayEditorState.prototype = Object.create(powerupjs.GameObjectList.prototype);

GameplayEditorState.prototype.loadLayers = function() {
    for (var i = 0; i < this.editorLayers.length; i++) {
        this.editorLayers.at(i).loadTiles();
    }
}

GameplayEditorState.prototype.handleInput = function(delta) {
    powerupjs.GameObjectList.prototype.handleInput.call(this, delta)
    this.drawingRect.draw();
    
    if (powerupjs.Keyboard.down(powerupjs.Keys.down)) {
        powerupjs.Camera.position.y -= delta * this.panSpeed;
        this.moving = true;
    }
    if (powerupjs.Keyboard.down(powerupjs.Keys.up)) {
        powerupjs.Camera.position.y += delta * this.panSpeed;
        this.moving = true;
    }
    if (powerupjs.Keyboard.down(powerupjs.Keys.left)) {
        powerupjs.Camera.position.x += delta * this.panSpeed;
        this.moving = true;
    }
    if (powerupjs.Keyboard.down(powerupjs.Keys.right)) {
        powerupjs.Camera.position.x -= delta * this.panSpeed;
        this.moving = true;
    }
    if (!powerupjs.Keyboard.down(powerupjs.Keys.right) &&
        !powerupjs.Keyboard.down(powerupjs.Keys.left) &&
        !powerupjs.Keyboard.down(powerupjs.Keys.up) &&
        !powerupjs.Keyboard.down(powerupjs.Keys.down)) {
        this.moving = false;
    }

    if (powerupjs.Keyboard.pressed(powerupjs.Keys.S)) {
        this.editorLayers.at(this.currentEditorLayer).saveTiles();
    }
    if (powerupjs.Keyboard.pressed(powerupjs.Keys.P)) {
        if (confirm("Clear all Tiles?")) this.editorLayers.at(this.currentEditorLayer).clear();
        
    }

    if (this.playButton.pressed) {
        powerupjs.GameStateManager.switchTo(ID.game_state_title);
        return
    }
    if (this.modeButton.pressed) {
        if (this.mode == "Drawing") {
            this.mode = "Erasing";
        }
        else if (this.mode == "Erasing") {
            this.mode = "Drawing"
        }
        this.modeButton.text = this.mode;
        return;
    }
    if (powerupjs.Mouse.left.pressed) {
        if (this.mode == "Drawing") {
            var field = this.editorLayers.at(this.currentEditorLayer)
            field.addTileAt(field.getTileByMouse(powerupjs.Mouse.position), "#", WorldSettings.currentBlock);
        }
        else if (this.mode == "Erasing") {
            var field = this.editorLayers.at(this.currentEditorLayer)
            field.removeTileAt(field.getTileByMouse(powerupjs.Mouse.position));
        }
    }

    if (this.moving) this.panSpeed += delta * 15;
    else this.panSpeed = 35;

}

GameplayEditorState.prototype.update = function(delta) {
    powerupjs.GameObjectList.prototype.update.call(this, delta);
  
}