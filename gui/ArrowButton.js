function ArrowButton(direction) {
    powerupjs.Button.call(this, sprites.arrowButtons);
    this.direction = direction;
    this.manageSprite();
}

ArrowButton.prototype = Object.create(powerupjs.Button.prototype);

ArrowButton.prototype.manageSprite = function() {
    if (this.direction == "left") {
        this.sheetIndex = 0
    }
    else if (this.direction == "right") {
        this.sheetIndex = 1
    }
    else if (this.direction == "up") {
        this.sheetIndex = 2
    }
    else {
        this.sheetIndex = 3;
    }
}