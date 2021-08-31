const Character = require("./Character")

class Player extends Character {
    constructor(name, token, ws) {
        super(name)

        this.maxHp = 30;
        this.hp = this.maxHp;

        this.player = true;
        this.type = "human"
        this.token = token;
        this.ws = ws;
    }
}

module.exports = Player;