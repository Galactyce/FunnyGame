var powerupjs = (function (powerupjs) {

function Circle(x, y, radius) {
    this.x = typeof x != 'undefined' ? x : 0;
    this.y = typeof y != 'undefined' ? y: 0;
    this.radius = typeof radius != 'undefined' ? radius : 0.5;
}

Circle.prototype.intersects = function(circle)
{    
    x1 = this.x;
    x2 = circle.x;
    y1 = this.y;
    y2 = circle.y;

    d = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    return (d < this.radius + circle.radius)
}

Circle.prototype.draw = function(color) {
    powerupjs.Canvas2D.drawCircle(this.x - powerupjs.Camera.position.x, this.y - powerupjs.Camera.position.y, this.radius, color);
}

powerupjs.Circle = Circle;
return powerupjs;

})(powerupjs || {});