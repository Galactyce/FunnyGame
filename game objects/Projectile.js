function Projectile(sprite, speed, direction, damage, tag) {
    var projectileSprite = sprite || (sprites && sprites.projectile) || (sprites && sprites.blank);
    powerupjs.AnimatedGameObject.call(this, 0, ID && ID.projectile ? ID.projectile : 0);
    this.position = new powerupjs.Vector2(0, 0);
    this.speed = speed || 0;
    this.damage = damage || 0;
    this.direction = direction && direction.copy ? direction.copy() : new powerupjs.Vector2(1, 0);
    this.direction.normalize();
    this.rotation = Math.atan2(this.direction.y, this.direction.x);
    this.tag = tag || "projectile";
    var playingState = WorldSettings && WorldSettings.playingState;
    if (playingState && playingState.projectiles) {
        playingState.projectiles.add(this);
    }

    if (projectileSprite) {
        this.loadAnimation(projectileSprite, "default", true, 0.1);
        this.playAnimation("default");
    }
}

Projectile.prototype = Object.create(powerupjs.AnimatedGameObject.prototype);

Projectile.prototype.update = function(delta) {
    powerupjs.AnimatedGameObject.prototype.update.call(this, delta);
    if (!this.direction) return;
    this.position = this.position.add(this.direction.multiply(this.speed * delta));
    this.rotation = Math.atan2(this.direction.y, this.direction.x);
}