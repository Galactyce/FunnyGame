function CheckBox(text, font, fontSize, layer) {
    powerupjs.Button.call(this, sprites.checkBox, layer);
    this.text = text;
    this.font = font;
    this.fontSize = fontSize;
    this.checked = false;
    this.textLabel = new powerupjs.Label(this.font, this.fontSize, this.layer, 0, powerupjs.Color.white);
    this.textLabel.position = new powerupjs.Vector2(this.position.x + (this.width / 2) + 10, this.position.y);
}

CheckBox.prototype = Object.create(powerupjs.Button.prototype);

CheckBox.prototype.update = function (delta) {
    powerupjs.Button.prototype.update.call(this, delta);
    this.textLabel.text = this.text;
    this.textLabel.position = new powerupjs.Vector2(this.position.x + (this.width / 2) + 10, this.position.y);
    this.textLabel.update(delta);
}

CheckBox.prototype.handleInput = function (delta) {
    powerupjs.Button.prototype.handleInput.call(this, delta);
    if (this.pressed) {
        this.checked = !this.checked;
        if (this.checked) {
            this.sheetIndex = 1; // checked state
        }
        else {
            this.sheetIndex = 0; // unchecked state
        }
    }
}