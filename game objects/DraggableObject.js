function DraggableObject(sprites, layer, id) {
    powerupjs.SpriteGameObject.call(this, sprites, layer, id);
    this.draggable = true;;
    this.dragging;
    this.lastMousePosition = powerupjs.Vector2.zero;
}

DraggableObject.prototype = Object.create(powerupjs.SpriteGameObject.prototype);

DraggableObject.prototype.handleInput = function (delta) {
    powerupjs.SpriteGameObject.prototype.handleInput.call(this, delta);

    if (powerupjs.Mouse.left.down && this.boundingBox.contains(powerupjs.Mouse.position) && this.draggable) {
        this.parent.editingTiles = false;
        this.position.addTo(powerupjs.Mouse.screenPosition.copy().subtractFrom(this.lastMousePosition));
        this.dragging = true;
    }
    else {
        this.dragging = false;
    }

    this.lastMousePosition = powerupjs.Mouse.screenPosition.copy();
}
