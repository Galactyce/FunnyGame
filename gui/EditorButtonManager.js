function EditorButtonManager(editorState) {
  this.editorState = editorState;
  this.modeButtons = editorState.modeButtons;
  this.nextRoomButton = editorState.nextRoomButton;
  this.previousRoomButton = editorState.previousRoomButton;
  this.addRoomButton = editorState.addRoomButton;

  this.saveButton = new powerupjs.Button(
    sprites.window_ui.buttons.default,
    0,
    0,
    sprites.window_ui.buttons.hover,
  );
  this.saveButton.position = new powerupjs.Vector2(40, 40);
  this.saveButton.ui = true;
  this.saveButton.sheetIndex = 12;
  this.saveButton.scale = 1.5;
  editorState.add(this.saveButton);
  this.saveTextTimer = new powerupjs.Timer(7);
  this.saveText = new powerupjs.Label(
    "Pixel",
    "20px",
    ID.layer_overlays,
    0,
    "white",
  );
  this.saveText.text = "";
  this.saveText.visible = false;
  this.saveText.reset = function () {
    this._visible = false; // stay hidden across state resets until a save happens
  };
  this.saveText.position = new powerupjs.Vector2(30, 85);
  this.saveText.ui = true;
  editorState.add(this.saveText);

  this.playButton = new powerupjs.Button(
    sprites.window_ui.buttons.default,
    ID.layer_overlays,
    0,
    sprites.window_ui.buttons.hover,
  );
  this.playButton.position = new powerupjs.Vector2(140, 40);
  this.playButton.scale = 1.5;
  this.playButton.sheetIndex = 10;
  this.playButton.ui = true;
  editorState.add(this.playButton);

  this.swipeCheckBox = new CheckBox("Swipe", ID.layer_overlays);
  this.swipeCheckBox.position = new powerupjs.Vector2(120, 90);
  this.swipeCheckBox.ui = true;
  editorState.add(this.swipeCheckBox);

  this.nextLayerButton = new powerupjs.Button(
    sprites.window_ui.buttons.default,
    ID.layer_overlays,
    0,
    sprites.window_ui.buttons.hover,
  );

  this.nextLayerButton.sheetIndex = 2;
  this.nextLayerButton.ui = true;
  editorState.add(this.nextLayerButton);

  this.previousLayerButton = new powerupjs.Button(
    sprites.window_ui.buttons.default,
    ID.layer_overlays,
    0,
    sprites.window_ui.buttons.hover,
  );
  this.previousLayerButton.position = new powerupjs.Vector2(50, 140);
  this.previousLayerButton.sheetIndex = 1;
  this.previousLayerButton.ui = true;
  editorState.add(this.previousLayerButton);

  this.musicButton = new powerupjs.Button(
    sprites.window_ui.buttons.default,
    ID.layer_overlays,
    0,
    sprites.window_ui.buttons.hover,
  );
  this.musicButton.position = new powerupjs.Vector2(90, 40);
  this.musicButton.scale = 1.5;
  this.musicButton.sheetIndex = 11;
  this.musicButton.ui = true;
  editorState.add(this.musicButton);

  this.drawingButton = new powerupjs.Button(
    sprites.window_ui.buttons.default,
    ID.layer_overlays,
    0,
    sprites.window_ui.buttons.hover,
  );
  this.drawingButton.position = new powerupjs.Vector2(190, 40);
  this.drawingButton.scale = 1.5;
  this.drawingButton.sheetIndex = 8;
  this.drawingButton.ui = true;
  editorState.add(this.drawingButton);

  this.editingButton = new powerupjs.Button(
    sprites.window_ui.buttons.default,
    ID.layer_overlays,
    0,
    sprites.window_ui.buttons.hover,
  );
  this.editingButton.position = new powerupjs.Vector2(240, 40);
  this.editingButton.scale = 1.5;
  this.editingButton.sheetIndex = 7;
  this.editingButton.ui = true;
  editorState.add(this.editingButton);

  this.removeButton = new powerupjs.Button(
    sprites.window_ui.buttons.default,
    ID.layer_overlays,
    0,
    sprites.window_ui.buttons.hover,
  );
  this.removeButton.position = new powerupjs.Vector2(290, 40);
  this.removeButton.scale = 1.5;
  this.removeButton.sheetIndex = 9;
  this.removeButton.ui = true;
  editorState.add(this.removeButton);

  editorState.menuManager.musicButton = this.musicButton;
}

EditorButtonManager.prototype.handleInput = function () {
  // this.handleModeButtons();
  this.handleDrawingButton();
  this.handleEditingButton();
  this.handleRemoveButton();
  this.handleRoomButtons();
  this.handleSessionButtons();
  this.handleLayerButtons();
  this.handleMusicButton();
  this.editorState.swiping = this.swipeCheckBox.checked;
};

EditorButtonManager.prototype.update = function (delta) {
  if (this.saveText.visible) {
    this.saveTextTimer.update(delta);
    this.saveText.text = "Saved!";
    if (this.saveTextTimer.isFinished()) {
      this.saveText.visible = false;
    }
  }
};

