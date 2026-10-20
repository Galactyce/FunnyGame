function BehaviorScriptOutline() {
    this.moveSpeed = 0;
    this.acceleration = 0;
    this.jumpForce = 0;
    this.direction = "right";
    this.moveTarget = null;
    this.agro = false;
    this.originalPosition;
    this.useGravity = false;
}

BehaviorScriptOutline.prototype.handleHurtbox = function(enemy) {
     // Implement logic for when the enemy hits a hurtbox
    // This could involve taking damage, playing an animation, etc.
};

BehaviorScriptOutline.prototype.update = function(enemy, delta) {
    this.moveSpeed += this.acceleration * delta;
}

BehaviorScriptOutline.prototype.loadAnimations = function(enemy) {
    if (!this.useGravity) {
        enemy.useGravity = false;
    }
};

BehaviorScriptOutline.prototype.drawDebug = function(enemy) {
};

BehaviorScriptOutline.prototype.handleFloorCollision = function(enemy) {
    // Implement logic for when the enemy collides with the floor
    // This could involve resetting vertical velocity, playing an animation, etc.
}

BehaviorScriptOutline.prototype.handleWallCollision = function(enemy, tileHit) {
    // Implement logic for when the enemy collides with a wall
    // This could involve stopping horizontal movement, playing an animation, etc.
}

BehaviorScriptOutline.prototype.reset = function(enemy) {
    enemy.position = this.originalPosition ? this.originalPosition.clone() : new powerupjs.Vector2(0, 0);
    enemy.velocity = new powerupjs.Vector2(0, 0);
}

BehaviorScriptOutline.prototype.jump = function(enemy) {
    // Implement logic for when the enemy jumps
    // This could involve setting vertical velocity, playing a jump animation, etc.
}

BehaviorScriptOutline.prototype.die = function(enemy) {
    // Implement logic for when the enemy dies
    // This could involve playing a death animation, dropping loot, etc.
}

BehaviorScriptOutline.prototype.handlePlayerCollision = function(enemy, player) {
    // Implement logic for when the enemy collides with the player
    // This could involve dealing damage to the player, playing an animation, etc.
};

BehaviorScriptOutline.prototype.takeDamage = function(enemy) {
    // Implement logic for when the enemy takes damage
    // This could involve reducing health, playing a hurt animation, etc.
}

BehaviorScriptOutline.prototype.handleHurtbox = function(enemy) {
    // Implement logic for when the enemy hits a hurtbox
    // This could involve taking damage, playing an animation, etc.
};

BehaviorScriptOutline.prototype.handlePlayerCollision = function(enemy, player) {
    // Implement logic for when the enemy collides with the player
    // This could involve dealing damage to the player, playing an animation, etc.
};
