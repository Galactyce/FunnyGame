function Level() {
    powerupjs.GameObjectList.call(this);
    this.tileFields = new powerupjs.GameObjectList(5); // array to hold tile fields
    this.playerStartPos = powerupjs.Vector2.zero; // default player start position
    this.cameraBounds;
    this.name;
    this.backgrounds = new powerupjs.GameObjectList(1);
    this.scale = 1.5;
    this.add(this.tileFields)
}

Level.prototype = Object.create(powerupjs.GameObjectList.prototype);

Level.prototype.loadBackground = function () {
    for (var i = 0; i < window.LEVELS[WorldSettings.currentLevelIndex].backgrounds.length; i++) {
                console.log( window.LEVELDATA[WorldSettings.currentLevelIndex])

        var index = window.LEVELS[WorldSettings.currentLevelIndex].backgrounds[i];
        var camBounds =  window.LEVELS[WorldSettings.currentLevelIndex].cameraBounds
        var background = new powerupjs.SpriteGameObject(WorldSettings.backgrounds[index]);
        background.position = new powerupjs.Vector2(camBounds.x,
            camBounds.height + camBounds.y - background.height);
        background.scale = ((camBounds.height) / (background.height)) * this.scale;
        this.backgrounds.add(background);
    }
    this.add(this.backgrounds);
}

Level.prototype.loadTiles = function() {
    WorldSettings.currentLevel.tileFields.clear()
    for (var i = 0; i < window.LEVELS[WorldSettings.currentLevelIndex].tiles.length; i++) { // for each tile layer
        var field = new TileField(); // create new tile field
        field.editorLayer = i; // set layer index
        field.scale = this.scale;
        field.loadTiles();  // load tiles for the layer
        WorldSettings.currentLevel.tileFields.add(field); // add tile field to list
    };
}

Level.prototype.update = function(delta) {
    powerupjs.GameObjectList.prototype.update.call(this, delta)
    for (var i = 0; i < this.backgrounds.length; i++) {
    
        var camBounds =  WorldSettings.currentLevel.cameraBounds
        var background = this.backgrounds.at(this.backgrounds.length - i - 1)
        var amount = new powerupjs.Vector2((powerupjs.Camera.position.x - camBounds.x) / (camBounds.width - powerupjs.Camera.viewWidth),
            (powerupjs.Camera.position.y - camBounds.y) / (camBounds.height - powerupjs.Camera.viewHeight))
        console.log((powerupjs.Camera.position.y + powerupjs.Camera.viewHeight) + ", " + (camBounds.bottom))
        background.position.x = powerupjs.Camera.position.x - (((background.width * background.scale) 
            - powerupjs.Camera.viewWidth) * amount.x) / (i+1)
        
        background.position.y = powerupjs.Camera.position.y - (((background.height * background.scale) 
            - powerupjs.Camera.viewHeight) * amount.y) / (i + 1)
    }
}
