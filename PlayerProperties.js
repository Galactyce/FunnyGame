Player.prototype.initialize = function() {
    this.dashSpeed = 400;   // Speed of dashes
    this.dashDistance = 130;    // Max distance dashes can reach
    this.detachBufferTime = 0.2;    // Time in takes to fall off wall after letting go 
    this.jumpKey = powerupjs.Keys.C;
    this.dashKey = powerupjs.Keys.X;
    this.moveSpeed = 55;
    this.jumpForce = -180;
    this.accelerationMultiplier = 3;
    this.neutralJumpTime = 0.4;
}