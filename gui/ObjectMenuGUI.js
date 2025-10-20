function ObjectMenuGUI() {
    powerupjs.GameObjectList.call(this);
    var frame = new powerupjs.SpriteGameObject(sprites.woodenFrame);
    frame.ui = true;
    this.add(frame);
    this.blocks = new powerupjs.GameObjectList();
    this.blocks.position = new powerupjs.Vector2(40, 40);
    this.cellWidth = 50;
    this.cellHeight = 50;
    this.blockSelector = new powerupjs.SpriteGameObject(sprites.editorBlockSelector);
    this.blockSelector.visible = false;
    this.blockSelector.origin = this.blockSelector.center;
    this.blockSelector.ui = true;
    this.add(this.blockSelector);

    this.add(this.blocks);
}

ObjectMenuGUI.prototype = Object.create(powerupjs.GameObjectList.prototype);

ObjectMenuGUI.prototype.loadBlocks = function() {
    for (var i = 0; i < WorldSettings.blockSprites.length; i++) {
        var block = WorldSettings.blockSprites[i];
            for (var l = 0; l < block.nrSheetElements; l++) {
                var piece = new powerupjs.SpriteGameObject(block);
                piece.ui = true;
                piece.sheetIndex = l;
                piece.origin = piece.center;
                this.blocks.add(piece);
            }
        
    }
    for (var i = 0; i < this.blocks.length; i++) {
        this.blocks.at(i).position.x = this.cellWidth * i;
    }

}

ObjectMenuGUI.prototype.handleInput = function(delta) {
    powerupjs.GameObjectList.prototype.handleInput.call(this, delta);
    for (var i = 0; i < this.blocks.length; i++) {
        var boundingBox = this.blocks.at(i).boundingBox;
        if (this.visible && powerupjs.Mouse.containsMousePress(boundingBox)) {
            WorldSettings.currentBlock = this.blocks.at(i).sprite;
            this.blockSelector.visible = true;
            this.blockSelector.position = this.blocks.at(i).position.copy().addTo(this.blocks.position)
        }
    }
}
