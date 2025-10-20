function DraggableObject(sprites, layer, id) {
    powerupjs.SpriteGameObject.call(this, sprites, layer, id);
    this.draggable = true;;
    this.dragging;
    this.lastMousePosition = powerupjs.Vector2.zero;
}

DraggableObject.prototype = Object.create(powerupjs.SpriteGameObject.prototype);

DraggableObject.prototype.handleInput = function(delta) {
    powerupjs.SpriteGameObject.prototype.handleInput.call(this, delta);

    if (powerupjs.Mouse.down && this.boundingBox.contains(powerupjs.Mouse.position) && this.draggable) {
        this.position = powerupjs.Mouse.position.copy().subtractFrom(this.lastMousePosition);
        
    }

    this.lastMousePosition = powerupjs.Mouse.position.copy();
}
