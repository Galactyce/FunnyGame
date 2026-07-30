function CheckBox(text, font, fontSize, layer) {
    // Support constructor overload: new CheckBox(text, layer)
    if (typeof font === "number" && typeof fontSize === "undefined" && typeof layer === "undefined") {
        layer = font;
        font = "Arial";
        fontSize = "20px";
    }

    font = (typeof font === "string" && font.length > 0) ? font : "Arial";
    fontSize = (typeof fontSize === "string" && fontSize.length > 0) ? fontSize : "20px";
    layer = (typeof layer === "number") ? layer : ID.layer_overlays;

    powerupjs.Button.call(this, sprites.checkBox, layer);
    this.text = text;
    this.font = font;
    this.fontSize = fontSize;
    this.checked = false;
    this.textLabel = new powerupjs.Label(this.font, this.fontSize, this.layer, 0, powerupjs.Color.white);
    this.textLabel.ui = true;
    this.textLabel.text = this.text;
}

CheckBox.prototype = Object.create(powerupjs.Button.prototype);

CheckBox.prototype.update = function (delta) {
    powerupjs.Button.prototype.update.call(this, delta);
    this.textLabel.text = this.text;
    this.textLabel.position = new powerupjs.Vector2(this.position.x - (this.width * 2), this.position.y + 7);
    this.textLabel.update(delta);
}

CheckBox.prototype.draw = function () {
    powerupjs.Button.prototype.draw.call(this);
    this.textLabel.draw();
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