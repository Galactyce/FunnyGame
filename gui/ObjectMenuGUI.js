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

    this.tabButtons = [];
    this.tabs = [
        { key: "tiles", label: "Tiles" },
        { key: "enemies", label: "Enemies" }
    ];
    this.activeTab = "tiles";
    this.buildTabs();

    this.gridWidth = 9; // number of columns in block menu
    this.gridHeight = 3; // number of rows in block menu
    this._pageNumber = 0; // current page number
}

ObjectMenuGUI.prototype = Object.create(powerupjs.GameObjectList.prototype);

ObjectMenuGUI.prototype.getBlockTab = function (block) {
    if (!block) return "tiles";
    if (block.tab) return block.tab;
    var sourceSprite = block.sprite || block;
    if (sourceSprite === sprites.enemy || (sourceSprite && sourceSprite.image && sourceSprite.image.src === sprites.enemy.image.src)) {
        return "enemies";
    }
    return "tiles";
};

ObjectMenuGUI.prototype.getVisibleBlocks = function () {
    var visibleBlocks = [];
    for (var i = 0; i < this.blocks.length; i++) {
        var block = this.blocks.at(i);
        if (!block) continue;
        if (this.getBlockTab(block) === this.activeTab) {
            visibleBlocks.push(block);
        }
    }
    return visibleBlocks;
};

ObjectMenuGUI.prototype.buildTabs = function () {
    for (var i = 0; i < this.tabs.length; i++) {
        var tabInfo = this.tabs[i];
        var tabButton = new powerupjs.AnimatedGameObject(ID.layer_overlays_1);
        tabButton.ui = true;
        tabButton.tabKey = tabInfo.key;
        tabButton.loadAnimation(sprites.tab, "tab", true, 150);
        tabButton.playAnimation("tab");
        tabButton.position = new powerupjs.Vector2(40 + (i * 110), 10);
        tabButton.origin = tabButton.center;
        tabButton.scale = 1.2;
        tabButton.sheetIndex = 0;
        this.add(tabButton);
        this.tabButtons.push(tabButton);
    }
    this.updateTabVisualState();
};

ObjectMenuGUI.prototype.updateTabVisualState = function () {
    for (var i = 0; i < this.tabButtons.length; i++) {
        var tabButton = this.tabButtons[i];
        if (!tabButton) continue;
        tabButton.sheetIndex = (this.activeTab === tabButton.tabKey && tabButton.sprite && tabButton.sprite.nrSheetElements > 1) ? 1 : 0;
    }
};

ObjectMenuGUI.prototype.populateBlocks = function () {
    if (this.blocks.length > 0) return;

    for (var i = 0; i < WorldSettings.blockSprites.length; i++) { // for each block sprite
        var block = WorldSettings.blockSprites[i]; // get block sprite
        var blockTab = this.getBlockTab(block);
        if (block.isAnimated) {
            var animatedPiece = new powerupjs.AnimatedGameObject(); // create sprite game object
            animatedPiece.loadAnimation(block, "moving");
            animatedPiece.ui = true; // set as UI element
            animatedPiece.playAnimation("moving");
            animatedPiece.origin = animatedPiece.center; // set origin to center
            animatedPiece.tab = blockTab;
            this.blocks.add(animatedPiece);
        }
        else {
            for (var l = 0; l < block.nrSheetElements; l++) { // for each variation of the block
                var staticPiece = new powerupjs.SpriteGameObject(block); // create sprite game object
                staticPiece.ui = true; // set as UI element
                staticPiece.sheetIndex = l; // set sheet index
                staticPiece.origin = staticPiece.center; // set origin to center
                staticPiece.tab = blockTab;
                this.blocks.add(staticPiece);
            }
        }
    }
};

ObjectMenuGUI.prototype.rebuildPageIcons = function () {
    var visibleBlocks = this.getVisibleBlocks();
    var pageSize = this.gridWidth * this.gridHeight;
    var pageStart = this._pageNumber * pageSize;

    this.blockIcons.clear();

    for (var slot = 0; slot < pageSize; slot++) {
        var source = visibleBlocks[pageStart + slot];
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
        piece.sourceBlock = source;
        this.blockIcons.add(piece);
    }
};

