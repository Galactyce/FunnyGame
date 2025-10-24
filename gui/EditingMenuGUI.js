function EditingMenuGUI() {
    powerupjs.GameObjectList.call(this);
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
            var button = new powerupjs.Button(buttonSprites[i]);
            button.sheetIndex = j;
            button.ui = true;
            button.position = new powerupjs.Vector2((i+j) * this.cellWidth, 0);
            this.buttons.add(button);
        }
    }
    console.log(this.buttons.length + " buttons loaded into Editing Menu");
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
        console.log("Asdf")
    }
}

EditingMenuGUI.prototype.handleButtonFunction = function (buttonIndex) {

    console.log(this.selectedObj)
    console.log("Editing Menu Button " + buttonIndex + " pressed.");
    if (this.selectedObj != null) {
        switch (buttonIndex) {
            case 0: // move left
                this.selectedObj.position.x -= 5;
                break;
            case 1: // move right
                this.selectedObj.position.x += 5;
                break;
            case 2: // move up
                this.selectedObj.position.y -= 5;
                break;
            case 3: // move down
            console.log('up')
                this.selectedObj.position.y += 5;
                break;
            case 4: // rotate clockwise
                this.selectedObj.rotation += Math.PI / 2;
                this.selectedObj.manageHitboxes();
                if (this.selectedObj.rotation > (3 * Math.PI) / 2) this.selectedObj.rotation = 0;
                break;
            case 5: // rotate counter-clockwise
                this.selectedObj.rotation -= Math.PI / 2;
                this.selectedObj.manageHitboxes();
                if (this.selectedObj.rotation < 0) this.selectedObj.rotation = (3 * Math.PI) / 2;
                break;
            default:
                console.log("No function assigned to this button.");

            this.selectedObj.manageHitboxes();
        }
    }
}