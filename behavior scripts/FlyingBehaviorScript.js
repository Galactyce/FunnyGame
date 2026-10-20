function FlyingBehaviorScript() {
    BehaviorScriptOutline.call(this);
    this.moveSpeed = 50;
    this.wanderDistance = 400; // Max distance from current position to new random position
    this.wanderWaitTime = 2; // Time to wait before choosing a new random position
    this.wandering = true;
    this.targetMarker = null;
    this.rerouting = false;
    this._wanderWaitRemaining = null;
    this._stuckTime = 0;
    this._lastMovePosition = null;
    this._commandedSpeed = 0;
    this._speedMultiplier = 1;
}

FlyingBehaviorScript.prototype = Object.create(BehaviorScriptOutline.prototype);
FlyingBehaviorScript.prototype.constructor = FlyingBehaviorScript;

FlyingBehaviorScript.prototype.drawDebug = function(enemy) {
    if (this.moveTarget === null) return;
    if (this.targetMarker === null) {
        this.targetMarker = new powerupjs.SpriteGameObject(sprites.crosshair);
        this.targetMarker.origin = this.targetMarker.center.copy();
    }
    this.targetMarker.parent = enemy.parent;
    this.targetMarker.position = this.moveTarget.copy();
    this.targetMarker.draw();
};

FlyingBehaviorScript.prototype.loadAnimations = function(enemy) {
    enemy.hitboxShape = "circle";
    enemy.hurtboxShape = "circle";
    enemy.adjustHitbox();
};


FlyingBehaviorScript.prototype.move = function(enemy, delta) {
    if (this.moveTarget === null) {
        if (this.wandering) {
            this.goToRandomPosition(enemy);
        } else {
            this.moveTarget = enemy.position.copy();
        }
    }

    var reachedTarget = this.moveTarget.subtract(enemy.position).length <= this.moveSpeed * delta;
    if (reachedTarget || this.hitTile(enemy)) {
        
        enemy.velocity = powerupjs.Vector2.zero;
        this._commandedSpeed = 0;
        this._speedMultiplier = 1;
        if (reachedTarget) this.rerouting = false;

        if (this.wandering) {
            if (this._wanderWaitRemaining === null) this._wanderWaitRemaining = this.wanderWaitTime;
            this._wanderWaitRemaining -= delta;
            if (this._wanderWaitRemaining <= 0) {
                this.goToRandomPosition(enemy);
            }
        }
    } else {
        this._wanderWaitRemaining = null;
        if (delta > 0 && this._commandedSpeed > 0) {
            var actualSpeed = enemy.actualVelocity.length;
            // Estimate movement loss from the previous command, not the ideal speed.
            this._speedMultiplier = actualSpeed > 0
                ? Math.clamp(this._commandedSpeed / actualSpeed, 1, 3)
                : 3;
        }
        var speed = this.moveSpeed * this._speedMultiplier;
        if (delta > 0) {
            speed = Math.min(speed, this.moveTarget.subtract(enemy.position).length / delta);
        }
        enemy.velocity = this.toTargetVector(enemy).multiply(speed);
        this._commandedSpeed = speed;
    }
};

FlyingBehaviorScript.prototype.hitTile = function(enemy) {
    return enemy.tileColliding;
    
};

FlyingBehaviorScript.prototype.update = function(enemy, delta) {
    BehaviorScriptOutline.prototype.update.call(this, enemy, delta);
    if (this._lastMovePosition === null ||
        enemy.position.subtract(this._lastMovePosition).length >= 0.5) {
        this._lastMovePosition = enemy.position.copy();
        this._stuckTime = 0;
    } else if (this.moveTarget !== null &&
        this.moveTarget.subtract(enemy.position).length > this.moveSpeed * delta) {
        this._stuckTime += delta;
        if (this._stuckTime >= this.wanderWaitTime) {
            this.rerouting = true;
            this.wandering = true;
            this.goToRandomPosition(enemy);
            enemy.velocity = powerupjs.Vector2.zero;
            return;
        }
    } else {
        this._stuckTime = 0;
        this._lastMovePosition = enemy.position.copy();
    }
    this.move(enemy, delta);
};

FlyingBehaviorScript.prototype.goToRandomPosition = function(enemy) {
    this._commandedSpeed = 0;
    this._speedMultiplier = 1;
    this._wanderWaitRemaining = this.wanderWaitTime;
    this._stuckTime = 0;
    this._lastMovePosition = enemy.position.copy();
    for (var attempt = 0; attempt < 20; attempt++) {
        var angle = Math.random() * Math.PI * 2;
        var distance = this.wanderDistance * Math.random();
        var target = enemy.position.add(
            new powerupjs.Vector2(Math.cos(angle), Math.sin(angle)).multiply(distance)
        );
        if (WorldSettings.cameraBounds.contains(target) && enemy.raycast(target) === null) {
            this.moveTarget = target;
            return true;
        }
    }
    this.moveTarget = enemy.position.copy();
    enemy.velocity = powerupjs.Vector2.zero;
    return false;
};

FlyingBehaviorScript.prototype.toTargetVector = function(enemy) {
    return this.moveTarget.subtract(enemy.position).normalize();
};