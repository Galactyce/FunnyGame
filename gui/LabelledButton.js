function LabelledButton(sprite, text, fontname, fontsize, layer, id) {
    powerupjs.Button.call(this, sprite, layer, id); // call Button constructor
    this.label = new powerupjs.Label(fontname, fontsize, layer + 1); // label on top of button
    this.label.text = text; // set label text
    this.label.origin = this.label.center; // set label origin to center
    this.origin = this.center; // set button origin to center
    this.label.textAlign = "center"; // center align text
    this.label.parent = this; // set label parent to button
}

LabelledButton.prototype = Object.create(powerupjs.Button.prototype);

LabelledButton.prototype.draw = function () {
    powerupjs.Button.prototype.draw.call(this);
    this.label.draw(); // draw the label
}

LabelledButton.prototype.update = function (delta) {
    powerupjs.Button.prototype.update.call(this, delta);
}

Object.defineProperty(LabelledButton.prototype, "text", {
    get: function () {
        return this.label.text;
    },
    set: function (value) {
        this.label.text = value;
    }
})

LabelledButton.prototype.resetText = function() {
    this.label.resetText();
}
