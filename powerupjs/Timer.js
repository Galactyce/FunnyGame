var powerupjs = (function (powerupjs) {
  function Timer(duration) {
    this.duration = duration || 0;
    this.elapsed = 0;
  }

  Timer.prototype.update = function (deltaTime) {
    this.elapsed += deltaTime;
    if (this.elapsed > this.duration) {
      this.elapsed = this.duration;
    }
  };

  Timer.prototype.reset = function () {
    this.elapsed = 0;
  };

  Timer.prototype.isFinished = function () {
    return this.elapsed >= this.duration;
  };

  Timer.prototype.getElapsed = function () {
    return this.elapsed;
  };

  Timer.prototype.getRemaining = function () {
    return this.duration - this.elapsed;
  };

  Timer.prototype.draw = function (label) {
    label.text = Math.ceil(this.getRemaining()).toString();
  };

  Timer.prototype.handleInput = function () {
    // Implement input handling if necessary
  };

  powerupjs.Timer = Timer;
  return powerupjs;
})(powerupjs || {});
