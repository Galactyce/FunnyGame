function Enemy(sprite, x, y) {
    EnemyController.call(this);
    this.position = new powerupjs.Vector2(x || 0, y || 0);
    var enemySprite = sprite || (sprites && sprites.enemy) || (sprites && sprites.blank);
    this.loadAnimation(enemySprite, "default", true, 0.1);
    this.loadAnimation(enemySprite, "normal", true, 0.1);
    this.playAnimation("normal");
    this.manageHitboxes(enemySprite);
}

Enemy.prototype = Object.create(EnemyController.prototype);
Enemy.prototype.constructor = Enemy;

// Pluggable enemy subclasses. To add a new enemy type (distinct class/behavior),
// push one entry here instead of editing Enemy.create/Enemy.fromData directly.
Enemy.types = [];

Enemy.resolveType = function (sprite) {
    if (!sprite || !sprite.image) return null;
    for (var i = 0; i < Enemy.types.length; i++) {
        if (Enemy.types[i].matches(sprite)) return Enemy.types[i];
    }
    return null;
};

Enemy.create = function (sprite, position) {
    var enemyPosition = position && typeof position.x === "number" && typeof position.y === "number"
        ? position
        : powerupjs.Vector2.zero;
    var type = Enemy.resolveType(sprite);
    var enemy = type ? type.create(sprite, enemyPosition.x, enemyPosition.y) : new Enemy(sprite, enemyPosition.x, enemyPosition.y);
    enemy.position = enemyPosition.copy ? enemyPosition.copy() : new powerupjs.Vector2(enemyPosition.x, enemyPosition.y);
    enemy.origin = enemy.center;
    enemy.manageHitboxes(sprite);
    return enemy;
};

Enemy.fromData = function (enemyData) {
    if (!enemyData || typeof enemyData.x !== "number" || typeof enemyData.y !== "number") return null;

    var enemySprite = sprites.enemy;
    if (enemyData.sprite) {
        for (var i = 0; i < WorldSettings.blockSprites.length; i++) {
            var candidate = WorldSettings.blockSprites[i];
            if (candidate && candidate.image && candidate.image.src === enemyData.sprite) {
                enemySprite = candidate;
                break;
            }
        }
    }

    return Enemy.create(enemySprite, new powerupjs.Vector2(enemyData.x, enemyData.y));
};

Enemy.prototype.draw = function () {
    powerupjs.AnimatedGameObject.prototype.draw.call(this);
    if (WorldSettings.debugMode) {

        if (this.hitbox) {
            this.hitbox.draw("blue");
        }
        if (this.hurtbox) {
            this.hurtbox.draw("red");
        }
    }
}
