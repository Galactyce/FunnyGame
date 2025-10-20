function LabelledButton(sprite, text, fontname, fontsize, layer, id) {
    powerupjs.Button.call(this, sprite, layer, id);
    this.label = new powerupjs.Label(fontname, fontsize, layer + 1);
    this.label.text = text;
    this.origin = this.center;
    this.label.textAlign = "center";
    this.label.origin = this.label.center;
    this.label.parent = this;
}

LabelledButton.prototype = Object.create(powerupjs.Button.prototype);

LabelledButton.prototype.draw = function() {
    powerupjs.Button.prototype.draw.call(this);
    this.label.draw();
    powerupjs.Canvas2D.drawRectangle(this.boundingBox)
}

Object.defineProperty(LabelledButton.prototype, "text", {
    get: function() {
        return this.label.text;
    },
    set: function(value) {
        this.label.text = value;
    }
})
