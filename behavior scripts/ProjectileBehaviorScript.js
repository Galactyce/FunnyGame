function ProjectileBehaviorScript() {
    BehaviorScriptOutline.call(this);
    this.projectileSpeed = 400; // Example property for projectile speed
    this.projectileSprite = sprites.projectileTemplate; // Example property for projectile sprite
    this.range = 1000; // Example property for projectile range
    this.projectileLaunchDelay = 2; // Example property for projectile launch delay
    this.projectileLaunchTimer = 0; // Timer to track projectile launch delay
    this.projectileDamage = 10; // Example property for projectile damage
}
ProjectileBehaviorScript.prototype = Object.create(BehaviorScriptOutline.prototype);
ProjectileBehaviorScript.prototype.constructor = ProjectileBehaviorScript;

ProjectileBehaviorScript.prototype.update = function (enemy, delta) {
    BehaviorScriptOutline.prototype.update.call(this, enemy, delta);
    this.projectileLaunchTimer += delta; // Update the projectile launch timer
    var player = WorldSettings.player;
    if (enemy.position.distanceTo(player.position) <= this.range) {
        if (enemy.raycast(player.position) == null) {
            if (this.projectileLaunchTimer >= this.projectileLaunchDelay) {
                this.projectileLaunchTimer = 0;
                var direction = player.position.subtract(enemy.position).normalize();
                var projectile = new Projectile(this.projectileSprite, this.projectileSpeed, direction);
                projectile.tag = "hurt";
                projectile.position = enemy.position.copy();
                projectile.damage = this.projectileDamage;
            }
        }
    }
};