function GameplayEditorState(layer) {
    powerupjs.GameObjectList.call(this, layer);
    this.levelEditing;
    this.currentEditorLayer = 0;
    this.selectedBlock;
    this.previousMousePosition = powerupjs.Vector2.zero;
    this.mode = "Drawing";
    this.drawingRect = new powerupjs.Rectangle(100, 100, powerupjs.Game.size.x - 100, powerupjs.Game.size.y - 100); // area where tiles can be placed

    this.editorLayers = new powerupjs.GameObjectList(); // list of tile fields for editing
    var field = new TileField(); // create new tile field
    field.editorLayer = 0; // set layer index
    this.editorLayers.add(field); // add tile field to editor layers
    this.add(this.editorLayers);

    this.objectMenu = new ObjectMenuGUI(); // object selection menu
    this.objectMenu.position = new powerupjs.Vector2(400, 600);
    this.add(this.objectMenu);

    this.playButton = new LabelledButton(sprites.button_default, "Return", "Arial", "20px", ID.layer_overlays); // button to return to title screen
    this.playButton.position = new powerupjs.Vector2(900, 15);
    this.playButton.ui = true;
    this.add(this.playButton);

    this.modeButton = new LabelledButton(sprites.button_default, this.mode, "Arial", "20px", ID.layer_overlays); // button to switch between drawing and erasing modes
    this.modeButton.ui = true;
    this.modeButton.position = new powerupjs.Vector2(200, 700);
    this.add(this.modeButton);

    this.playerStartPos = new DraggableObject(sprites.portal, ID.layer_overlays_2, ID.player_spawn); // draggable player start position marker
    this.playerStartPos.position = new powerupjs.Vector2(400, 400);
    this.add(this.playerStartPos);
}

GameplayEditorState.prototype = Object.create(powerupjs.GameObjectList.prototype);

GameplayEditorState.prototype.loadLayers = function () {
    for (var i = 0; i < this.editorLayers.length; i++) {
        this.editorLayers.at(i).loadTiles(); // load tiles for each editor layer
    }
}

GameplayEditorState.prototype.handleInput = function (delta) {
    powerupjs.GameObjectList.prototype.handleInput.call(this, delta)
    this.drawingRect.draw();

    if (powerupjs.Keyboard.pressed(powerupjs.Keys.S)) {
        this.editorLayers.at(this.currentEditorLayer).saveTiles(); // save current editor layer tiles
    }
    if (powerupjs.Keyboard.pressed(powerupjs.Keys.P)) {
        if (confirm("Clear all Tiles?")) this.editorLayers.at(this.currentEditorLayer).clear(); // clear current editor layer

    }

    if (this.playButton.pressed) {
        powerupjs.GameStateManager.switchTo(ID.game_state_title); // return to title screen
        powerupjs.Camera.position = powerupjs.Vector2.zero; // reset camera position
        return
    }
    if (this.modeButton.pressed) { // check if mode button is pressed
        if (this.mode == "Drawing") { // toggle mode
            this.mode = "Erasing";
        }
        else if (this.mode == "Erasing") {
            this.mode = "Drawing"
        }
        this.modeButton.text = this.mode; // update button text
        return;
    }
    if (powerupjs.Mouse.left.pressed) { // check if left mouse button is pressed
        if (this.mode == "Drawing") {
            var field = this.editorLayers.at(this.currentEditorLayer) // get current editor layer
            field.addTileAt(field.getTileByMouse(powerupjs.Mouse.position), "#", WorldSettings.currentBlock); // add tile at mouse position
        }
        else if (this.mode == "Erasing") {
            var field = this.editorLayers.at(this.currentEditorLayer) // get current editor layer
            field.removeTileAt(field.getTileByMouse(powerupjs.Mouse.position)); // remove tile at mouse position
        }
    }

    if (powerupjs.Mouse.middle.down) { // pan camera with middle mouse button
        powerupjs.Camera.position.addTo(
            powerupjs.Mouse.screenPosition.subtractFrom(this.previousMousePosition).multiplyWith(-1) // move camera opposite to mouse movement
        );
    }
    this.previousMousePosition = powerupjs.Mouse.screenPosition.copy(); // store current mouse position for next frame
}

GameplayEditorState.prototype.update = function (delta) {
    powerupjs.GameObjectList.prototype.update.call(this, delta);

}
