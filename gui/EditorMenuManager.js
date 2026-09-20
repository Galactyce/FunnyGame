function EditorMenuManager(layer) {
    this.layer = typeof layer !== "undefined" ? layer : ID.layer_overlays;
    this.objectMenu = new ObjectMenuGUI(this.layer);
    this.editingMenu = new EditingMenuGUI();
    this.musicMenu = new MusicMenuGUI(this.layer);
    this.musicButton = new LabelledButton(
        sprites.button_default,
        "Music",
        "Arial",
        "20px",
        this.layer,
    );
    this.movePageLeftButton = new powerupjs.Button(sprites.arrowButtons, this.layer);
    this.movePageRightButton = new powerupjs.Button(sprites.arrowButtons, this.layer);

    this.configureLayout();
}

EditorMenuManager.prototype.configureLayout = function () {
    this.objectMenu.position = new powerupjs.Vector2(400, 600);
    this.objectMenu.ui = true;

    this.editingMenu.position = new powerupjs.Vector2(400, 600);

    this.musicMenu.position = new powerupjs.Vector2(400, 600);
    this.musicMenu.visible = false;

    this.musicButton.position = new powerupjs.Vector2(900, 115);
    this.musicButton.ui = true;

    this.movePageLeftButton.position = new powerupjs.Vector2(350, 685);
    this.movePageLeftButton.sheetIndex = 0;
    this.movePageLeftButton.ui = true;

    this.movePageRightButton.position = new powerupjs.Vector2(1000, 685);
    this.movePageRightButton.sheetIndex = 1;
    this.movePageRightButton.ui = true;
};

EditorMenuManager.prototype.addTo = function (editorState) {
    editorState.add(this.objectMenu);
    editorState.add(this.movePageLeftButton);
    editorState.add(this.movePageRightButton);
    editorState.add(this.editingMenu);
    editorState.add(this.musicMenu);
    editorState.add(this.musicButton);
};

EditorMenuManager.prototype.update = function (mode) {
    var musicOpen = this.musicMenu.visible;
    this.objectMenu.visible = mode === "Drawing" && !musicOpen;
    this.editingMenu.visible = (mode === "Erasing" || mode === "Editing") && !musicOpen;
    this.movePageLeftButton.visible = !musicOpen;
    this.movePageRightButton.visible = !musicOpen;
};

EditorMenuManager.prototype.handleInput = function () {
    if (this.musicButton.pressed) {
        this.musicMenu.visible = !this.musicMenu.visible;
    }

    if (this.movePageLeftButton.pressed) {
        this.objectMenu.pageNumber--;
    }

    if (this.movePageRightButton.pressed) {
        this.objectMenu.pageNumber++;
    }
};

EditorMenuManager.prototype.isMouseOver = function (mouseScreen) {
    if (this.objectMenu.visible) {
        if (this.objectMenu.frame.boundingBox.contains(mouseScreen)) return true;
        for (var i = 0; i < this.objectMenu.blockIcons.length; i++) {
            var icon = this.objectMenu.blockIcons.at(i);
            if (icon && icon.visible && icon.boundingBox.contains(mouseScreen)) return true;
        }
    }

    if (this.editingMenu.visible && this.editingMenu.frame.boundingBox.contains(mouseScreen)) {
        return true;
    }

    if (this.editingMenu.visible) {
        for (var j = 0; j < this.editingMenu.buttons.length; j++) {
            var button = this.editingMenu.buttons.at(j);
            if (button && button.visible && button.boundingBox.contains(mouseScreen)) return true;
        }
    }

    return false;
};
