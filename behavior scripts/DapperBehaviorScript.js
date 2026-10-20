function DapperBehaviorScript() {
    FlyingBehaviorScript.call(this);
    this.wanderWaitTime = 0.5;
    this.chasing = false;
}
DapperBehaviorScript.prototype = Object.create(FlyingBehaviorScript.prototype);
DapperBehaviorScript.prototype.constructor = DapperBehaviorScript;

DapperBehaviorScript.prototype.update = function (enemy, delta) {
    FlyingBehaviorScript.prototype.update.call(this, enemy, delta);
    if (this.rerouting) {
        this.chasing = false;
        return;
    }
    var player = WorldSettings.player;
    var reachedTarget = this.moveTarget.subtract(enemy.position).length <= this.moveSpeed * delta;
    if (player && enemy.position.distanceTo(player.position) < 500 && enemy.canSeePlayer()) {
        this.wandering = false;
        this.chasing = true;
        this.moveTarget = player.position.copy();
    }
    else {
        if (reachedTarget) {
            this.wandering = true;
            this.chasing = false;
        }
    }
};


DapperBehaviorScript.prototype.handleHurtbox = function(enemy) {
    enemy.takeDamage(10); // Example: inflict 10 damage when hitting a hurtbox
};

DapperBehaviorScript.prototype.handlePlayerCollision = function(enemy, player) {
    player.takeDamage(10); // Example: inflict 10 damage to the player on collision
};