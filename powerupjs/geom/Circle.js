var powerupjs = (function (powerupjs) {

function Circle(x, y, radius) {
    this.x = typeof x != 'undefined' ? x : 0;
    this.y = typeof y != 'undefined' ? y: 0;
    this.radius = typeof radius != 'undefined' ? radius : 0.5;
}

Object.defineProperties(Circle.prototype, {
    left: { get: function() { return this.x - this.radius; } },
    right: { get: function() { return this.x + this.radius; } },
    top: { get: function() { return this.y - this.radius; } },
    bottom: { get: function() { return this.y + this.radius; } },
    width: { get: function() { return this.radius * 2; } },
    height: { get: function() { return this.radius * 2; } },
    center: { get: function() { return new powerupjs.Vector2(this.x, this.y); } }
});

Circle.prototype.getContact = function(bounds) {
    if (!bounds) return null;
    var x;
    var y;
    var radius = this.radius;
    if (bounds.radius != null) {
        x = this.x - bounds.x;
        y = this.y - bounds.y;
        radius += bounds.radius;
    } else {
        x = this.x - Math.max(bounds.left, Math.min(this.x, bounds.right));
        y = this.y - Math.max(bounds.top, Math.min(this.y, bounds.bottom));
        if (x === 0 && y === 0) {
            // An embedded center must leave through the nearest face.
            var faces = [
                { distance: this.x - bounds.left, normal: new powerupjs.Vector2(-1, 0) },
                { distance: bounds.right - this.x, normal: new powerupjs.Vector2(1, 0) },
                { distance: this.y - bounds.top, normal: new powerupjs.Vector2(0, -1) },
                { distance: bounds.bottom - this.y, normal: new powerupjs.Vector2(0, 1) }
            ];
            var nearest = faces[0];
            for (var i = 1; i < faces.length; i++) {
                if (faces[i].distance < nearest.distance) nearest = faces[i];
            }
            return { normal: nearest.normal, depth: radius + nearest.distance };
        }
    }
    var distance = Math.sqrt(x * x + y * y);
    if (distance > radius) return null;
    return {
        normal: distance === 0 ? new powerupjs.Vector2(0, -1) : new powerupjs.Vector2(x / distance, y / distance),
        depth: radius - distance
    };
};

Circle.prototype.intersects = function(bounds) {
    return this.getContact(bounds) !== null;
};

Circle.prototype.contains = function(point) {
    var x = point.x - this.x;
    var y = point.y - this.y;
    return x * x + y * y <= this.radius * this.radius;
};

Circle.prototype.draw = function(color) {
    powerupjs.Canvas2D.drawCircle(this.x - powerupjs.Camera.position.x, this.y - powerupjs.Camera.position.y, this.radius, color);
}

powerupjs.Circle = Circle;
return powerupjs;

})(powerupjs || {});