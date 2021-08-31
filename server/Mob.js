const Character = require("./Character")

class Mob extends Character {
    constructor(name) {
        super(name)
        this.position = { x: 0, y: 0 }
        this.home = { x: this.position.x, y: this.position.y };
        this.state = "still"
        this.speed = 1
        this.walkingSpeed = .2;
        this.lastAttack = 0;
        this.target = null;
        this.attackTime = .25 // Seconds
        this.damage = 1;
    }

    SetSpawn(pos) {
        this.home = pos;
        this.position = pos;
    }
}

module.exports = Mob;