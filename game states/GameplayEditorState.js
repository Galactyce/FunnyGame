function GameplayEditorState(layer) {
    powerupjs.GameObjectList.call(this, layer);
    this.levelEditing;
    this.currentEditorLayer = 0;
    this.selectedBlock;
    this.previousMousePosition = powerupjs.Vector2.zero;
    this.modes = ["Drawing", "Erasing", "Editing"];
    this.modeButtons = new powerupjs.GameObjectList();
    this.add(this.modeButtons);


    this.editingTiles = true;

    this.editorLayers = new powerupjs.GameObjectList(ID.layer_objects); // list of tile fields for editing
    var field = new TileField(); // create new tile field
    field.editorLayer = 0; // set layer index
    this.editorLayers.add(field); // add tile field to editor layers
    this.add(this.editorLayers);

    this.objectMenu = new ObjectMenuGUI(); // object selection menu
    this.objectMenu.position = new powerupjs.Vector2(400, 600);
    this.add(this.objectMenu);

    this.editingMenu = new EditingMenuGUI(); // editing menu
    this.editingMenu.position = new powerupjs.Vector2(400, 600);
    this.add(this.editingMenu);

    this.playButton = new LabelledButton(sprites.button_default, "Return", "Arial", "20px", ID.layer_overlays); // button to return to title screen
    this.playButton.position = new powerupjs.Vector2(900, 15);
    this.playButton.ui = true;
    this.add(this.playButton);

    this.playerStartPos = new DraggableObject(sprites.portal, ID.layer_overlays_2, ID.player_spawn); // draggable player start position marker
    this.playerStartPos.position = new powerupjs.Vector2(400, 400);
    this.add(this.playerStartPos);

    this.loadModeButtons(); // load mode buttons
}

GameplayEditorState.prototype = Object.create(powerupjs.GameObjectList.prototype);

GameplayEditorState.prototype.loadLayers = function () {
    for (var i = 0; i < this.editorLayers.length; i++) {
        this.editorLayers.at(i).loadTiles(); // load tiles for each editor layer
    }


    
}

GameplayEditorState.prototype.loadModeButtons = function () {
    for (var i = 0; i < this.modes.length; i++) {
        var button = new LabelledButton(sprites.button_default, this.modes[i], "Arial", "20px", ID.layer_overlays); // create button for each mode
        button.position = new powerupjs.Vector2(250, 650 + i * 60);
        button.ui = true;
        this.modeButtons.add(button);
    }

}

GameplayEditorState.prototype.update = function (delta) {
    powerupjs.GameObjectList.prototype.update.call(this, delta);
    if (this.mode =="Drawing") {
        this.objectMenu.visible = true;
        this.editingMenu.visible = false;
    }
    else if (this.mode == "Erasing" || this.mode == "Editing") {
        this.editingMenu.visible = true;
        this.objectMenu.visible = false;
    }
}

GameplayEditorState.prototype.saveLevel = function() {
    for (var i = 0; i < this.editorLayers.length; i++)
        this.editorLayers.at(i).saveTiles(); // save current editor layer tiles

    var str = ""
    str += this.playerStartPos.position.x + "," + this.playerStartPos.position.y
    window.LEVELS[WorldSettings.currentLevelIndex].playerStartPos = str;
    localStorage.levels = JSON.stringify(window.LEVELS); // save to local storage
}

GameplayEditorState.prototype.handleInput = function (delta) {
    powerupjs.GameObjectList.prototype.handleInput.call(this, delta)

    for (var i = 0; i < this.modeButtons.length; i++) {
        var button = this.modeButtons.at(i);
        if (button.pressed) {
            this.mode = this.modes[i];
            return;
        }
    }

    if (powerupjs.Keyboard.pressed(powerupjs.Keys.S)) {
        this.saveLevel()
    }
    if (powerupjs.Keyboard.pressed(powerupjs.Keys.A)) {
        if (confirm("Clear all Tiles?")) this.editorLayers.at(this.currentEditorLayer).clear(); // clear current editor layer

    }

    if (this.playButton.pressed) {
        // if (confirm("Save level before exiting?")) this.saveLevel();
        powerupjs.GameStateManager.switchTo(ID.game_state_title); // return to title screen
        powerupjs.Camera.position = powerupjs.Vector2.zero; // reset camera position
        return
    }
    
    if ((powerupjs.Mouse.left.pressed || (powerupjs.Mouse.left.down && powerupjs.Keyboard.down(powerupjs.Keys.C))) 
            && this.editingTiles) { // check if left mouse button is pressed
        if (this.mode == "Drawing") {
            var field = this.editorLayers.at(this.currentEditorLayer) // get current editor layer
            field.addTileAt(field.getTileByMouse(powerupjs.Mouse.position), "#", WorldSettings.currentBlock); // add tile at mouse position
        }
        else if (this.mode == "Erasing") {
            var field = this.editorLayers.at(this.currentEditorLayer) // get current editor layer
            field.removeTileAt(powerupjs.Mouse.position); // remove tile at mouse position
        }
        else if (this.mode == "Editing") {
            var field = this.editorLayers.at(this.currentEditorLayer) // get current editor layer
            var tile = field.getTileAt(powerupjs.Mouse.position); // get tile at mouse position
            if (tile != null) {
                console.log("Editing tile at " + tile.position);
                this.editingMenu.selectedObj = tile; // set selected object in editing menu
            }
        }
    }

    if (powerupjs.Mouse.middle.down) { // pan camera with middle mouse button
        powerupjs.Camera.position.addTo(
            powerupjs.Mouse.screenPosition.subtractFrom(this.previousMousePosition).multiplyWith(-1) // move camera opposite to mouse movement
        );
    }
    this.previousMousePosition = powerupjs.Mouse.screenPosition.copy(); // store current mouse position for next frame
    this.editingTiles = true;
}


