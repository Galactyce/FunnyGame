function EditorButtonManager(editorState) {
    this.editorState = editorState;
    this.modeButtons = editorState.modeButtons;
    this.nextRoomButton = editorState.nextRoomButton;
    this.previousRoomButton = editorState.previousRoomButton;
    this.addRoomButton = editorState.addRoomButton;
    this.playButton = editorState.playButton;
    this.saveButton = editorState.saveButton;
    this.swipeCheckBox = editorState.swipeCheckBox;
    this.nextLayerButton = editorState.nextLayerButton;
    this.previousLayerButton = editorState.previousLayerButton;
}

EditorButtonManager.prototype.handleInput = function () {
    this.handleModeButtons();
    this.handleRoomButtons();
    this.handleSessionButtons();
    this.handleLayerButtons();
    this.editorState.swiping = this.swipeCheckBox.checked;
};

EditorButtonManager.prototype.handleModeButtons = function () {
    for (var i = 0; i < this.modeButtons.length; i++) {
        if (this.modeButtons.at(i).pressed) {
            this.editorState.mode = this.editorState.modes[i];
        }
    }
};

EditorButtonManager.prototype.handleRoomButtons = function () {
    if (this.addRoomButton.pressed) {
        WorldSettings.currentLevel.addRoom();
        WorldSettings.currentLevel.currentRoomIndex = WorldSettings.currentLevel.rooms.length - 1;
        var roomData = this.editorState.getActiveRoomData();
        if (!Array.isArray(roomData.backgrounds) || roomData.backgrounds.length === 0) {
            roomData.backgrounds = [0, 1];
        }
        WorldSettings.currentLevel.room.loadBackground();
        this.editorState.loadLayers();
    }

    if (this.nextRoomButton.pressed) {
        var nextRoomIndex = (WorldSettings.currentLevel.currentRoomIndex + 1) % WorldSettings.currentLevel.rooms.length;
        WorldSettings.currentLevel.currentRoomIndex = nextRoomIndex;
        this.editorState.getActiveRoomData();
        WorldSettings.currentLevel.room.loadBackground();
        this.editorState.loadLayers();
    }

    if (this.previousRoomButton.pressed) {
        var previousRoomIndex = (WorldSettings.currentLevel.currentRoomIndex - 1 + WorldSettings.currentLevel.rooms.length) % WorldSettings.currentLevel.rooms.length;
        WorldSettings.currentLevel.currentRoomIndex = previousRoomIndex;
        this.editorState.getActiveRoomData();
        WorldSettings.currentLevel.room.loadBackground();
        this.editorState.loadLayers();
    }
};

EditorButtonManager.prototype.handleSessionButtons = function () {
    if (this.saveButton.pressed) {
        this.editorState.saveLevel();
        this.saveButton.text = "Saved!";
    }

    if (this.playButton.pressed) {
        powerupjs.GameStateManager.switchTo(ID.game_state_title);
        WorldSettings.currentState = "title";
        powerupjs.Camera.position = powerupjs.Vector2.zero;
    }
};

EditorButtonManager.prototype.handleLayerButtons = function () {
    if (this.nextLayerButton.pressed) {
        this.editorState.currentEditorLayer++;
        if (this.editorState.currentEditorLayer >= this.editorState.editorLayers.length) {
            var field = new TileField();
            field.editorLayer = this.editorState.currentEditorLayer;
            this.editorState.editorLayers.add(field);
            field.loadTiles();
        }
    }

    if (this.previousLayerButton.pressed) {
        this.editorState.currentEditorLayer--;
        if (this.editorState.currentEditorLayer < 0) {
            this.editorState.currentEditorLayer = 0;
        }
    }
};
