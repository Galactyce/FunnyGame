function EditingMenuGUI() {
    powerupjs.GameObjectList.call(this, ID.layer_overlays);
    this.frame = new powerupjs.SpriteGameObject(sprites.woodenFrame);
    this.frame.ui = true;
    this.add(this.frame);
    this.buttons = new powerupjs.GameObjectList();
    this.buttons.position = new powerupjs.Vector2(40, 40); // position inside frame
    this.cellWidth = 50; // cell size for button arrangement
    this.cellHeight = 50; // cell size for button arrangement
    this.selectedObj = null; // currently selected object
    this.add(this.buttons);
}

EditingMenuGUI.prototype = Object.create(powerupjs.GameObjectList.prototype);

EditingMenuGUI.prototype.loadButtons = function () {
    var buttonSprites = [sprites.editingButtons];
    
    for (var i = 0; i < buttonSprites.length; i++) {
        for (var j = 0; j < buttonSprites[i].nrSheetElements; j++) {
            var button = new powerupjs.Button(buttonSprites[i], ID.layer_overlays);
            button.sheetIndex = j;
            button.ui = true;
            button.position = new powerupjs.Vector2((i+j) * this.cellWidth, 0);
            this.buttons.add(button);
        }
    }
};

EditingMenuGUI.prototype.handleInput = function (delta) {
    powerupjs.GameObjectList.prototype.handleInput.call(this, delta);
    for (var i = 0; i < this.buttons.length; i++) {
        var button = this.buttons.at(i);
        if (button.pressed) {
            this.handleButtonFunction(i);
        }
    }

    if (this.frame.boundingBox.contains(powerupjs.Mouse.screenPosition)) {
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

        // Keep tile index and hitbox in sync so saves preserve small edit-menu nudges.
        this.selectedObj.manageHitboxes();
    }
}