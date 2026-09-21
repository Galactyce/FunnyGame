if (typeof Player !== "undefined") {
    Player.prototype.initialize = function() {
        CharacterController.prototype.initialize.call(this);
        this.moveSpeed = 225;
        this.jumpForce = -460;
        this.accelerationMultiplier = 10;
        this.airResistance = 0.65;
    };

    Object.defineProperty(Player.prototype, "moveSpeed", { // get/set move speed
        get: function() {
            return this._moveSpeed;
        },
        set: function(value) {
            this._moveSpeed = value * this.scale;
        }
    });

    Object.defineProperty(Player.prototype, "acceleration", { // get/set acceleration multiplier
        get: function() {
            return this.accelerationMultiplier;
        },
        set: function(value) {
            this.accelerationMultiplier = value;
        }
    });

    Object.defineProperty(Player.prototype, "airResistance", { // get/set air drag
        get: function() {
            return this._airResistance;
        },
        set: function(value) {
            this._airResistance = value;
        }
    });

    Object.defineProperty(Player.prototype, "grounded", { // get/set grounded state
        get: function() {
            return this._grounded;
        },
        set: function(value) {
            this._grounded = value;
        }
    });

    Object.defineProperty(Player.prototype, "tileColliding", { // get tiles currently colliding with player
        get: function() {
            return this.collidingTiles;
        }
    });

    Object.defineProperty(Player.prototype, "baseVelocity", { // get/set base velocity
        get: function() {
            return this._baseVelocity;
        },
        set: function(value) {
            this._baseVelocity = value;
        }
    });
}

// Object.defineProperty(physicsProto, "hitbox", { // get/set bounding box
//     get: function() {
//         return this.hitbox;
//     }
// });