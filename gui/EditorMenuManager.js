function EditorMenuManager(layer) {
    this.layer = typeof layer !== "undefined" ? layer : ID.layer_overlays;
    this.objectMenu = new ObjectMenuGUI(this.layer);
    this.editingMenu = new EditingMenuGUI();
    this.musicMenu = new MusicMenuGUI(this.layer);

    this.configureLayout();
}

EditorMenuManager.prototype.configureLayout = function () {
    this.objectMenu.position = new powerupjs.Vector2(
        (powerupjs.Game.size.x - this.objectMenu.menu.base.width) / 2,
        powerupjs.Game.size.y - this.objectMenu.menu.base.height
    );
    this.objectMenu.ui = true;

    this.editingMenu.position = new powerupjs.Vector2(400, 600);

    this.musicMenu.position = new powerupjs.Vector2(400, 600);
    this.musicMenu.visible = false;

};

EditorMenuManager.prototype.addTo = function (editorState) {
    editorState.add(this.objectMenu);
    editorState.add(this.editingMenu);
    editorState.add(this.musicMenu);
};

EditorMenuManager.prototype.update = function (mode) {
    this.musicMenu.visible = this.musicMenu.menu.isOpen;
    this.objectMenu.visible = mode === "Drawing" && this.objectMenu.menu.isOpen;
    this.editingMenu.visible = mode === "Erasing" || mode === "Editing";
};

EditorMenuManager.prototype.handleInput = function () {
    // Menu-owned buttons receive input through their parent GameObjectList.
};

EditorMenuManager.prototype.isMouseOver = function (mouseScreen) {
    if (this.musicButton && this.musicButton.visible && this.musicButton.boundingBox && this.musicButton.boundingBox.contains(mouseScreen)) {
        return true;
    }

    if (this.musicMenu.visible) {
        if (this.musicMenu.menu.boundingBox.contains(mouseScreen)) return true;

        for (var musicIndex = 0; musicIndex < this.musicMenu.length; musicIndex++) {
            var musicObject = this.musicMenu.at(musicIndex);
            if (musicObject && musicObject.visible && musicObject.boundingBox && musicObject.boundingBox.contains(mouseScreen)) {
                return true;
            }
        }
    }

    if (this.objectMenu.menu.consumedInput) return true;

    if (this.objectMenu.visible && this.objectMenu.menu.visible) {
        if (this.objectMenu.menu.boundingBox.contains(mouseScreen)) return true;
        for (var i = 0; i < this.objectMenu.blockIcons.length; i++) {
            var icon = this.objectMenu.blockIcons.at(i);
            if (icon && icon.visible && icon.boundingBox.contains(mouseScreen)) return true;
        }
    }

    if (this.editingMenu.visible && this.editingMenu.frame && this.editingMenu.frame.boundingBox.contains(mouseScreen)) {
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
