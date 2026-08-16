function Enemy(sprite, x, y) {
    powerupjs.AnimatedGameObject.call(this, 0, ID && ID.enemy ? ID.enemy : 0);
    this.position = new powerupjs.Vector2(x || 0, y || 0);
    var enemySprite = sprite || (sprites && sprites.enemy) || (sprites && sprites.blank);
    this.loadAnimation(enemySprite, "default", true, 0.1);
    this.loadAnimation(enemySprite, "normal", true, 0.1);
    this.playAnimation("normal");
    this.health = 100;
    this._hitbox = new powerupjs.Rectangle(this.position.x, this.position.y, this.sprite ? this.sprite.width : 0, this.sprite ? this.sprite.height : 0);
    this.hurtbox = new powerupjs.Rectangle(this.position.x, this.position.y, this.sprite ? this.sprite.width : 0, this.sprite ? this.sprite.height : 0);
    this.hitbox = this._hitbox;
}

Enemy.prototype = Object.create(powerupjs.AnimatedGameObject.prototype);

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