EditorButtonManager.prototype.closeOtherMenus = function (exceptWrapper) {
  var objectMenu = this.editorState.menuManager.objectMenu;
  var editingMenu = this.editorState.menuManager.editingMenu;
  if (objectMenu !== exceptWrapper && objectMenu.menu.isOpen) objectMenu.menu.close();
  if (editingMenu !== exceptWrapper && editingMenu.menu.isOpen) editingMenu.menu.close();
};

EditorButtonManager.prototype.toggleMenu = function (wrapperGui, modeName) {
  this.closeOtherMenus(wrapperGui); // drawing, editing, and removing are mutually exclusive
  wrapperGui.menu.toggle();
  if (wrapperGui.menu.isOpen) {
    this.editorState.bringToFront(wrapperGui); // ensure it draws above any other open menu
    this.editorState.setMode(modeName);
  } else if (this.editorState.mode === modeName) {
    this.editorState.setMode("Drawing");
  }
};

EditorButtonManager.prototype.handleDrawingButton = function () {
  if (this.drawingButton && this.drawingButton.pressed) {
    this.toggleMenu(this.editorState.menuManager.objectMenu, "Drawing");
  }
};

EditorButtonManager.prototype.handleMusicButton = function () {
  if (this.musicButton && this.musicButton.pressed) {
    this.editorState.menuManager.musicMenu.menu.toggle();
    if (this.editorState.menuManager.musicMenu.menu.isOpen) {
      this.editorState.bringToFront(this.editorState.menuManager.musicMenu);
    }
  }
};

// EditorButtonManager.prototype.handleModeButtons = function () {
//     if (!this.modeButtons || !this.modeButtons.length) return;
//     for (var i = 0; i < this.modeButtons.length; i++) {
//         var modeButton = this.modeButtons.at(i);
//         if (modeButton && modeButton.pressed) {
//             this.editorState.mode = this.editorState.modes[i];
//         }
//     }
// };

EditorButtonManager.prototype.handleEditingButton = function () {
  if (this.editingButton && this.editingButton.pressed) {
    this.toggleMenu(this.editorState.menuManager.editingMenu, "Editing");
  }
};

EditorButtonManager.prototype.handleRemoveButton = function () {
  if (this.removeButton && this.removeButton.pressed) {
    this.closeOtherMenus(null); // remove mode has no menu of its own, so close both
    if (this.editorState.mode === "Erasing") {
      this.editorState.setMode("Drawing"); // pressing again cancels remove mode
    } else {
      this.editorState.setMode("Erasing"); // subsequent world clicks remove tiles until another mode/menu is chosen
    }
  }
};

EditorButtonManager.prototype.handleRoomButtons = function () {
  if (this.addRoomButton && this.addRoomButton.pressed) {
    WorldSettings.currentLevel.addRoom();
    WorldSettings.currentLevel.currentRoomIndex =
      WorldSettings.currentLevel.rooms.length - 1;
    var roomData = this.editorState.getActiveRoomData();
    if (
      !Array.isArray(roomData.backgrounds) ||
      roomData.backgrounds.length === 0
    ) {
      roomData.backgrounds = [0, 1];
    }
    WorldSettings.currentLevel.room.loadBackground();
    this.editorState.loadLayers();
  }

  if (this.nextRoomButton && this.nextRoomButton.pressed) {
    var nextRoomIndex =
      (WorldSettings.currentLevel.currentRoomIndex + 1) %
      WorldSettings.currentLevel.rooms.length;
    WorldSettings.currentLevel.currentRoomIndex = nextRoomIndex;
    this.editorState.getActiveRoomData();
    WorldSettings.currentLevel.room.loadBackground();
    this.editorState.loadLayers();
  }

  if (this.previousRoomButton && this.previousRoomButton.pressed) {
    var previousRoomIndex =
      (WorldSettings.currentLevel.currentRoomIndex -
        1 +
        WorldSettings.currentLevel.rooms.length) %
      WorldSettings.currentLevel.rooms.length;
    WorldSettings.currentLevel.currentRoomIndex = previousRoomIndex;
    this.editorState.getActiveRoomData();
    WorldSettings.currentLevel.room.loadBackground();
    this.editorState.loadLayers();
  }
};

EditorButtonManager.prototype.update = function () {
  var label = this.editorState.currentEditorLayerDisplay;
  var nextLayerButtonX = label.position.x + label.width + 15;

  this.nextLayerButton.position = new powerupjs.Vector2(nextLayerButtonX, 140);
};

EditorButtonManager.prototype.handleSessionButtons = function () {
  if (this.saveButton.pressed) {
    this.editorState.saveLevel();
    this.saveTextTimer.reset();
    this.saveText.visible = true;
  }

  if (this.playButton && this.playButton.pressed) {
    powerupjs.GameStateManager.switchTo(ID.game_state_title);
    WorldSettings.currentState = "title";
    powerupjs.Camera.position = powerupjs.Vector2.zero;
  }
};

EditorButtonManager.prototype.handleLayerButtons = function () {
  if (this.nextLayerButton.pressed) {
    this.editorState.currentEditorLayer++;
    if (
      this.editorState.currentEditorLayer >=
      this.editorState.editorLayers.length
    ) {
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
