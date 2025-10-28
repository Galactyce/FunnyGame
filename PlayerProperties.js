Player.prototype.initialize = function() {
    this.dashSpeed = 400 * this.scale;   // Speed of dashes
    this.dashDistance = 130 * this.scale;    // Max distance dashes can reach
    this.detachBufferTime = 0.2;    // Time in takes to fall off wall after letting go 
    this.jumpKey = powerupjs.Keys.C;
    this.dashKey = powerupjs.Keys.X;
    this.moveSpeed = 65 * this.scale;
    this.jumpForce = -160;
    this.accelerationMultiplier = 3;
    this.neutralJumpTime = 0.4;
}