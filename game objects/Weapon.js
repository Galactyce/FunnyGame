function Weapon() {
    var swordSprite = (sprites && sprites.sword) || (sprites && sprites.blank) || null;
    powerupjs.SpriteGameObject.call(this, swordSprite, 0, 0, ID && ID.weapon);
    this.sprite = swordSprite;
    this.range = 100;
    this.x = 0;
    this.y = 0;
    this.speed = 500;
    this.position = new powerupjs.Vector2(0, 0);
    this.damage = 10;
    
    this.swingRange = Math.PI; // Angle in degrees for the swing arc
    this.swingSpeed = 15; // Amount of time the swing takes in frames
    this.swinging = false;
}

Weapon.prototype = Object.create(powerupjs.SpriteGameObject.prototype);

Weapon.prototype.swing = function (delta) {
    if (!this.sprite) return;

    this.swinging = true;
    if (WorldSettings && WorldSettings.enemies && Array.isArray(WorldSettings.enemies)) {
        for (var i = 0; i < WorldSettings.enemies.length; i++) {
            var enemy = WorldSettings.enemies[i];
            if (enemy && this.isEnemyInRange(enemy)) {
                if (typeof enemy.takeDamage === "function") {
                    enemy.takeDamage(this.damage);
                }
            }
        }
    }

    if (typeof Projectile !== "undefined") {
        var launchDirection = powerupjs.Mouse.position.subtract(this.position.copy());
        launchDirection.normalize();

        var projectile = new Projectile(sprites && sprites.projectile, this.speed, launchDirection, this.damage, "sword");
        projectile.position = this.position.copy();
        return projectile;
    }
}

Weapon.prototype.update = function (delta) {
    powerupjs.SpriteGameObject.prototype.update.call(this, delta);
    if (this.swinging) {
        this.rotation += this.swingSpeed * delta;
        if (this.rotation >= this.swingRange) {
            this.swinging = false;
            this.rotation = 0;
        }
    }
    this.origin = new powerupjs.Vector2(
        this.sprite ? this.sprite.width / 2 : 0,
        this.sprite ? this.sprite.height : 0
    );
}

Weapon.prototype.isEnemyInRange = function (enemy) {
    var dx = enemy.x - this.x;
    var dy = enemy.y - this.y;
    var distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= this.range;
}