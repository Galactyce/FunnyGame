function Enemy(sprite, x, y) {
    powerupjs.AnimatedGameObject.call(this, 0, ID && ID.enemy ? ID.enemy : 0);
    this.position = new powerupjs.Vector2(x || 0, y || 0);
    var enemySprite = sprite || (sprites && sprites.enemy) || (sprites && sprites.blank);
    this.loadAnimation(enemySprite, "default", true, 0.1);
    this.loadAnimation(enemySprite, "normal", true, 0.1);
    this.playAnimation("normal");
    this.health = 100;
    this.attacks = {}; // eventID -> attack function
    this.lastAttackBeat = -1;
    this.lastAttackEventID = null;
    this.attacking = false;
    this._hitbox = new powerupjs.Rectangle(this.position.x, this.position.y, this.sprite ? this.sprite.width : 0, this.sprite ? this.sprite.height : 0);
    this.hurtbox = new powerupjs.Rectangle(this.position.x, this.position.y, this.sprite ? this.sprite.width : 0, this.sprite ? this.sprite.height : 0);
    this.hitbox = this._hitbox;
}

Enemy.prototype = Object.create(powerupjs.AnimatedGameObject.prototype);

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

Object.defineProperty(Enemy.prototype, "hitbox", {
    get: function () {
        if (!this._hitbox) {
            this._hitbox = new powerupjs.Rectangle(this.position.x, this.position.y, this.sprite ? this.sprite.width : 0, this.sprite ? this.sprite.height : 0);
        }
        return this._hitbox;
    },
    set: function (value) {
        this._hitbox = value;
    }
});

Enemy.prototype.takeDamage = function (amount) {
    this.health -= amount;
    console.log("Enemy took damage: " + amount + ", remaining health: " + this.health);
    if (this.health <= 0) {
        this.destroy();
    }
};

Enemy.prototype.update = function (delta) {
    powerupjs.AnimatedGameObject.prototype.update.call(this, delta);

    var playingState = WorldSettings && WorldSettings.playingState;
    if (playingState && playingState.projectiles && playingState.projectiles.length) {
        for (var i = 0; i < playingState.projectiles.length; i++) {
            var projectile = playingState.projectiles.at(i);
            if (!projectile || projectile.tag !== "sword") continue;
            if (!projectile.position || !this.hitbox) continue;

            var projectileRect = new powerupjs.Rectangle(
                projectile.position.x - (projectile.width || 8) / 2,
                projectile.position.y - (projectile.height || 8) / 2,
                projectile.width || 8,
                projectile.height || 8
            );

            if (this.hitbox.intersects(projectileRect)) {
                this.takeDamage(projectile.damage || 0);
                if (playingState.projectiles && typeof playingState.projectiles.remove === "function") {
                    playingState.projectiles.remove(projectile);
                }
                break;
            }
        }
    }
}

// Links an attack to a music EventNode; each eventID can drive its own attack function.
// attackFunction may also be a string naming an entry in attackManager.types.
// Registration works even if the node does not exist yet - call bindAttacks once it does.
Enemy.prototype.registerAttack = function (eventID, attackFunction, musicManager) {
    if (typeof attackFunction === "string") {
        var attackName = attackFunction;
        attackFunction = function (beat, songTime, node) {
            attackManager.perform(attackName, this, this.position);
        };
    }
    this.attacks[eventID] = typeof attackFunction === "function" ? attackFunction : this.attack;
    var music = musicManager || (WorldSettings && WorldSettings.music);
    if (!music) return null;
    var node = music.findEventNode(eventID);
    if (node !== null) node.addListener(this);
    return node;
};

Enemy.prototype.unregisterAttack = function (eventID, musicManager) {
    delete this.attacks[eventID];
    var music = musicManager || (WorldSettings && WorldSettings.music);
    if (!music) return;
    var node = music.findEventNode(eventID);
    if (node !== null) node.removeListener(this);
};

Enemy.prototype.bindAttacks = function (musicManager) {
    var music = musicManager || (WorldSettings && WorldSettings.music);
    if (!music) return;
    for (var eventID in this.attacks) {
        if (!this.attacks.hasOwnProperty(eventID)) continue;
        var node = music.findEventNode(eventID);
        if (node !== null) node.addListener(this);
    }
};

Enemy.prototype.unbindAttacks = function (musicManager) {
    var music = musicManager || (WorldSettings && WorldSettings.music);
    if (!music) return;
    for (var eventID in this.attacks) {
        if (!this.attacks.hasOwnProperty(eventID)) continue;
        var node = music.findEventNode(eventID);
        if (node !== null) node.removeListener(this);
    }
};

Enemy.prototype.onBeat = function (beat, songTime, node) {
    this.lastAttackBeat = beat;
    this.lastAttackEventID = node ? node.eventID : null;
    var attack = node ? this.attacks[node.eventID] : null;
    if (typeof attack === "function")
        attack.call(this, beat, songTime, node);
    else
        this.attack(beat, songTime, node);
};

// Fallback for event IDs registered without their own function.
Enemy.prototype.attack = function (beat, songTime, node) {
    this.attacking = true;
    attackManager.perform("radial", this, this.position);
};

Enemy.prototype.manageHitboxes = function (sprite) {
    var objSprite = sprite || this.sprite;
    if (!objSprite || !objSprite.image) return;

    this.hurtbox = new powerupjs.Rectangle(
        this.boundingBox.x + this.width / 16,
        this.boundingBox.y + this.height / 16,
        this.boundingBox.width - this.width / 8,
        this.boundingBox.height - this.height / 16
    );
    this.hitbox = this.boundingBox;
};

Enemy.prototype.defineBoxes = function () {
    this.manageHitboxes();
}

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

Enemy.prototype.destroy = function () {
    this.visible = false;
    this._visible = false;

    if (this.parent && typeof this.parent.remove === "function") {
        this.parent.remove(this);
    }

    var playingState = WorldSettings && WorldSettings.playingState;
    if (playingState && playingState.enemies && typeof playingState.enemies.remove === "function") {
        playingState.enemies.remove(this);
    }

    this.unbindAttacks();

    if (WorldSettings && Array.isArray(WorldSettings.enemies)) {
        for (var i = WorldSettings.enemies.length - 1; i >= 0; i--) {
            if (WorldSettings.enemies[i] === this) {
                WorldSettings.enemies.splice(i, 1);
            }
        }
    }

    if (playingState && playingState.currentLevel && playingState.currentLevel.room && playingState.currentLevel.room.tileFields) {
        for (var fieldIndex = 0; fieldIndex < playingState.currentLevel.room.tileFields.length; fieldIndex++) {
            var field = playingState.currentLevel.room.tileFields.at(fieldIndex);
            if (!field) continue;
            for (var tileIndex = field.length - 1; tileIndex >= 0; tileIndex--) {
                if (field.at(tileIndex) === this) {
                    field.remove(this);
                }
            }
        }
    }

    console.log("Enemy destroyed and removed from all tracked collections.");
}