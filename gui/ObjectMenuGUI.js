function ObjectMenuGUI(layer) {
    powerupjs.GameObjectList.call(this, layer);
    this.menu = new MenuObject(600, 300, "Object Menu");
    this.menu.position = new powerupjs.Vector2(-25, 0); // menu offset
    this.add(this.menu);
    this.menu.addCloseButton(new powerupjs.Vector2(565, 7));

    this.blocks = new powerupjs.GameObjectList();
    this.cellWidth = 48;
    this.cellHeight = 48;
    this.cellPadding = 4;
    this.contentPadding = 12;
    this.contentTop = 60;

    this.blockSelector = new powerupjs.SpriteGameObject(sprites.editorBlockSelector); // selector sprite
    this.blockSelector.visible = false; // initially hidden
    this.blockSelector.origin = this.blockSelector.center;
    this.blockSelector.ui = true; // set as UI element
    this.menu.objects.add(this.blockSelector);

    this.blockIcons = new powerupjs.GameObjectList(ID.layer_overlays_1);
    this.blockIcons.position = new powerupjs.Vector2(this.contentPadding, this.contentTop);
    this.menu.objects.add(this.blockIcons);

    this.tabButtons = [];
    this.tabs = [
        { key: "tiles", label: "Tiles" },
        { key: "enemies", label: "Enemies" }
    ];
    
    this.activeTab = "tiles";
    this.buildTabs();

    this.pageLeftButton = this.menu.createButton(null, this.menu.area.left, this.menu.area.top + this.menu.area.height / 2 + 25, sprites.arrowButtons);
    this.pageLeftButton.sheetIndex = 0;
    this.pageRightButton = this.menu.createButton(null, this.menu.area.right - 30, this.menu.area.top + this.menu.area.height / 2 + 25, sprites.arrowButtons);
    this.pageRightButton.sheetIndex = 1;

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

ObjectMenuGUI.prototype.updateGridMetrics = function (visibleBlocks) {
    var menuWidth = this.menu.base.width;
    var menuHeight = this.menu.base.height;
    var availableWidth = Math.max(1, menuWidth - (this.contentPadding * 2));
    var availableHeight = Math.max(1, menuHeight - this.contentTop - this.contentPadding);
    var maxBlockWidth = 32;
    var maxBlockHeight = 32;

    for (var i = 0; i < visibleBlocks.length; i++) {
        var block = visibleBlocks[i];
        if (!block) continue;
        maxBlockWidth = Math.max(maxBlockWidth, block.width || 0);
        maxBlockHeight = Math.max(maxBlockHeight, block.height || 0);
    }

    this.cellWidth = Math.max(40, Math.min(72, maxBlockWidth + 20));
    this.cellHeight = Math.max(40, Math.min(72, maxBlockHeight + 20));
    this.gridWidth = Math.max(1, Math.floor((availableWidth + this.cellPadding) / (this.cellWidth + this.cellPadding)));
    this.gridHeight = Math.max(1, Math.floor((availableHeight + this.cellPadding) / (this.cellHeight + this.cellPadding)));

    var gridWidth = this.gridWidth * this.cellWidth + (this.gridWidth - 1) * this.cellPadding;
    var gridHeight = this.gridHeight * this.cellHeight + (this.gridHeight - 1) * this.cellPadding;
    this.blockIcons.position = new powerupjs.Vector2(
        this.contentPadding + (availableWidth - gridWidth) / 2,
        this.contentTop + (availableHeight - gridHeight) / 2
    );
};

ObjectMenuGUI.prototype.buildTabs = function () {
    for (var i = 0; i < this.tabs.length; i++) {
        var tabInfo = this.tabs[i];
        var tabButton = new powerupjs.AnimatedGameObject(ID.layer_overlays_1);
        tabButton.ui = true;
        tabButton.tabKey = tabInfo.key;
        tabButton.loadAnimation(sprites.tab, "tab", true, 150);
        tabButton.playAnimation("tab");
        tabButton.position = new powerupjs.Vector2(40 + (i * 110), 12);
        tabButton.origin = tabButton.center;
        tabButton.scale = 1.2;
        tabButton.sheetIndex = 0;
        this.menu.objects.add(tabButton);
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

    var menuEntries = (WorldSettings.blockSprites || []).concat(WorldSettings.editorObjects || []);
    for (var i = 0; i < menuEntries.length; i++) { // for each block sprite or editor object
        var block = menuEntries[i];
        var blockSprite = block.sprite || block;
        if (!block.objectType && (blockSprite === sprites.portal || blockSprite === sprites.warp)) continue;
        var blockTab = this.getBlockTab(block);
        if (blockSprite.isAnimated) {
            var animatedPiece = new powerupjs.AnimatedGameObject(); // create sprite game object
            animatedPiece.loadAnimation(blockSprite, "moving");
            animatedPiece.ui = true; // set as UI element
            animatedPiece.playAnimation("moving");
            animatedPiece.origin = animatedPiece.center; // set origin to center
            animatedPiece.tab = blockTab;
            animatedPiece.objectType = block.objectType;
            this.blocks.add(animatedPiece);
        }
        else {
            for (var l = 0; l < blockSprite.nrSheetElements; l++) { // for each variation of the block
                var staticPiece = new powerupjs.SpriteGameObject(blockSprite); // create sprite game object
                staticPiece.ui = true; // set as UI element
                staticPiece.sheetIndex = l; // set sheet index
                staticPiece.origin = staticPiece.center; // set origin to center
                staticPiece.tab = blockTab;
                staticPiece.objectType = block.objectType;
                this.blocks.add(staticPiece);
            }
        }
    }
};

ObjectMenuGUI.prototype.rebuildPageIcons = function () {
    var visibleBlocks = this.getVisibleBlocks();
    this.updateGridMetrics(visibleBlocks);
    var pageSize = this.gridWidth * this.gridHeight;
    var pageStart = this._pageNumber * pageSize;

    this.blockIcons.clear();

    for (var slot = 0; slot < pageSize; slot++) {
        var source = visibleBlocks[pageStart + slot];
        if (!source) break;

        var piece = new powerupjs.SpriteGameObject(source.sprite);
        piece.sheetIndex = source.sheetIndex; // keep the correct sprite from the sheet
        var iconScale = Math.min(
            (this.cellWidth - 4) / piece.width,
            (this.cellHeight - 4) / piece.height
        );
        piece.position = new powerupjs.Vector2(
            (slot % this.gridWidth) * (this.cellWidth + this.cellPadding) + this.cellWidth / 2,
            Math.floor(slot / this.gridWidth) * (this.cellHeight + this.cellPadding) + this.cellHeight / 2
        );
        piece.scale = iconScale;
        piece.origin = piece.center;
        piece.ui = true;
        piece.pixelSnap = false;
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
            this.updateGridMetrics(visibleBlocks);
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
        for (var i = 0; i < this.blockIcons.length; i++) {
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

ObjectMenuGUI.prototype.placeTravelPointFromMenu = function (position) {
    if (!position || !WorldSettings.currentLevel || !WorldSettings.currentLevel.room) return;

    var travelPoint = new TravelPoint(position.copy ? position.copy() : new powerupjs.Vector2(position.x, position.y));
    WorldSettings.currentLevel.room.addTravelPoint(travelPoint);
};

ObjectMenuGUI.prototype.handleInput = function (delta) {
    powerupjs.GameObjectList.prototype.handleInput.call(this, delta);
    if (!this.menu.visible) return;

    if (this.pageLeftButton.pressed) this.pageNumber--;
    if (this.pageRightButton.pressed) this.pageNumber++;

    if (this.menu.boundingBox.contains(powerupjs.Mouse.screenPosition)) {
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
            if (this.parent && typeof this.parent.setMode === "function") this.parent.setMode("Drawing"); // picking a block returns the editor to Drawing mode
            this.blockSelector.visible = true; // show block selector
            this.blockSelector.scale = (this.cellWidth + 10) / this.blockSelector.width;
            this.blockSelector.position = this.blockIcons.at(j).position.copy().addTo(this.blockIcons.position); // position selector over block

            // if (sourceBlock && this.getBlockTab(sourceBlock) === "enemies") {
            //     this.placeEnemyFromMenu(sourceBlock.sprite || sourceBlock, powerupjs.Mouse.position.copy());
            // }
        }
    }
};
