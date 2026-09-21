 (function (powerupjs) {
    function NineSliceSpriteGameObject(sprite, width, height, cornerSize, layer, id) {
        powerupjs.GameObject.call(this, layer, id);
        this.sprite = sprite || sprites.blank;
        this.width = width || this.sprite.width;
        this.height = height || this.sprite.height;
        this.cornerSize = cornerSize || Math.min(16, this.sprite.width / 3, this.sprite.height / 3);
        this.ui = false;
    }

    NineSliceSpriteGameObject.prototype = Object.create(powerupjs.GameObject.prototype);
    NineSliceSpriteGameObject.prototype.constructor = NineSliceSpriteGameObject;

    Object.defineProperty(NineSliceSpriteGameObject.prototype, "boundingBox", {
        get: function () {
            return new powerupjs.Rectangle(this.worldPosition.x, this.worldPosition.y, this.width, this.height);
        }
    });

    NineSliceSpriteGameObject.prototype.draw = function () {
        if (!this._visible || !this.sprite || !this.sprite.image || !powerupjs.Canvas2D._canvasContext) return;

        var context = powerupjs.Canvas2D._canvasContext;
        var canvasScale = powerupjs.Canvas2D.scale;
        var position = this.ui ? this.worldPosition : this.screenPosition;
        var sourceWidth = this.sprite.width;
        var sourceHeight = this.sprite.height;
        var edge = Math.max(1, Math.min(this.cornerSize, sourceWidth / 3, sourceHeight / 3));
        var middleWidth = Math.max(0, this.width - edge * 2);
        var middleHeight = Math.max(0, this.height - edge * 2);
        var horizontalPieces = Math.max(1, Math.ceil(middleWidth / edge));
        var verticalPieces = Math.max(1, Math.ceil(middleHeight / edge));

        context.save();
        context.scale(canvasScale.x, canvasScale.y);
        context.imageSmoothingEnabled = false;

        var drawPiece = function (sourceX, sourceY, pieceWidth, pieceHeight, destinationX, destinationY) {
            if (pieceWidth <= 0 || pieceHeight <= 0) return;
            context.drawImage(this.sprite.image, sourceX, sourceY, pieceWidth, pieceHeight,
                position.x + destinationX, position.y + destinationY, pieceWidth, pieceHeight);
        }.bind(this);

        drawPiece(0, 0, edge, edge, 0, 0);
        drawPiece(sourceWidth - edge, 0, edge, edge, this.width - edge, 0);
        drawPiece(0, sourceHeight - edge, edge, edge, 0, this.height - edge);
        drawPiece(sourceWidth - edge, sourceHeight - edge, edge, edge, this.width - edge, this.height - edge);

        for (var x = edge; x < this.width - edge; x += edge) {
            var pieceWidth = Math.min(edge, this.width - edge - x);
            drawPiece(edge, 0, pieceWidth, edge, x, 0);
            drawPiece(edge, sourceHeight - edge, pieceWidth, edge, x, this.height - edge);
        }

        for (var y = edge; y < this.height - edge; y += edge) {
            var pieceHeight = Math.min(edge, this.height - edge - y);
            drawPiece(0, edge, edge, pieceHeight, 0, y);
            drawPiece(sourceWidth - edge, edge, edge, pieceHeight, this.width - edge, y);
        }

        for (var centerY = edge; centerY < this.height - edge; centerY += edge) {
            for (var centerX = edge; centerX < this.width - edge; centerX += edge) {
                var centerWidth = Math.min(edge, this.width - edge - centerX);
                var centerHeight = Math.min(edge, this.height - edge - centerY);
                drawPiece(edge, edge, centerWidth, centerHeight, centerX, centerY);
            }
        }

        context.restore();
    };

    powerupjs.NineSliceSpriteGameObject = NineSliceSpriteGameObject;
    return powerupjs;

})(powerupjs || {});