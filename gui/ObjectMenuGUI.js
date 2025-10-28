function ObjectMenuGUI(layer) {
    powerupjs.GameObjectList.call(this, layer);
    this.frame = new powerupjs.SpriteGameObject(sprites.woodenFrame);
    this.frame.ui = true;
    this.add(this.frame);
    this.blocks = new powerupjs.GameObjectList();
    this.blocks.position = new powerupjs.Vector2(40, 40); // position inside frame
    this.cellWidth = 50; // cell size for block arrangement
    this.cellHeight = 50; // cell size for block arrangement
    this.cellPadding = 15;
    this.blockSelector = new powerupjs.SpriteGameObject(sprites.editorBlockSelector); // selector sprite
    this.blockSelector.visible = false; // initially hidden
    this.blockSelector.origin = this.blockSelector.center;
    this.blockSelector.ui = true; // set as UI element
    this.add(this.blockSelector);

    this.blockIcons = new powerupjs.GameObjectList(ID.layer_overlays_1);
    this.blockIcons.position = new powerupjs.Vector2(5, 5)
    this.add(this.blockIcons);
}

ObjectMenuGUI.prototype = Object.create(powerupjs.GameObjectList.prototype);

ObjectMenuGUI.prototype.loadBlocks = function () {
    for (var i = 0; i < WorldSettings.blockSprites.length; i++) { // for each block sprite
        var block = WorldSettings.blockSprites[i]; // get block sprite
        if (block.isAnimated) {
            var piece = new powerupjs.AnimatedGameObject(); // create sprite game object
            piece.loadAnimation(block, "moving")
            piece.ui = true; // set as UI element
            piece.playAnimation("moving");
            piece.origin = piece.center; // set origin to center
            this.blocks.add(piece);
        }
        else {
            for (var l = 0; l < block.nrSheetElements; l++) { // for each variation of the block
                var piece = new powerupjs.SpriteGameObject(block); // create sprite game object
                piece.ui = true; // set as UI element
                piece.sheetIndex = l; // set sheet index
                piece.origin = piece.center; // set origin to center
                this.blocks.add(piece);
            }
        }
    }
    for (var i = 0; i < this.blocks.length; i++) { // position blocks in a row
        var piece = new powerupjs.SpriteGameObject(this.blocks.at(i).sprite);
        piece.scale = this.cellWidth / piece.width;
        piece.position = new powerupjs.Vector2(40 + (i * (this.cellWidth + this.cellPadding)), 40);
        piece.origin = piece.center;
        piece.ui = true;
        this.blockIcons.add(piece);
    }

}

ObjectMenuGUI.prototype.draw = function() {
    powerupjs.GameObjectList.prototype.draw.call(this);
    if (powerupjs.Keyboard.down(powerupjs.Keys.P))
        for (var i = 0; i < this.length; i++) {
            this.blockIcons.at(i).boundingBox.draw()
        }
}

ObjectMenuGUI.prototype.handleInput = function (delta) {
    powerupjs.GameObjectList.prototype.handleInput.call(this, delta);
    if (this.frame.boundingBox.contains(powerupjs.Mouse.screenPosition)) {
        this.parent.editingTiles = false;
    }

    if (WorldSettings.currentBlock === undefined)  // no block selected
        this.blockSelector.visible = false; // hide selector
    for (var i = 0; i < this.blockIcons.length; i++) { // for each block
        var boundingBox = this.blockIcons.at(i).boundingBox; // get block bounding box
        if (this.visible && powerupjs.Mouse.containsMousePress(boundingBox)) { // if block is clicked
            WorldSettings.currentBlock = this.blocks.at(i).sprite; // set current block
            WorldSettings.currentBlockIndex = i; // set current block index
            this.blockSelector.visible = true; // show block selector
            this.blockSelector.scale = (this.cellWidth + 10) / this.blockSelector.width
            console.log()
            this.blockSelector.position = this.blockIcons.at(i).position.copy().addTo(this.blockIcons.position); // position selector over block
        }
    }
}
