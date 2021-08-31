const { nanoid } = require('nanoid');

class Character {
    constructor(name) {
        this.name = name;
        this.type = "mob"
        this.player = false;
        this.position = { x: 0, y: 0 }
        this.lastTickPosition = this.position;
        this.speed = 1;
        this.maxHp = 20;
        this.hp = this.maxHp;

        this.id = nanoid()

        //characters[this.id] = this
    }
}

module.exports = Character;