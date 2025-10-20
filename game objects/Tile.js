function Tile(sprite) {
    powerupjs.SpriteGameObject.call(this, sprite);
    this.key;
    this.index;
    this.hitboxType;
}

Tile.prototype = Object.create(powerupjs.SpriteGameObject.prototype);

Tile.prototype.draw = function () {
    powerupjs.SpriteGameObject.prototype.draw.call(this);
    if (this.hitbox == undefined) return;
    if (powerupjs.Keyboard.down(powerupjs.Keys.P)) this.showHitboxes(); // show hitboxes for debugging
}

Tile.prototype.showHitboxes = function () {
    if (this.hitboxType == "hurt") // draw hurt hitboxes in red
        this.hitbox.draw("red")
    else this.hitbox.draw("blue") // draw solid hitboxes in blue
}

Tile.prototype.manageHitboxes = function (sprite) {
    if (sprite.image.src == sprites.spike.image.src) {
        this.hitbox = new powerupjs.Rectangle( // smaller hitbox for spikes
            this.position.x - this.origin.x + (this.width / 3),
            this.position.y - this.origin.y + (this.height / 3),
            this.width / 3,
            this.height / 1.6);
        this.hitboxType = "hurt"
    }
    else { // default solid hitbox
        this.hitbox = this.boundingBox;
        this.hitboxType = "solid"
    }
}
