var physicsProto = powerupjs.PhysicsGameObject ? powerupjs.PhysicsGameObject.prototype : null;
if (physicsProto && !Object.getOwnPropertyDescriptor(physicsProto, "moveSpeed")) {
    physicsProto.initialize = function() {
        this.detachBufferTime = 0.2;    // Time in takes to fall off wall after letting go 
        this.jumpKey = [
            powerupjs.Keys && powerupjs.Keys.space,
            powerupjs.Keys && powerupjs.Keys.up,
            powerupjs.Keys && powerupjs.Keys.W,
            powerupjs.Keys && powerupjs.Keys.C
        ].filter(function(key) { return typeof key === 'number'; });
        this.moveSpeed = 225;
        this.jumpForce = -460;
        this.accelerationMultiplier = 10;
        this.neutralJumpTime = 0.4;
        this.airResistance = 0.65;
        this.wallJumpForce = 300;
    };

    Object.defineProperty(physicsProto, "moveSpeed", { // get/set move speed
        get: function() {
            return this._moveSpeed;
        },
        set: function(value) {
            this._moveSpeed = value * this.scale;
        }
    });

    Object.defineProperty(physicsProto, "jumpForce", { // get/set jump force
        get: function() {
            return this._jumpForce;
        },
        set: function(value) {
            this._jumpForce = value * this.scale;
        }
    });

    Object.defineProperty(physicsProto, "acceleration", { // get/set acceleration multiplier
        get: function() {
            return this.accelerationMultiplier;
        },
        set: function(value) {
            this.accelerationMultiplier = value;
        }
    });

    Object.defineProperty(physicsProto, "airResistance", { // get/set air drag
        get: function() {
            return this._airResistance;
        },
        set: function(value) {
            this._airResistance = value;
        }
    });

    Object.defineProperty(physicsProto, "grounded", { // get/set grounded state
        get: function() {
            return this._grounded;
        },
        set: function(value) {
            this._grounded = value;
        }
    });

    Object.defineProperty(physicsProto, "onWall", { // get on wall state
        get: function() {
            if (this.tileLeft)
            return "left";
            else if (this.tileRight)
            return "right";
            else
            return null;
        }
    });

    Object.defineProperty(physicsProto, "neutralJumpTime", { // get/set neutral jump time
        get: function() {
            return this._neutralJumpTime;
        },
        set: function(value) {
            this._neutralJumpTime = value;
        }
    });

    Object.defineProperty(physicsProto, "tileColliding", { // get tiles currently colliding with player
        get: function() {
            return this.collidingTiles;
        }
    });

    Object.defineProperty(physicsProto, "baseVelocity", { // get/set base velocity
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