function EnemyController(ID) {
    powerupjs.PhysicsGameObject.call(this);
    this.applyGravity = false;
    this.enemyID = ID;
    this.health = 100;
    this.attacks = {}; // eventID -> attack function
    this.lastAttackBeat = -1;
    this.lastAttackEventID = null;
    this.attacking = false;
    this.hurtbox = new powerupjs.Rectangle(this.position.x, this.position.y, 0, 0);
    this.circleHitbox = new powerupjs.Circle(this.position.x, this.position.y, 0);
}

EnemyController.prototype = Object.create(
    powerupjs.PhysicsGameObject.prototype,
);

EnemyController.prototype.constructor = EnemyController;

EnemyController.prototype.adjustHitbox = function () {
    powerupjs.PhysicsGameObject.prototype.adjustHitbox.call(this);
    this.circleHitbox = new powerupjs.Circle(
        this.position.x,
        this.position.y,
        this.hitbox.width / 2
    );
};

EnemyController.prototype.die = function () {
    this.destroy();
};

Object.defineProperty(EnemyController.prototype, "hitbox", {
    get: function () {
        if (!this._hitbox) {
            this._hitbox = new powerupjs.Rectangle(
                this.position.x,
                this.position.y,
                this.sprite ? this.sprite.width : 0,
                this.sprite ? this.sprite.height : 0
            );
        }
        return this._hitbox;
    },
    set: function (value) {
        this._hitbox = value;
    }
});

EnemyController.prototype.update = function (delta) {
    powerupjs.PhysicsGameObject.prototype.update.call(this, delta);
    this.manageHitboxes();

    var playingState = WorldSettings && WorldSettings.playingState;
    if (!playingState || !playingState.projectiles || !playingState.projectiles.length) return;

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
            if (typeof playingState.projectiles.remove === "function") {
                playingState.projectiles.remove(projectile);
            }
            break;
        }
    }
};

EnemyController.prototype.takeDamage = function (amount) {
    this.health -= amount;
    console.log("Enemy took damage: " + amount + ", remaining health: " + this.health);
    if (this.health <= 0) {
        this.destroy();
    }
};

// Links an attack to a music EventNode; each eventID can drive its own attack function.
// attackFunction may also be a string naming an entry in attackManager.types.
EnemyController.prototype.registerAttack = function (eventID, attackFunction, musicManager) {
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

EnemyController.prototype.unregisterAttack = function (eventID, musicManager) {
    delete this.attacks[eventID];
    var music = musicManager || (WorldSettings && WorldSettings.music);
    if (!music) return;
    var node = music.findEventNode(eventID);
    if (node !== null) node.removeListener(this);
};

EnemyController.prototype.bindAttacks = function (musicManager) {
    var music = musicManager || (WorldSettings && WorldSettings.music);
    if (!music) return;
    for (var eventID in this.attacks) {
        if (!this.attacks.hasOwnProperty(eventID)) continue;
        var node = music.findEventNode(eventID);
        if (node !== null) node.addListener(this);
    }
};

EnemyController.prototype.unbindAttacks = function (musicManager) {
    var music = musicManager || (WorldSettings && WorldSettings.music);
    if (!music) return;
    for (var eventID in this.attacks) {
        if (!this.attacks.hasOwnProperty(eventID)) continue;
        var node = music.findEventNode(eventID);
        if (node !== null) node.removeListener(this);
    }
};

EnemyController.prototype.onBeat = function (beat, songTime, node) {
    this.lastAttackBeat = beat;
    this.lastAttackEventID = node ? node.eventID : null;
    var attack = node ? this.attacks[node.eventID] : null;
    if (typeof attack === "function")
        attack.call(this, beat, songTime, node);
    else
        this.attack(beat, songTime, node);
};

EnemyController.prototype.attack = function (beat, songTime, node) {
    this.attacking = true;
    attackManager.perform("radial", this, this.position);
};

EnemyController.prototype.manageHitboxes = function (sprite) {
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

EnemyController.prototype.defineBoxes = function () {
    this.manageHitboxes();
};

EnemyController.prototype.destroy = function () {
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
};
