function SlimeBehaviorScript() {
    WalkingBehaviorScript.call(this);
}
SlimeBehaviorScript.prototype = Object.create(WalkingBehaviorScript.prototype);
SlimeBehaviorScript.prototype.constructor = SlimeBehaviorScript;

SlimeBehaviorScript.prototype.loadAnimations = function(enemy) {
    WalkingBehaviorScript.prototype.loadAnimations.call(this, enemy);
    enemy.loadAnimation(sprites.slime, "normal", true, 0.3);
    enemy.playAnimation("normal");
};

SlimeBehaviorScript.prototype.handleHurtbox = function(enemy) {
    enemy.takeDamage(10); // Example: inflict 10 damage when hitting a hurtbox
};

SlimeBehaviorScript.prototype.handlePlayerCollision = function(enemy, player) {
    player.takeDamage(10); // Example: inflict 10 damage to the player on collision
};