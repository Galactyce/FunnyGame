function TitleMenuState(layer) {
    powerupjs.GameObjectList.call(this, layer);

    this.levelName = new powerupjs.Label("Arial", "40px")
    console.log(this.levelName.origin)
    this.levelName.position = new powerupjs.Vector2(powerupjs.Game.screenCenter.x, 250);
    this.add(this.levelName);

    this.leftArrow = new ArrowButton("left");
    this.leftArrow.origin = this.leftArrow.center;
    this.add(this.leftArrow);

    this.rightArrow = new ArrowButton("right");
    this.rightArrow.origin = this.rightArrow.center;
    this.add(this.rightArrow);

    this.addLevelButton = new powerupjs.Button(sprites.plusButton);
    this.addLevelButton.position = new powerupjs.Vector2(powerupjs.Game.screenCenter.x + 280, 250)
    this.addLevelButton.origin = this.addLevelButton.center;
    this.add(this.addLevelButton)

    this.editorButton = new LabelledButton(sprites.button, "Edit", "Arial", "20px", ID.layer_overlays); // editor button
    this.editorButton.position = new powerupjs.Vector2(powerupjs.Game.screenCenter.x, 500);
    this.add(this.editorButton);

    this.playButton = new LabelledButton(sprites.button, "Play", "Arial", "20px", ID.layer_overlays); // play button
    this.playButton.position = new powerupjs.Vector2(powerupjs.Game.screenCenter.x, 400);
    this.add(this.playButton);

    this.levelSelectedIndex = 0;
}

TitleMenuState.prototype = Object.create(powerupjs.GameObjectList.prototype);

TitleMenuState.prototype.handleInput = function (delta) {
    powerupjs.GameObjectList.prototype.handleInput.call(this, delta);
    if (this.editorButton.pressed) {
        WorldSettings.currentLevel = WorldSettings.levels[this.levelSelectedIndex];
        WorldSettings.currentLevelIndex = this.levelSelectedIndex;
        WorldSettings.currentLevel.loadBackground()
        powerupjs.GameStateManager.get(ID.game_state_editor).loadLayers(); // load editor layers
        powerupjs.GameStateManager.get(ID.game_state_playing).loadLevel(); // load level in playing state

        powerupjs.GameStateManager.switchTo(ID.game_state_editor); // switch to editor state
        WorldSettings.currentState = "editing"
        return;
    }
    if (this.playButton.pressed) {

        WorldSettings.currentLevel = WorldSettings.levels[this.levelSelectedIndex];
        WorldSettings.currentLevelIndex = this.levelSelectedIndex;
        WorldSettings.currentLevel.loadBackground()
        powerupjs.GameStateManager.get(ID.game_state_editor).loadLayers(); // load editor layers
        powerupjs.GameStateManager.get(ID.game_state_playing).loadLevel(); // load level in playing state

        console.log(WorldSettings.currentLevel)

        powerupjs.GameStateManager.switchTo(ID.game_state_playing); // switch to playing state
        WorldSettings.currentState = "playing"
        return;
    }

    if (powerupjs.Keyboard.pressed(powerupjs.Keys.left) || this.leftArrow.pressed) {
        this.levelSelectedIndex--;
        if (this.levelSelectedIndex < 0) this.levelSelectedIndex = WorldSettings.levels.length - 1;
    }
    if (powerupjs.Keyboard.pressed(powerupjs.Keys.right) || this.rightArrow.pressed) {
        this.levelSelectedIndex++;
        if (this.levelSelectedIndex >= WorldSettings.levels.length) this.levelSelectedIndex = 0;
    }

    if (powerupjs.Keyboard.pressed(powerupjs.Keys.Y)) {
        localStorage.clear();
        location.reload();
    }

    if (this.addLevelButton.pressed) {
        WorldSettings.createLevel();
        this.levelSelectedIndex = window.LEVELS.length - 1;
    }

    if (this.levelName.boundingBox.contains(powerupjs.Mouse.position) && powerupjs.Mouse.left.pressed) {    // Edit level name
        window.LEVELS[this.levelSelectedIndex].name = prompt("Level name:");
        window.LEVELDATA[this.levelSelectedIndex] = saveLevelToTxt(this.levelSelectedIndex)
        localStorage.levelData = JSON.stringify(window.LEVELDATA);
        localStorage.levels = JSON.stringify(window.LEVELS);

        WorldSettings.loadLevels()
    }
    if (WorldSettings.levels.length > 0) {
        this.levelName.text = WorldSettings.levels[this.levelSelectedIndex].name
        this.levelName.origin = this.levelName.center;
        this.leftArrow.position = new powerupjs.Vector2(this.levelName.position.x - this.leftArrow.width - this.levelName.width / 2, this.levelName.position.y);
        this.rightArrow.position = new powerupjs.Vector2(this.levelName.position.x + this.rightArrow.width + this.levelName.width / 2, this.levelName.position.y);
        this.addLevelButton.position = new powerupjs.Vector2(this.levelName.position.x + this.addLevelButton.width + this.levelName.width / 2 + 80, this.levelName.position.y);
    }
    else {
        if (!localStorage.levels) { // if no level data
            WorldSettings.createLevel();    // create a level
            return;
        }
        
    }
} 
