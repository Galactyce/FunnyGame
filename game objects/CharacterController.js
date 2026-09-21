function CharacterController(layer, id) {
	powerupjs.PhysicsGameObject.call(this, layer, id);
}

CharacterController.prototype = Object.create(powerupjs.PhysicsGameObject.prototype);
CharacterController.prototype.constructor = CharacterController;

CharacterController.prototype.initialize = function () {
	powerupjs.PhysicsGameObject.prototype.initialize.call(this);
	this.detaching = false;
	this.detachTime = 0;
	this.detachBufferTime = 0.2;
	this.previousWallJumpDir = "";
	this.jumpAvailable = true;
	this.timeAfterWallJump = 0;
	this.resetJumpVelo = false;
	this.neutralJumpTime = 0.4;
	this.jumpKey = [
		powerupjs.Keys && powerupjs.Keys.space,
		powerupjs.Keys && powerupjs.Keys.up,
		powerupjs.Keys && powerupjs.Keys.W,
		powerupjs.Keys && powerupjs.Keys.C
	].filter(function(key) { return typeof key === "number"; });
	this.moveSpeed = 225;
	this.jumpForce = -460;
	this.wallJumpForce = 300;
	this.wallSlideDirection = 0;
	this.wallSlideRequested = false;
};

CharacterController.prototype.update = function (delta) {
	powerupjs.PhysicsGameObject.prototype.update.call(this, delta);
	this.updateDetachState(delta);
};

CharacterController.prototype.move = function (direction, delta) {
	if (typeof direction === "string") {
		direction = direction === "left" ? -1 : direction === "right" ? 1 : 0;
	}

	direction = typeof direction === "number" ? Math.clamp(direction, -1, 1) : 0;
	delta = typeof delta === "number" ? delta : 0;

	if (direction === 0) {
		this.stopMoving();
		return;
	}

	var speed = this.moveSpeed || 0;
	if (this.previousWallJumpDir === (direction < 0 ? "right" : "left")) speed /= 2;
	if (this.velocity.x * direction < 0 && this.grounded) this.velocity.x = 0;
	var acceleration = Math.max(0, this.accelerationMultiplier) * delta;
	this.velocity.x += direction * speed * acceleration;
	this.capMoveSpeed();
	this.directionFacing = direction < 0 ? "left" : "right";
	this.mirror = direction < 0;
	this.wallSlideDirection = direction;
	this.wallSlideRequested = true;
	if (!this.grounded && (this.tileLeft || this.tileRight)) this.detachFromWall();
};

CharacterController.prototype.stopMoving = function () {
	if ((this.grounded || this.timeAfterWallJump > this.neutralJumpTime) &&
		Math.abs(this.baseVelocity) < 1 && this.airDrag) {
		this.velocity.x = this.baseVelocity;
	}
	else {
		this.velocity.x *= this.airResistance;
	}
	this.tileLeft = false;
	this.tileRight = false;
	this.wallSlideDirection = 0;
	this.wallSlideRequested = false;
};

CharacterController.prototype.simulateGravity = function () {
	var pressingAgainstWall = this.wallSlideRequested &&
		((this.tileLeft && this.wallSlideDirection < 0) ||
		(this.tileRight && this.wallSlideDirection > 0));

	if (pressingAgainstWall && this.velocity.y > 10 && !this.grounded) {
		this.velocity.y = WorldSettings.wallSlideSpeed * this.scale;
	}
	else {
		this.velocity.y += WorldSettings.gravity * this.scale;
	}

	if (this.velocity.y > WorldSettings.terminalVelocity * this.scale) {
		this.velocity.y = WorldSettings.terminalVelocity * this.scale;
	}
};

CharacterController.prototype.jump = function () {
	if (!this.jumpAvailable) return false;

	this.velocity.y = 0;
	this.applyForce(new powerupjs.Vector2(0, this.jumpForce), true);
	this.jumpAvailable = false;
	this.timeAfterWallJump = 0;
	this.resetJumpVelo = true;
	return true;
};

CharacterController.prototype.wallJump = function (wall) {
	if (this.grounded || !this.jumpAvailable) return false;

	if (wall === "left") wall = -1;
	if (wall === "right") wall = 1;
	if (wall !== -1 && wall !== 1) {
		wall = this.tileLeft ? -1 : this.tileRight ? 1 : 0;
	}
	if (wall === 0) return false;

	if (!this.jump()) return false;
	this.velocity.x = wall < 0 ? this.wallJumpForce : -this.wallJumpForce;
	this.previousWallJumpDir = wall < 0 ? "right" : "left";
	this.detachFromWall();
	return true;
};

CharacterController.prototype.slide = function () {
	var pressingAgainstWall = this.wallSlideRequested &&
		((this.tileLeft && this.wallSlideDirection < 0) ||
		(this.tileRight && this.wallSlideDirection > 0));
	if (this.grounded || !pressingAgainstWall) return false;

	this.velocity.y = WorldSettings.wallSlideSpeed * this.scale;
	return true;
};

CharacterController.prototype.resolveVerticalTileCollision = function (tile, tileBounds, boundingBox, depth) {
	var hitTileFromBelow = depth.y > 0 && this.velocity.y < 0;
	var landed = powerupjs.PhysicsGameObject.prototype.resolveVerticalTileCollision.call(
		this,
		tile,
		tileBounds,
		boundingBox,
		depth
	);
	if (hitTileFromBelow) this.jumpAvailable = false;
	this.detachFromWall();
	return landed;
};

CharacterController.prototype.resolveHorizontalTileCollision = function (depth, tileBounds) {
	var resolved = powerupjs.PhysicsGameObject.prototype.resolveHorizontalTileCollision.call(this, depth, tileBounds);
	if (resolved) this.detaching = false;
	return resolved;
};

CharacterController.prototype.updateDetachState = function (delta) {
	if (!this.detaching) return;

	this.detachTime -= delta;
	if (this.detachTime > 0) return;

	this.tileLeft = false;
	this.tileRight = false;
	this.detaching = false;
};

CharacterController.prototype.detachFromWall = function () {
	if (this.detaching) return;

	this.detaching = true;
	this.detachTime = this.detachBufferTime;
};

Object.defineProperty(CharacterController.prototype, "isDetaching", {
	get: function() {
		return this.detaching;
	}
});

Object.defineProperty(CharacterController.prototype, "isWallJumping", {
	get: function() {
		return this.previousWallJumpDir != "";
	}
});

Object.defineProperty(CharacterController.prototype, "isOnWall", {
	get: function() {
		return this.tileLeft || this.tileRight;
	}
});

Object.defineProperty(CharacterController.prototype, "isWallSliding", {
	get: function() {
		return (this.tileLeft || this.tileRight) && !this.grounded;
	}
});

Object.defineProperty(CharacterController.prototype, "isJumping", {
	get: function() {
		return this.velocity.y < 0;
	}
});

Object.defineProperty(CharacterController.prototype, "isJumpCutting", {
	get: function() {
		return this.resetJumpVelo;
	}
});

Object.defineProperty(CharacterController.prototype, "neutralJumpTime", {
	get: function() {
		return this._neutralJumpTime;
	},
	set: function(value) {
		this._neutralJumpTime = value;
	}
});

Object.defineProperty(CharacterController.prototype, "jumpForce", {
	get: function() {
		return this._jumpForce;
	},
	set: function(value) {
		this._jumpForce = value * this.scale;
	}
});

Object.defineProperty(CharacterController.prototype, "onWall", {
	get: function() {
		if (this.tileLeft)
			return "left";
		else if (this.tileRight)
			return "right";
		else
			return null;
	}
});