"use strict";

var powerupjs = (function (powerupjs) {

	function StretchyRectangle(x, y, width, height, minWidth, minHeight) {
		powerupjs.Rectangle.call(this, x, y, width, height);

		this.layer = 0;
		this.id = 0;
		this.parent = null;
		this.visible = true;
		this.minWidth = typeof minWidth === "number" ? minWidth : 1;
		this.minHeight = typeof minHeight === "number" ? minHeight : 1;
		this.handleSize = 1;
		this.draggingHandle = null;
		this.handles = {};

		this.createHandles();
		this.updateHandlePositions();
	}

	StretchyRectangle.prototype = Object.create(powerupjs.Rectangle.prototype);
	StretchyRectangle.prototype.constructor = StretchyRectangle;

	Object.defineProperty(StretchyRectangle.prototype, "position", {
		get: function () {
			return new powerupjs.Vector2(this.x, this.y);
		},
		set: function (value) {
			if (!value) return;
			this.x = value.x;
			this.y = value.y;
			this.updateHandlePositions();
		}
	});

	Object.defineProperty(StretchyRectangle.prototype, "worldPosition", {
		get: function () {
			return this.position.copy();
		}
	});

	Object.defineProperty(StretchyRectangle.prototype, "screenPosition", {
		get: function () {
			return this.position.subtract(powerupjs.Camera.position);
		}
	});

	Object.defineProperty(StretchyRectangle.prototype, "boundingBox", {
		get: function () {
			return new powerupjs.Rectangle(this.x, this.y, this.width, this.height);
		}
	});

	StretchyRectangle.prototype.update = function () {};

	StretchyRectangle.prototype.createHandles = function () {
		if (!powerupjs.SpriteGameObject || typeof sprites === "undefined" || !sprites.selectorCircle) return;

		var sides = ["left", "right", "top", "bottom"];
		for (var i = 0; i < sides.length; i++) {
			var side = sides[i];
			var handle = new powerupjs.SpriteGameObject(sprites.selectorCircle, 0, "stretchy_rectangle_" + side);
			handle.origin = handle.center;
			handle.ui = false;
			this.handles[side] = handle;
		}
	};

	StretchyRectangle.prototype.setBounds = function (x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = Math.max(this.minWidth, width);
		this.height = Math.max(this.minHeight, height);
		this.updateHandlePositions();
		return this;
	};

	StretchyRectangle.prototype.updateHandlePositions = function () {
		var centerX = this.x + this.width / 2;
		var centerY = this.y + this.height / 2;

		this.setHandlePosition("left", this.x, centerY);
		this.setHandlePosition("right", this.right, centerY);
		this.setHandlePosition("top", centerX, this.y);
		this.setHandlePosition("bottom", centerX, this.bottom);
	};

	StretchyRectangle.prototype.setHandlePosition = function (side, x, y) {
		if (this.handles[side]) this.handles[side].position = new powerupjs.Vector2(x, y);
	};

	StretchyRectangle.prototype.getHandleBounds = function (side) {
		var handle = this.handles[side];
		return handle ? handle.boundingBox : null;
	};

	StretchyRectangle.prototype.handleInput = function () {
		if (!powerupjs.Mouse || !powerupjs.Mouse.left) return;

		var mousePosition = powerupjs.Mouse.position;
		if (this.draggingHandle && powerupjs.Mouse.left.down) {
			this.resizeFromHandle(this.draggingHandle, mousePosition);
			return;
		}

		if (!powerupjs.Mouse.left.down) {
			this.draggingHandle = null;
			return;
		}

		var sides = ["left", "right", "top", "bottom"];
		for (var i = 0; i < sides.length; i++) {
			var handleBounds = this.getHandleBounds(sides[i]);
			if (handleBounds && handleBounds.contains(mousePosition)) {
				this.draggingHandle = sides[i];
				this.resizeFromHandle(sides[i], mousePosition);
				return;
			}
		}
	};

	StretchyRectangle.prototype.resizeFromHandle = function (side, mousePosition) {
		var right = this.right;
		var bottom = this.bottom;

		if (side === "left") {
			this.x = Math.min(mousePosition.x, right - this.minWidth);
			this.width = right - this.x;
		}
		else if (side === "right") {
			this.width = Math.max(this.minWidth, mousePosition.x - this.x);
		}
		else if (side === "top") {
			this.y = Math.min(mousePosition.y, bottom - this.minHeight);
			this.height = bottom - this.y;
		}
		else if (side === "bottom") {
			this.height = Math.max(this.minHeight, mousePosition.y - this.y);
		}

		this.updateHandlePositions();
	};

	StretchyRectangle.prototype.draw = function (color) {
		powerupjs.Rectangle.prototype.draw.call(this, color);

		for (var side in this.handles) {
			if (this.handles.hasOwnProperty(side)) this.handles[side].draw();
		}
	};

	powerupjs.StretchyRectangle = StretchyRectangle;
	return powerupjs;

})(powerupjs || {});
