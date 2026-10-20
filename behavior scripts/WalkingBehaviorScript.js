function WalkingBehaviorScript() {
    BehaviorScriptOutline.call(this);
    this.moveSpeed = 30; // Default move speed
    this.useGravity = true;

}

WalkingBehaviorScript.prototype = Object.create(BehaviorScriptOutline.prototype);
WalkingBehaviorScript.prototype.constructor = WalkingBehaviorScript;

WalkingBehaviorScript.prototype.update = function(enemy, delta) {
    this.move(enemy, delta);
}


WalkingBehaviorScript.prototype.move = function(enemy, delta) {
    if (this.direction === "left") {
        enemy.velocity.x = -this.moveSpeed || 0;
        enemy.mirror = false;
    } else if (this.direction === "right") {
        enemy.velocity.x = this.moveSpeed || 0;
        enemy.mirror = true;
    }
}

WalkingBehaviorScript.prototype.takeDamage = function(enemy) {
    // Implement logic for when the enemy takes damage
    // This could involve reducing health, playing an animation, etc.
}

WalkingBehaviorScript.prototype.handleHurtbox = function(enemy) {
    enemy.takeDamage(10); // Example: inflict 10 damage when hitting a hurtbox
};

WalkingBehaviorScript.prototype.handlePlayerCollision = function(enemy, player) {
    player.takeDamage(10); // Example: inflict 10 damage to the player on collision
};

WalkingBehaviorScript.prototype.handleWallCollision = function(enemy, tileHit) {
    if (tileHit == -1) {
        this.direction = "right"; // Stop horizontal movement when hitting the left wall
    } else if (tileHit == 1) {
        this.direction = "left"; // Stop horizontal movement when hitting the right wall
    }
};