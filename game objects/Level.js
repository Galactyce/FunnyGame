function Level() {
    powerupjs.GameObjectList.call(this);
    this.tileFields = new powerupjs.GameObjectList(5); // array to hold tile fields
    this.playerStartPos = powerupjs.Vector2.zero; // default player start position
    this.cameraBounds;
    this.name;
    this.backgrounds = new powerupjs.GameObjectList(1);
    this.scale = 1.5;
    this.add(this.tileFields)
    this.originalBounds;
}

Level.prototype = Object.create(powerupjs.GameObjectList.prototype);

Level.prototype.loadBackground = function () {  // Loads backgrounds for the level from window.LEVELS
    this.backgrounds.clear();
    for (var i = 0; i < window.LEVELS[WorldSettings.currentLevelIndex].backgrounds.length; i++) {
        var index = window.LEVELS[WorldSettings.currentLevelIndex].backgrounds[i];
        var camBounds = new powerupjs.Rectangle(
            window.LEVELS[WorldSettings.currentLevelIndex].cameraBounds.x * WorldSettings.currentLevel.scale,
            window.LEVELS[WorldSettings.currentLevelIndex].cameraBounds.y * WorldSettings.currentLevel.scale,
            window.LEVELS[WorldSettings.currentLevelIndex].cameraBounds.width * WorldSettings.currentLevel.scale,
            window.LEVELS[WorldSettings.currentLevelIndex].cameraBounds.height * WorldSettings.currentLevel.scale,

        )
        
        var background = new powerupjs.SpriteGameObject(WorldSettings.backgrounds[index]);
        background.position = new powerupjs.Vector2(camBounds.x,
            camBounds.height + camBounds.y - background.height);
        background.scale = ((camBounds.height) / (background.height));
        this.backgrounds.add(background);
       
    }
    this.add(this.backgrounds);
}

Level.prototype.loadTiles = function() {
    this.tileFields.clear()
    this.cameraBounds = window.LEVELS[WorldSettings.currentLevelIndex].cameraBounds
    for (var i = 0; i < window.LEVELS[WorldSettings.currentLevelIndex].tiles.length; i++) { // for each tile layer
        var field = new TileField(); // create new tile field
        field.editorLayer = i; // set layer index
        field.loadTiles();  // load tiles for the layer
        this.tileFields.add(field); // add tile field to list
    };
}

Level.prototype.scaleCameraBounds = function() {
    this.originalBounds = new powerupjs.Rectangle(-500, -400, 3000, 1400)

    window.LEVELS[WorldSettings.currentLevelIndex].cameraBounds = this.cameraBounds;
    
}

Level.prototype.update = function(delta) {
    powerupjs.GameObjectList.prototype.update.call(this, delta)
    for (var i = 0; i < this.backgrounds.length; i++) {
        var background = this.backgrounds.at(this.backgrounds.length - i - 1);
        var camBounds = new powerupjs.Rectangle(
            window.LEVELS[WorldSettings.currentLevelIndex].cameraBounds.x * WorldSettings.currentLevel.scale,
            window.LEVELS[WorldSettings.currentLevelIndex].cameraBounds.y * WorldSettings.currentLevel.scale,
            window.LEVELS[WorldSettings.currentLevelIndex].cameraBounds.width * WorldSettings.currentLevel.scale,
            window.LEVELS[WorldSettings.currentLevelIndex].cameraBounds.height * WorldSettings.currentLevel.scale,

        )
        var amount = new powerupjs.Vector2((powerupjs.Camera.position.x - camBounds.x) / (camBounds.width - powerupjs.Camera.viewWidth),
            (powerupjs.Camera.position.y - camBounds.y) / (camBounds.height - powerupjs.Camera.viewHeight))
        background.position.x = powerupjs.Camera.position.x - (((background.width * background.scale) 
            - powerupjs.Camera.viewWidth) * amount.x) / (i+1)
        
        background.position.y = powerupjs.Camera.position.y - (((background.height * background.scale) 
            - powerupjs.Camera.viewHeight) * amount.y) / (i + 1)
    }
    if (WorldSettings.currentState == "playing") this.tileFields.visible = true;
    else this.tileFields.visible = false;
}
