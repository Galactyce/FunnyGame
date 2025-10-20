function Player(layer, id) {
    powerupjs.AnimatedGameObject.call(this, layer, id);
    this.currentLevelIndex;
    this.previousYPosition;
    this.jumpKey = powerupjs.Keys.C;
    this.moveSpeed = 55;
    this.jumpForce = -155;
    this.spawnPosition;
}

Player.prototype = Object.create(powerupjs.AnimatedGameObject.prototype);

Player.prototype.update = function(delta) {
    powerupjs.AnimatedGameObject.prototype.update.call(this, delta);
        this.origin = this.center;
    this.adjustHitbox();
    this.simulateGravity();
    this.handleCollisions();

    powerupjs.Camera.position = new powerupjs.Vector2(this.position.x - powerupjs.Game.size.x / 2,
        this.position.y - powerupjs.Game.size.y / 2
    );
}

Player.prototype.adjustHitbox = function() {

    this.hitbox = new powerupjs.Rectangle(this.boundingBox.x + this.width / 16, this.boundingBox.y + this.height / 16,
        this.boundingBox.width - this.width / 8, this.boundingBox.height - this.height / 16
    ) 
    
}

Player.prototype.simulateGravity = function() {
        this.velocity.y += WorldSettings.gravity;
    
}

Player.prototype.handleCollisions = function() {
    for (var i = 0; i < WorldSettings.levels[this.currentLevelIndex].tileFields.length; i++) {
            var field = WorldSettings.levels[this.currentLevelIndex].tileFields[i];

            for (var l = 0; l < field.length; l++) {
                var tile = field.at(l);
                var tileBounds = tile.hitbox;
                var boundingBox = this.hitbox;
                // boundingBox.height += 1;

                if (!tileBounds.intersects(boundingBox))
                    continue;
                if (tile.hitboxType == "hurt") {
                    this.position = this.spawnPosition.copy();
                }
                
                    var depth = boundingBox.calculateIntersectionDepth(tileBounds);
                    console.log(depth.y)
                    if (Math.abs(depth.x) < Math.abs(depth.y)) {
                        this.position.x += depth.x;
                    }
                       else if (this.previousYPosition <= tileBounds.top) {
                            if (this.velocity.y > 0) this.grounded = true;
                            this.velocity.y = 0;
                            this.position.y += depth.y;
                        }
                        else if (boundingBox.top <= tileBounds.bottom) {
                            this.velocity.y *= -0.1;
                            this.position.y += depth.y;
                        }
                    
                }
                if (this.velocity.y != 0) this.grounded = false;
            
    }
    this.previousYPosition = this.position.y;
}

Player.prototype.groundCheck = function() {

}


Player.prototype.handleInput = function(delta) {
    powerupjs.AnimatedGameObject.prototype.handleInput.call(this, delta);
    
    if (powerupjs.Keyboard.down(powerupjs.Keys.left)) {
        this.velocity.x = -this.moveSpeed;
        this.mirror = true;
    }
    else if (powerupjs.Keyboard.down(powerupjs.Keys.right)) {
        this.velocity.x = this.moveSpeed;
        this.mirror = false
    }
    else {
        this.velocity.x = 0;
    }
    if (powerupjs.Keyboard.down(this.jumpKey)) {
        if (this.grounded) {
            this.velocity.y = this.jumpForce;
        }
    }
    else {
        if (this.velocity.y < 0) {
            this.velocity.y /= 1.06;
        }
    }
}

Player.prototype.draw = function() {
    powerupjs.AnimatedGameObject.prototype.draw.call(this);
    this.hitbox.draw()
}