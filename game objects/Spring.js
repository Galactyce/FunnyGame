function Spring(sprite) {
    Tile.call(this, sprite);
    this.scale = 0.5;
    this.bounceHitbox;
    this.hitboxType = "void";
    this.bounceForce = 200;
}

Spring.prototype = Object.create(Tile.prototype);

Spring.prototype.manageHitboxes = function() {
    this.hitbox = new powerupjs.Rectangle((this.position.x - this.origin.x * this.scale), (this.position.y - this.origin.y * this.scale), 
        this.width * this.scale, this.height * this.scale)

    if (this.rotation == Math.PI / 2) 
        this.bounceHitbox = new powerupjs.Rectangle(
            this.hitbox.x, this.hitbox.y, this.hitbox.width / 2, this.hitbox.height
        );
    else if (this.rotation == Math.PI)
        this.bounceHitbox = new powerupjs.Rectangle(
            this.hitbox.x + 2, this.hitbox.y, this.hitbox.width - 4, this.hitbox.height / 2
        );
    else if (this.rotation == (3 * Math.PI) / 2)
        this.bounceHitbox = new powerupjs.Rectangle(
            this.hitbox.x + (this.hitbox.width / 2), this.hitbox.y, this.hitbox.width / 2, this.hitbox.height
        );
    else this.bounceHitbox = new powerupjs.Rectangle(
            this.hitbox.x + 2, this.hitbox.y + this.hitbox.height / 2, this.hitbox.width - 4, this.hitbox.height / 2
        );
}

Spring.prototype.draw = function() {
    Tile.prototype.draw.call(this);
    if (powerupjs.Keyboard.down(powerupjs.Keys.P)) {
        this.bounceHitbox.draw("green");
    }
}

Spring.prototype.update = function(delta) {
    if (!WorldSettings.activePlayer) return;
            var player = WorldSettings.activePlayer;
    if (player.hitbox.intersects(this.bounceHitbox)) {
        player.dashing = false;
        player.ableToDash = true;
        player.velocity.y = -Math.cos(this.rotation) * this.bounceForce - 30;
        player.velocity.x = Math.sin(this.rotation) * this.bounceForce / 1.5;
        if (Math.floor(Math.sin(this.rotation))) {
            player.velocity.y = -180
        }
        player.airDrag = false;
    }
}