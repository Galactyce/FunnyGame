function Tile(sprite) {
    powerupjs.AnimatedGameObject.call(this);
    this.rotation = 0;
    this.key;
    this.index;
    this.hitboxType;
    this.loadAnimation(sprite, "normal", true, 0.2);
}

Tile.prototype = Object.create(powerupjs.AnimatedGameObject.prototype);

Tile.prototype.draw = function () {
    powerupjs.SpriteGameObject.prototype.draw.call(this);
    if (this.hitbox == undefined) return;
    if (powerupjs.Keyboard.down(powerupjs.Keys.P)) {
        this.showHitboxes(); // show hitboxes for debugging
    }
}

Tile.prototype.showHitboxes = function () {
    if (this.hitboxType == "hurt") // draw hurt hitboxes in red
        this.hitbox.draw("red")
    else this.hitbox.draw("blue") // draw solid hitboxes in blue
}

Tile.prototype.manageHitboxes = function (sprite) {
    sprite = typeof sprite !== 'undefined' ? sprite : this.sprite
    if (sprite.image.src == sprites.spike.image.src) {
        if (this.rotation == Math.PI/2) {
            console.log("PI / 2")
            this.hitbox = new powerupjs.Rectangle( // smaller hitbox for spikes
                this.position.x - this.origin.y,
                this.position.y - this.origin.x + (this.width / 3),
                this.height / 1.6,
                this.width / 3);
        } 
        else if (this.rotation == Math.PI) {
            console.log("PI")
            this.hitbox = new powerupjs.Rectangle( // smaller hitbox for spikes
                this.position.x - this.origin.x + (this.width / 3),
                this.position.y - this.origin.y,
                this.width / 3,
                this.height / 1.6);
        }
        else if (this.rotation == (3 * Math.PI) / 2) {
            console.log("3PI/2")
            this.hitbox = new powerupjs.Rectangle( // smaller hitbox for spikes
                this.position.x - this.origin.x / 3,
                this.position.y - this.origin.x + (this.width / 3),
                this.height / 1.6,
                this.width / 3);
        } 
        else {
            this.hitbox = new powerupjs.Rectangle( // smaller hitbox for spikes
                this.position.x - this.origin.x + (this.width / 3),
                this.position.y - this.origin.y + (this.height / 3),
                this.width / 3,
                this.height / 1.6);
        }
        this.hitboxType = "hurt"
    }
    else if (sprite.image.src == sprites.saw.image.src) {
        this.hitbox = new powerupjs.Circle(this.position.x, this.position.y, this.width / 2.4)
        this.hitboxType = "hurt"
    }
    else { // default solid hitbox
        this.hitbox = this.boundingBox;
        this.hitboxType = "solid"
    }
}
