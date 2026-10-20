function EnemyController(ID) {
    powerupjs.PhysicsGameObject.call(this);
    this.behavior = new BehaviorScriptOutline();
    this.applyGravity = true;
    this.enemyID = ID;
    this.health = 100;
    this.attacks = {}; // eventID -> attack function
    this.lastAttackBeat = -1;
    this.lastAttackEventID = null;
    this.attacking = false;
    this.hurtboxShape = "rectangle";
    this.hurtbox = new powerupjs.Rectangle(this.position.x, this.position.y, 0, 0);
    this.circleHitbox = new powerupjs.Circle(this.position.x, this.position.y, 0);
}

EnemyController.prototype = Object.create(
    powerupjs.PhysicsGameObject.prototype,
);

EnemyController.prototype.constructor = EnemyController;

EnemyController.prototype.loadAnimations = function() {
    this.behavior.loadAnimations(this);
};

EnemyController.prototype.die = function () {
    this.behavior.die(this);
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

EnemyController.prototype.hitHurtbox = function() {
    powerupjs.PhysicsGameObject.prototype.hitHurtbox.call(this);
    this.behavior.handleHurtbox(this);
};

EnemyController.prototype.update = function (delta) {
    if (WorldSettings.currentState === "editing") {
        this.adjustHitbox();
        this.manageHitboxes();
        return;
    }

    this.tileLeft = false;
    this.tileRight = false;
    powerupjs.PhysicsGameObject.prototype.update.call(this, delta);
    this.behavior.update(this, delta);
    this.manageHitboxes();
    this.handleProjectileCollision();
    this.handlePlayerCollision();
    this.handleTileCollision();
};

EnemyController.prototype.canSeePlayer = function() {
    var player = WorldSettings.player;
    return !!player && this.raycast(player.position) === null;
};

EnemyController.prototype.handlePlayerCollision = function() {
    if (this.hitbox && WorldSettings && WorldSettings.playingState && WorldSettings.playingState.player) {
        var player = WorldSettings.playingState.player;
        if (player.hitbox && this.hitbox.intersects(player.hitbox)) {
            this.behavior.handlePlayerCollision(this, player);
        }
    }
};

EnemyController.prototype.handleTileCollision = function() {
    var tileHit = this.tileLeft ? -1 : this.tileRight ? 1 : 0;
    if (tileHit !== 0) {
        this.behavior.handleWallCollision(this, tileHit);
    }
    if (this.grounded) {
        this.behavior.handleFloorCollision(this);
    }
};

EnemyController.prototype.handleProjectileCollision = function(projectile) {
    // Handle collision with projectiles in the playing state
    var playingState = WorldSettings && WorldSettings.playingState;
    if (!playingState || !playingState.projectiles || !playingState.projectiles.length) return;

    for (var i = 0; i < playingState.projectiles.length; i++) {
        var projectile = playingState.projectiles.at(i);
        if (!projectile || projectile.tag !== "sword") continue; // Only consider sword projectiles
        if (!projectile.position || !this.hitbox) continue; // Skip if projectile or hitbox is not properly defined

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
    this.behavior.takeDamage(this);
    if (this.health <= 0) {
        this.behavior.die(this);
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
    if (this.behavior && typeof this.behavior.attack === "function") {
        this.behavior.attack(this, beat, songTime, node);
        return;
    }
    attackManager.perform("radial", this, this.position);
};

EnemyController.prototype.manageHitboxes = function (sprite) {
    var objSprite = sprite || this.sprite;
    if (!objSprite || !objSprite.image) return;

    this.hurtbox = this.createHitbox(new powerupjs.Rectangle(
        this.boundingBox.x + this.width / 16,
        this.boundingBox.y + this.height / 16,
        this.boundingBox.width - this.width / 8,
        this.boundingBox.height - this.height / 16
    ), this.hurtboxShape);
    this.adjustHitbox();
};

EnemyController.prototype.defineBoxes = function () {
    this.manageHitboxes();
};

EnemyController.prototype.destroy = function () { // Remove object from lists
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
