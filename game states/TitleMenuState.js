function TitleMenuState(layer) {
    powerupjs.GameObjectList.call(this, layer);


    this.editorButton = new LabelledButton(sprites.button, "Edit", "Arial", "20px", ID.layer_overlays); // editor button
    this.editorButton.position = new powerupjs.Vector2(powerupjs.Game.screenCenter.x, 500);
    this.add(this.editorButton);

    this.playButton = new LabelledButton(sprites.button, "Play", "Arial", "20px", ID.layer_overlays); // play button
    this.playButton.position = new powerupjs.Vector2(powerupjs.Game.screenCenter.x, 400);
    this.add(this.playButton);


}

TitleMenuState.prototype = Object.create(powerupjs.GameObjectList.prototype);

TitleMenuState.prototype.handleInput = function (delta) {
    powerupjs.GameObjectList.prototype.handleInput.call(this, delta);
    if (this.editorButton.pressed) {
        powerupjs.GameStateManager.switchTo(ID.game_state_editor); // switch to editor state
        return;
    }
    if (this.playButton.pressed) {
        powerupjs.GameStateManager.get(ID.game_state_playing).loadLevel(); // load level in playing state
        powerupjs.GameStateManager.switchTo(ID.game_state_playing); // switch to playing state
        return;
    }
} 
