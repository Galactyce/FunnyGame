function AttackManager() {
    // Named attack patterns. To add a new attack usable by name from anywhere
    // (Enemy.registerAttack, level setups, etc.), just push one entry here.
    this.types = {
        radial: function (enemy, position, options) {
            options = options || {};
            attackManager.radialAttack(
                position,
                options.count || 8,
                options.speed || 400,
                options.sprite || sprites.projectile,
                options.scale || 1,
                options.rotationOffset || 0,
                options.damage || 0,
                options.tag
            );
        }
    };
}

AttackManager.prototype.radialAttack = function (position, projectileCount, projectileSpeed, projectileSprite, projectileScale, projectileRotationOffset, damage, tag) {
    var angleIncrement = (2 * Math.PI) / projectileCount;
    for (var i = 0; i < projectileCount; i++) {
        var angle = i * angleIncrement + (projectileRotationOffset || 0);
        var direction = new powerupjs.Vector2(Math.cos(angle), Math.sin(angle));
        // Projectile registers itself with the playing state's projectile list.
        var projectile = new Projectile(projectileSprite, projectileSpeed, direction, damage || 0, tag || "enemy");
        projectile.position = position.copy();
        projectile.scale = projectileScale || 1;
    }
};

// Looks up a named attack type and runs it; returns false if the name isn't registered.
AttackManager.prototype.perform = function (name, enemy, position, options) {
    var attack = this.types[name];
    if (typeof attack !== "function") return false;
    attack(enemy, position, options);
    return true;
};

var attackManager = new AttackManager();