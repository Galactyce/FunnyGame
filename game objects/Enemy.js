function Enemy(sprite, x, y) {
    EnemyController.call(this);
    this.position = new powerupjs.Vector2(x || 0, y || 0);
    var enemySprite = sprite || (sprites && sprites.enemy) || (sprites && sprites.blank);
    this.loadAnimation(enemySprite, "normal", true, 0.1);
    this.playAnimation("normal");
    this.manageHitboxes(enemySprite);
}

Enemy.prototype = Object.create(EnemyController.prototype);
Enemy.prototype.constructor = Enemy;

// Making a new enemy can be done in loadAssets, in Game.initialize()
Enemy.types = [];

Enemy.registerType = function (type) {
    if (!type || typeof type.id !== "string" || !type.id) {
        throw new Error("Enemy type requires a non-empty id.");
    }

    for (var i = 0; i < Enemy.types.length; i++) {
        if (Enemy.types[i].id === type.id) {
            Enemy.types[i] = type;
            return type;
        }
    }

    Enemy.types.push(type);
    return type;
};

Enemy.resolveType = function (sprite, typeID) {
    if (typeof typeID === "string") {
        for (var typeIndex = 0; typeIndex < Enemy.types.length; typeIndex++) {
            if (Enemy.types[typeIndex].id === typeID) return Enemy.types[typeIndex];
        }
    }

    if (!sprite) return null;
    for (var i = 0; i < Enemy.types.length; i++) {
        var type = Enemy.types[i];
        if (typeof type.matches === "function" && type.matches(sprite)) return type;
        if (type.sprite === sprite) return type;
        if (type.sprite && type.sprite.image && sprite.image &&
            type.sprite.image.src === sprite.image.src) return type;
    }
    return null;
};

Enemy.resolveBehavior = function (name) {
    if (typeof name !== "string") return null;
    if (typeof BehaviorScriptOutline !== "undefined" && BehaviorScriptOutline.name === name) {
        return BehaviorScriptOutline;
    }
    for (var i = 0; i < Enemy.types.length; i++) {
        var behavior = Enemy.types[i].behavior;
        if (typeof behavior === "function" && behavior.name === name) return behavior;
    }
    return null;
};

Enemy.create = function (sprite, position, typeID, behaviorOverride) {
    var enemyPosition = position && typeof position.x === "number" && typeof position.y === "number"
        ? position
        : powerupjs.Vector2.zero;
    var type = Enemy.resolveType(sprite, typeID);
    if (typeof typeID === "function" || (typeID && typeof typeID === "object")) {
        behaviorOverride = typeID;
    } else if (typeof typeID === "string" && (!type || type.id !== typeID)) {
        behaviorOverride = typeID;
    }
    var enemy = type && typeof type.create === "function"
        ? type.create(sprite, enemyPosition.x, enemyPosition.y, behaviorOverride)
        : new Enemy(sprite, enemyPosition.x, enemyPosition.y);
    enemy.position = enemyPosition.copy ? enemyPosition.copy() : new powerupjs.Vector2(enemyPosition.x, enemyPosition.y);
    enemy.enemyType = type ? type.id : null;
    var behaviorType = type && type.behavior;
    if (typeof behaviorOverride === "string") {
        behaviorType = Enemy.resolveBehavior(behaviorOverride) || behaviorType;
    } else if (typeof behaviorOverride === "function") {
        behaviorType = behaviorOverride;
    } else if (behaviorOverride && typeof behaviorOverride === "object" &&
        typeof behaviorOverride.constructor === "function") {
        behaviorType = behaviorOverride.constructor;
    }
    if (typeof behaviorType === "function") {
        enemy.behavior = new behaviorType();
    }
    enemy.loadAnimations();
    enemy.origin = enemy.center;
    enemy.manageHitboxes();
    return enemy;
};

Enemy.fromData = function (enemyData) {
    if (!enemyData || typeof enemyData.x !== "number" || typeof enemyData.y !== "number") return null;

    var type = Enemy.resolveType(null, enemyData.type || enemyData.enemyType);
    var enemySprite = type && type.sprite ? type.sprite : sprites.enemy;
    if (!(type && type.sprite) && enemyData.sprite) {
        var candidates = Enemy.types.map(function (type) { return type.sprite; })
            .concat(WorldSettings.blockSprites);
        for (var i = 0; i < candidates.length; i++) {
            var candidate = candidates[i];
            if (candidate && candidate.image && candidate.image.src === enemyData.sprite) {
                enemySprite = candidate;
                break;
            }
        }
    }

    return Enemy.create(
        enemySprite,
        new powerupjs.Vector2(enemyData.x, enemyData.y),
        enemyData.type || enemyData.enemyType,
        enemyData.behavior
    );
};

Enemy.prototype.draw = function () {
    powerupjs.AnimatedGameObject.prototype.draw.call(this);
    if (WorldSettings.debugMode) {
        this.behavior.drawDebug(this);

        if (this.hitbox) {
            this.hitbox.draw("blue");
        }
        if (this.hurtbox) {
            this.hurtbox.draw("red");
        }
    }
}
