function EditingMenuGUI() {
    powerupjs.GameObjectList.call(this, ID.layer_overlays);
    this.menu = new MenuObject(600, 300, "Editing Menu");
    this.menu.ui = true;
    this.add(this.menu);

    this.selectedObj = null; // currently selected object
    this.buttons = this.menu.buttons; // reuse the menu's button collection for editor input checks
}

EditingMenuGUI.prototype = Object.create(powerupjs.GameObjectList.prototype);

EditingMenuGUI.prototype.loadButtons = function () {
    var buttonSprites = [sprites.editingButtons];
    var cellWidth = 50;
    var cellHeight = 50;
    var cellPadding = 10; // optional padding between buttons
    var buttonsPerRow = 10;
    var margin = 10; // optional margin around the buttons
    var headerHeight = this.menu && this.menu.header && this.menu.header.boundingBox ? this.menu.header.boundingBox.height : 50;
    var contentTop = Math.max(0, headerHeight + margin);
    var startX = isFinite(this.menu.area && this.menu.area.x) ? this.menu.area.x : 0;
    var startY = isFinite(this.menu.area && this.menu.area.y) ? this.menu.area.y : contentTop;

    for (var i = 0; i < buttonSprites.length; i++) {
        for (var j = 0; j < buttonSprites[i].nrSheetElements; j++) {
            var button = new powerupjs.Button(buttonSprites[i], ID.layer_overlays);
            button.sheetIndex = j;
            button.ui = true;
            button.position = new powerupjs.Vector2(
                startX + margin + (j * cellWidth) + (j * cellPadding),
                startY + Math.floor(j / buttonsPerRow) * (cellHeight + cellPadding)
            );
            this.menu.buttons.add(button);
        }
    }
};

EditingMenuGUI.prototype.handleInput = function (delta) {
    powerupjs.GameObjectList.prototype.handleInput.call(this, delta);
    for (var i = 0; i < this.menu.buttons.length; i++) {
        var button = this.menu.buttons.at(i);
        if (button.pressed) {
            this.handleButtonFunction(i);
        }
    }

    if (this.menu.visible && this.menu.boundingBox.contains(powerupjs.Mouse.screenPosition)) {
        this.parent.editingTiles = false;
    }
}

EditingMenuGUI.prototype.handleButtonFunction = function (buttonIndex) {
    if (this.selectedObj != null) {
        var nudgeStep = 5;
        if (this.selectedObj.parent && typeof this.selectedObj.parent.scale === 'number') {
            nudgeStep *= this.selectedObj.parent.scale;
        }

        switch (buttonIndex) {
            case 0: // move left
                this.selectedObj.position.x -= nudgeStep;
                break;
            case 1: // move right
                this.selectedObj.position.x += nudgeStep;
                break;
            case 2: // move up
                this.selectedObj.position.y -= nudgeStep;
                break;
            case 3: // move down
                this.selectedObj.position.y += nudgeStep;
                break;
            case 4: // rotate clockwise
                this.selectedObj.rotation += Math.PI / 2;
                if (this.selectedObj.rotation > (3 * Math.PI) / 2) this.selectedObj.rotation = 0;
                break;
            case 5: // rotate counter-clockwise
                this.selectedObj.rotation -= Math.PI / 2;
                if (this.selectedObj.rotation < 0) this.selectedObj.rotation = (3 * Math.PI) / 2;
                break;
            default:
                return;
        }

        if (this.selectedObj.parent && typeof this.selectedObj.parent.snapTileToSubTile === 'function') {
            this.selectedObj.parent.snapTileToSubTile(this.selectedObj);
        }

        // Nudging only moves position; re-derive the grid index so removal/lookup by index still finds this tile.
        if (this.selectedObj.parent && typeof this.selectedObj.parent.getIndexAtLocalPosition === 'function') {
            var newIndex = this.selectedObj.parent.getIndexAtLocalPosition(this.selectedObj.position);
            if (newIndex) this.selectedObj.index = newIndex;
        }

        this.selectedObj.manageHitboxes();
    }
}