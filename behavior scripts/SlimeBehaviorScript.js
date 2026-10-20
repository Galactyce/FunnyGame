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