ObjectMenuGUI.prototype.loadBlocks = function () {
    this.populateBlocks();
    this.rebuildPageIcons();
};

Object.defineProperties(ObjectMenuGUI.prototype, {
    "pageNumber": {
        get: function() {
            return this._pageNumber;
        },
        set: function(value) {
            var visibleBlocks = this.getVisibleBlocks();
            var pageSize = this.gridWidth * this.gridHeight;
            var maxPage = Math.max(0, Math.ceil(visibleBlocks.length / pageSize) - 1);
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
};

ObjectMenuGUI.prototype.placeEnemyFromMenu = function (sprite, position) {
    if (!sprite || !position) return;

    var playingState = powerupjs.GameStateManager.get(ID.game_state_playing);
    if (!playingState || !playingState.enemies || typeof playingState.enemies.addEnemy !== "function") return;

    var enemySpawnPosition = position.copy ? position.copy() : new powerupjs.Vector2(position.x, position.y);
    var existingEnemy = null;
    if (existingEnemy) {
        existingEnemy.destroy();
    }

    var enemy = new Enemy(sprite, enemySpawnPosition.x, enemySpawnPosition.y);
    enemy.position = enemySpawnPosition.copy();
    enemy.origin = enemy.center;
    enemy.manageHitboxes(sprite);
    playingState.enemies.addEnemy(enemy);
};

ObjectMenuGUI.prototype.handleInput = function (delta) {
    powerupjs.GameObjectList.prototype.handleInput.call(this, delta);
    if (this.frame.boundingBox.contains(powerupjs.Mouse.screenPosition)) {
        this.parent.editingTiles = false;
    }

    for (var i = 0; i < this.tabButtons.length; i++) {
        var tabButton = this.tabButtons[i];
        if (tabButton && tabButton.boundingBox && powerupjs.Mouse.containsMousePress(tabButton.boundingBox)) {
            this.activeTab = tabButton.tabKey;
            this.updateTabVisualState();
            this.pageNumber = 0;
            if (WorldSettings.currentBlock && this.getBlockTab(WorldSettings.currentBlock) !== this.activeTab) {
                var visibleBlocks = this.getVisibleBlocks();
                if (visibleBlocks.length > 0) {
                    WorldSettings.currentBlock = visibleBlocks[0];
                }
            }
            return;
        }
    }

    if (this.activeTab === "enemies" && powerupjs.Mouse.left.pressed) {
        for (var j = 0; j < this.blockIcons.length; j++) { // for each block
            var boundingBox = this.blockIcons.at(j).boundingBox; // get block bounding box
            if (this.visible && powerupjs.Mouse.containsMousePress(boundingBox)) { // if block is clicked
                var sourceBlock = this.blockIcons.at(j).sourceBlock;
                if (sourceBlock && this.getBlockTab(sourceBlock) === "enemies") {
                    this.placeEnemyFromMenu(sourceBlock.sprite || sourceBlock, powerupjs.Mouse.position.copy());
                }
            }
        }
    }

    var selectedBlock = WorldSettings.currentBlock;
    var hasSelectedBlock = !!(selectedBlock && selectedBlock.sprite && typeof selectedBlock.sheetIndex !== 'undefined');
    if (!hasSelectedBlock) this.blockSelector.visible = false; // hide selector when no valid block selection exists
    for (var j = 0; j < this.blockIcons.length; j++) { // for each block
        var boundingBox = this.blockIcons.at(j).boundingBox; // get block bounding box
        if (this.visible && powerupjs.Mouse.containsMousePress(boundingBox)) { // if block is clicked
            var sourceBlock = this.blockIcons.at(j).sourceBlock;
            WorldSettings.currentBlock = sourceBlock; // set current block selection object
            this.blockSelector.visible = true; // show block selector
            this.blockSelector.scale = (this.cellWidth + 10) / this.blockSelector.width;
            this.blockSelector.position = this.blockIcons.at(j).position.copy().addTo(this.blockIcons.position); // position selector over block

            // if (sourceBlock && this.getBlockTab(sourceBlock) === "enemies") {
            //     this.placeEnemyFromMenu(sourceBlock.sprite || sourceBlock, powerupjs.Mouse.position.copy());
            // }
        }
    }
};
