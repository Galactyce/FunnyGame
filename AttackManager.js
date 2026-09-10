function AttackManager() {
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

var attackManager = new AttackManager();