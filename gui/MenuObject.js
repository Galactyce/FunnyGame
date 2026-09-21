function MenuObject(width, height, headerText, draggable) {
    powerupjs.GameObjectList.call(this, 0); // Assuming layer 0 for now
    this.ui = true;
    this.isOpen = false; // Menu is initially closed
    this.visible = false; // Menu is initially hidden
    this.consumedInput = false;
    this.draggable = typeof draggable !== "undefined" ? draggable : true;
    this.dragging = false;
    this.dragOffset = powerupjs.Vector2.zero;
    this.base = new powerupjs.NineSliceSpriteGameObject(sprites.window_ui.base, width, height, 24);
    this.base.ui = true;
    this.add(this.base);

    this.header = new powerupjs.NineSliceSpriteGameObject(sprites.window_ui.header, width, 50, 12);
    this.header.ui = true;
    this.add(this.header);

    this.headerText = new powerupjs.Label("Pixel", "20px", 0, 0, powerupjs.Color.white);
    this.headerText.text = headerText;
    this.headerText.origin = this.headerText.center;
    this.headerText.position = new powerupjs.Vector2(width / 2, this.header.boundingBox.height / 2);
    this.headerText.ui = true;
    this.add(this.headerText);

    this.buttons = new powerupjs.GameObjectList(0); // list of buttons within the menu
    this.add(this.buttons);

    this.objects = new powerupjs.GameObjectList(0); // list of objects within the menu
    this.add(this.objects);

    this.textObjects = new powerupjs.GameObjectList(0); // list of text objects within the menu
    this.add(this.textObjects);

    var bottom = this.headerText.boundingBox.bottom; 
    this.area = new powerupjs.Rectangle(0, 0, width, height - bottom); // area below the header
}

MenuObject.prototype = Object.create(powerupjs.GameObjectList.prototype);

Object.defineProperty(MenuObject.prototype, "boundingBox", {
    get: function () {
        return this.base.boundingBox;
    }
});

MenuObject.prototype.createButton = function (text, x, y, sprite) {
    var button;
    if (typeof sprite === "undefined")
        button = new LabelledButton(sprites.button_default, text, "Pixel", "18px", ID.layer_overlays_2);
    else
        button = new powerupjs.Button(sprite, ID.layer_overlays_2);
    button.position = new powerupjs.Vector2(x, y);
    button.scale = 0.6;
    button.ui = true;
    this.buttons.add(button);
    return button;
};

MenuObject.prototype.createTextObject = function(text, x, y, font, fontSize, color) {
    var label = new powerupjs.Label(font, fontSize, 0, 0, color);
    label.text = text;
    label.position = new powerupjs.Vector2(x, y);
    label.origin = powerupjs.Vector2.zero;
    label.ui = true;
    this.textObjects.add(label);
    return label;
};

MenuObject.prototype.addCloseButton = function(position) {
    this.closeButton = new powerupjs.Button(sprites.window_ui.buttons, 0);
    this.closeButton.frame = 0; // Assuming the close button is the first frame in the buttons sprite sheet
    this.closeButton.ui = true;
    this.closeButton.position = position;
    this.add(this.closeButton);
};

MenuObject.prototype.update = function(delta) {
    this.consumedInput = false;
    powerupjs.GameObjectList.prototype.update.call(this, delta);
    var baseBounds = this.base.boundingBox;
    this.area.x = baseBounds.x;
    this.area.y = this.header.boundingBox.bottom + 4;
    this.area.width = baseBounds.width;
    this.area.height = Math.max(0, baseBounds.bottom - this.area.y);
};

MenuObject.prototype.handleInput = function(input) {
    powerupjs.GameObjectList.prototype.handleInput.call(this, input);
    this.handleDrag(input);

    if (this.closeButton.boundingBox.contains(powerupjs.Mouse.screenPosition)) {
        console.log("Close button hovered");
    }
    if (this.closeButton && this.closeButton.pressed) {
        this.consumedInput = true;
        this.close(); // Close the menu and synchronize isOpen
    }
};

MenuObject.prototype.handleDrag = function(input) {
    if (!this.draggable) return;

    var mousePosition = powerupjs.Mouse.screenPosition;
    var parentPosition = this.parent ? this.parent.worldPosition : powerupjs.Vector2.zero;

    if (powerupjs.Mouse.left.pressed && this.header.boundingBox.contains(mousePosition)) {
        this.dragging = true;
        this.dragOffset = mousePosition.subtract(this.worldPosition);

        var topLevelMenu = this;
        while (topLevelMenu.parent && topLevelMenu.parent.parent) {
            topLevelMenu = topLevelMenu.parent;
        }
        if (topLevelMenu.parent && typeof topLevelMenu.parent.bringToFront === "function") {
            topLevelMenu.parent.bringToFront(topLevelMenu);
        }
    }

    if (this.dragging && powerupjs.Mouse.left.down) {
        var maxX = powerupjs.Game.size.x - parentPosition.x - this.base.width;
        var maxY = powerupjs.Game.size.y - parentPosition.y - this.base.height;
        var nextX = mousePosition.x - parentPosition.x - this.dragOffset.x;
        var nextY = mousePosition.y - parentPosition.y - this.dragOffset.y;
        this.position = new powerupjs.Vector2( // Keep the menu within the screen bounds
            Math.max(-parentPosition.x, Math.min(maxX, nextX)),
            Math.max(-parentPosition.y, Math.min(maxY, nextY))
        );
    }

    if (!powerupjs.Mouse.left.down) this.dragging = false;
};

MenuObject.prototype.close = function() {
    this.isOpen = false;
    this.visible = false; // Also hide the menu when it is closed
};

MenuObject.prototype.open = function() {
    this.isOpen = true;
    this.visible = true; // Show the menu when it is opened
};

MenuObject.prototype.toggle = function() {
    if (this.isOpen) {
        this.close();
    } else {
        this.open();
    }
};

MenuObject.prototype.draw = function(renderer) {
    if (!this.visible) return;
    powerupjs.GameObjectList.prototype.draw.call(this, renderer);
    powerupjs.Canvas2D.drawRectangle(
        this.area.x,
        this.area.y,
        this.area.width,
        this.area.height,
        powerupjs.Color.blue
    );
};