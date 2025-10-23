function ObjectMenuGUI() {
    powerupjs.GameObjectList.call(this);
    var frame = new powerupjs.SpriteGameObject(sprites.woodenFrame);
    frame.ui = true;
    this.add(frame);
    this.blocks = new powerupjs.GameObjectList();
    this.blocks.position = new powerupjs.Vector2(40, 40); // position inside frame
    this.cellWidth = 50; // cell size for block arrangement
    this.cellHeight = 50; // cell size for block arrangement
    this.blockSelector = new powerupjs.SpriteGameObject(sprites.editorBlockSelector); // selector sprite
    this.blockSelector.visible = false; // initially hidden
    this.blockSelector.origin = this.blockSelector.center;
    this.blockSelector.ui = true; // set as UI element
    this.add(this.blockSelector);

    this.add(this.blocks);
}

ObjectMenuGUI.prototype = Object.create(powerupjs.GameObjectList.prototype);

ObjectMenuGUI.prototype.loadBlocks = function () {
    for (var i = 0; i < WorldSettings.blockSprites.length; i++) { // for each block sprite
        var block = WorldSettings.blockSprites[i]; // get block sprite
        console.log(block.isAnimated)
        if (block.isAnimated) {
            var piece = new powerupjs.AnimatedGameObject(); // create sprite game object
            piece.loadAnimation(block, "moving")
            piece.ui = true; // set as UI element
            piece.playAnimation("moving");
            piece.origin = piece.center; // set origin to center
            this.blocks.add(piece);
        }
        else {
            console.log(block)
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
        this.blocks.at(i).position.x = this.cellWidth * i; // position based on index
    }

}

ObjectMenuGUI.prototype.handleInput = function (delta) {
    powerupjs.GameObjectList.prototype.handleInput.call(this, delta);
    if (WorldSettings.currentBlock === undefined)  // no block selected
        this.blockSelector.visible = false; // hide selector
    for (var i = 0; i < this.blocks.length; i++) { // for each block
        var boundingBox = this.blocks.at(i).boundingBox; // get block bounding box
        if (this.visible && powerupjs.Mouse.containsMousePress(boundingBox)) { // if block is clicked
            WorldSettings.currentBlock = this.blocks.at(i).sprite; // set current block
            WorldSettings.currentBlockIndex = i; // set current block index
            this.blockSelector.visible = true; // show block selector
            this.blockSelector.position = this.blocks.at(i).position.copy().addTo(this.blocks.position); // position selector over block
        }
    }
}
