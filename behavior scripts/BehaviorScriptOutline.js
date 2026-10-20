function BehaviorScriptOutline() {
    this.moveSpeed = 0;
    this.acceleration = 0;
    this.jumpForce = 0;
    this.direction = 0;
    this.moveTarget = null;
    this.agro = false;
    this.originalPosition;
}

Behavior.prototype.move = function(delta) {
    this.moveSpeed += acceleration * delta;
}

Behavior.prototype.handleFloorCollision = function() {
}

Behavior.prototype.handleWallCollision = function() {
}

Behavior.prototype.reset = function(position) {
    position = this.originalPosition;
}

Behavior.prototype.jump = function() {
    
}