function MovingPlatform(sprite) {
    Tile.call(this, sprite);
    this.movementNodes = [];
    this.lastMousePosition;
    this.addButton = new powerupjs.Button(sprites.addButton);
    this.addingNode = false;
    this.nodeCrosshair = new powerupjs.SpriteGameObject(sprites.crosshair);
    this.nodeCrosshair.origin = this.nodeCrosshair.center;
    this.currentNodeIndex = 1;
    this.moveSpeed = 15; // Speed the platform moves
}

MovingPlatform.prototype = Object.create(Tile.prototype);

MovingPlatform.prototype.update = function(delta) {
    Tile.prototype.update.call(this, delta);
    if (this.movementNodes.length == 0) this.movementNodes.push(this.position.copy()); // Add initial position
    this.movePlatform();
    this.manageHitboxes();
    this.addButton.position = this.position.copy().addTo(10);
    if (this.addingNode) {
        this.nodeCrosshair.position = powerupjs.Mouse.position;
    }
}

MovingPlatform.prototype.draw = function() {
    Tile.prototype.draw.call(this)
    this.addButton.draw()
    if (this.addingNode) {
        console.log("bruh")
        this.nodeCrosshair.draw();
    }
}

MovingPlatform.prototype.movePlatform = function() {
    if (this.movementNodes.length <= 1) return;
    var distanceFromNode = this.movementNodes[this.currentNodeIndex].copy().subtractFrom(this.position.copy());
    if (Math.abs(distanceFromNode.x) > 0.3) {
        if (distanceFromNode.x > 0)
            this.velocity.x = this.moveSpeed;
        else 
            this.velocity.x = -this.moveSpeed;
    }
    else {
        this.position = this.movementNodes[this.currentNodeIndex].copy()
        this.currentNodeIndex++;
        if (this.currentNodeIndex >= this.movementNodes.length) this.currentNodeIndex = 0;

    }
}

MovingPlatform.prototype.handleInput = function(delta) {
    Tile.prototype.handleInput.call(this, delta);
    this.addButton.handleInput(delta);
    

    if (this.addingNode) {
        if (powerupjs.Mouse.left.pressed) {
            var lastMovementNode = this.movementNodes[this.movementNodes.length - 1];
            console.log(lastMovementNode)
            var positionOffset = this.nodeCrosshair.position.copy().subtractFrom(lastMovementNode);
            if (Math.abs(positionOffset.x) > Math.abs(positionOffset.y)) {
                this.movementNodes.push(new powerupjs.Vector2(this.nodeCrosshair.position.x, this.nodeCrosshair.position.y - positionOffset.y));
            }
            else {
                this.movementNodes.push(new powerupjs.Vector2(this.nodeCrosshair.position.x - positionOffset.x, this.nodeCrosshair.position.y));
            }
        }
    }

    if (this.addButton.pressed) {
        this.addingNode = true;
    }
}