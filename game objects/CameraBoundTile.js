function CameraBoundTile(sprite) {
	Tile.call(this, sprite || sprites.boundary);
	this.cameraBarrier = true;
	// Camera barriers should not collide with player physics.
	this.hitboxType = "void";
}

CameraBoundTile.prototype = Object.create(Tile.prototype);

CameraBoundTile.prototype.manageHitboxes = function (sprite) {
	Tile.prototype.manageHitboxes.call(this, sprite);
	// Always use a rectangular world-space barrier for camera collision.
	this.hitbox = this.boundingBox;
	this.hitboxType = "void";
};

CameraBoundTile.prototype.showHitboxes = function () {
	if (!this.hitbox) return;
	this.hitbox.draw("orange");
}
