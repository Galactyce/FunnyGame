function EnemyManager(layer, id) {
    powerupjs.GameObjectList.call(this, layer, id);
}

EnemyManager.prototype = Object.create(powerupjs.GameObjectList.prototype);

EnemyManager.prototype.syncWorldSettings = function () {
    if (!WorldSettings) return;
    WorldSettings.enemies = [];
    for (var i = 0; i < this.length; i++) {
        var enemy = this.at(i);
        if (enemy) WorldSettings.enemies.push(enemy);
    }
};

EnemyManager.prototype.addEnemy = function (enemy) {
    console.log("Adding enemy:", enemy);
    if (!enemy || !(enemy instanceof Enemy)) return;
    if (enemy.parent && enemy.parent !== this) {
        enemy.parent.remove(enemy);
    }
    this.add(enemy);
    this.syncWorldSettings();
};

EnemyManager.prototype.removeEnemy = function (enemy) {
    if (!enemy) return;
    this.remove(enemy);
    this.syncWorldSettings();
};

EnemyManager.prototype.syncFromRoom = function (room) {
    this.clear();
    if (!room || !room.tileFields) {
        this.syncWorldSettings();
        return;
    }

    for (var i = 0; i < room.tileFields.length; i++) {
        var field = room.tileFields.at(i);
        if (!field) continue;

        for (var j = field.length - 1; j >= 0; j--) {
            var enemy = field.at(j);
            if (!(enemy instanceof Enemy)) continue;
            field.remove(enemy);
            this.add(enemy);
        }
    }

    this.syncWorldSettings();
};

powerupjs.EnemyManager = EnemyManager;
