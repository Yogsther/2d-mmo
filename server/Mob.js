const Character = require("./Character")

class Mob extends Character {
    constructor(name) {
        super(name)
        this.position = { x: 0, y: 0 }//GenerateSpawnPoint()
        this.home = { x: this.position.x, y: this.position.y };
        this.state = "still"
        this.speed = 1
    }
}

module.exports = Mob;