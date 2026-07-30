function ObjectMenuGUI(layer) {
    powerupjs.GameObjectList.call(this, layer);
    this.frame = new powerupjs.SpriteGameObject(sprites.woodenFrame);
    this.frame.ui = true;
    this.add(this.frame);
    this.blocks = new powerupjs.GameObjectList();
    this.blocks.position = new powerupjs.Vector2(40, 40); // position inside frame
    this.cellWidth = 48; // cell size for block arrangement
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

    this.gridWidth = 9; // number of columns in block menu
    this.gridHeight = 3; // number of rows in block menu
    this._pageNumber = 0; // current page number
}

ObjectMenuGUI.prototype = Object.create(powerupjs.GameObjectList.prototype);

ObjectMenuGUI.prototype.populateBlocks = function () {
    if (this.blocks.length > 0) return;

    for (var i = 0; i < WorldSettings.blockSprites.length; i++) { // for each block sprite
        var block = WorldSettings.blockSprites[i]; // get block sprite
        if (block.isAnimated) {
            var animatedPiece = new powerupjs.AnimatedGameObject(); // create sprite game object
            animatedPiece.loadAnimation(block, "moving");
            animatedPiece.ui = true; // set as UI element
            animatedPiece.playAnimation("moving");
            animatedPiece.origin = animatedPiece.center; // set origin to center
            this.blocks.add(animatedPiece);
        }
        else {
            for (var l = 0; l < block.nrSheetElements; l++) { // for each variation of the block
                var staticPiece = new powerupjs.SpriteGameObject(block); // create sprite game object
                staticPiece.ui = true; // set as UI element
                staticPiece.sheetIndex = l; // set sheet index
                staticPiece.origin = staticPiece.center; // set origin to center
                this.blocks.add(staticPiece);
            }
        }
    }
}

ObjectMenuGUI.prototype.rebuildPageIcons = function () {
    var pageSize = this.gridWidth * this.gridHeight;
    var pageStart = this._pageNumber * pageSize;

    this.blockIcons.clear();

    for (var slot = 0; slot < pageSize; slot++) {
        var sourceIndex = pageStart + slot;
        var source = this.blocks.at(sourceIndex);
        if (!source) break;

        var piece = new powerupjs.SpriteGameObject(source.sprite);
        piece.sheetIndex = source.sheetIndex; // keep the correct sprite from the sheet
        piece.scale = this.cellWidth / piece.width;
        piece.position = new powerupjs.Vector2(
            40 + ((slot % this.gridWidth) * (this.cellWidth + this.cellPadding)),
            40 + Math.floor(slot / this.gridWidth) * (this.cellHeight + this.cellPadding)
        );
        piece.origin = piece.center;
        piece.ui = true;
        piece.sourceIndex = sourceIndex;
        this.blockIcons.add(piece);
    }
}

ObjectMenuGUI.prototype.loadBlocks = function () {
    this.populateBlocks();
    this.rebuildPageIcons();
}

Object.defineProperties(ObjectMenuGUI.prototype, {
    "pageNumber": {
        get: function() {
            return this._pageNumber;
        },
        set: function(value) {
            var pageSize = this.gridWidth * this.gridHeight;
            var maxPage = Math.max(0, Math.ceil(this.blocks.length / pageSize) - 1);
            if (value < 0) value = 0;
            if (value > maxPage) value = maxPage;
            this._pageNumber = value;
            this.rebuildPageIcons();
        }
    }
});

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

    var selectedBlock = WorldSettings.currentBlock;
    var hasSelectedBlock = !!(selectedBlock && selectedBlock.sprite && typeof selectedBlock.sheetIndex !== 'undefined');
    if (!hasSelectedBlock) this.blockSelector.visible = false; // hide selector when no valid block selection exists
    for (var i = 0; i < this.blockIcons.length; i++) { // for each block
        var boundingBox = this.blockIcons.at(i).boundingBox; // get block bounding box
        if (this.visible && powerupjs.Mouse.containsMousePress(boundingBox)) { // if block is clicked
            var sourceIndex = this.blockIcons.at(i).sourceIndex;
            WorldSettings.currentBlock = this.blocks.at(sourceIndex); // set current block selection object
            this.blockSelector.visible = true; // show block selector
            this.blockSelector.scale = (this.cellWidth + 10) / this.blockSelector.width
            this.blockSelector.position = this.blockIcons.at(i).position.copy().addTo(this.blockIcons.position); // position selector over block
        }
    }
}
