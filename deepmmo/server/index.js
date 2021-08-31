const { nanoid } = require('nanoid')
const tf = require('@tensorflow/tfjs')

const WORLD_WIDTH = 70;
const WORLD_HEIGHT = 35;

var players = []
var bombs = []
var bomb_pickups = []

class BombPickup {
    constructor() {
        this.position = get_random_position()
        bomb_pickups.push(this)
    }
}


class Bomb {
    constructor(x, y, planter) {
        this.position = { x, y }
        this.frames_until_explodes = 30
        this.blast_radius = 10
        this.planter = planter
        bombs.push(this)
    }

    update() {
        this.frames_until_explodes--;
        if (this.frames_until_explodes <= 0) {
            bombs.splice(bombs.indexOf(this), 1)
            for (let player of players) {
                if (distance(player, this) > this.blast_radius) {
                    player.reward(-1)
                    if (this.planter.id != player.id) this.planter.reward(1)
                    player.kill()
                }
            }
        }
    }
}

function distance(obj1, obj2) {
    return Math.sqrt(Math.pow(obj2.position.x - obj1.position.x, 2) + Math.pow(obj2.position.y - obj1.position.y, 2))
}


/**
 * Neural bot powered by Tensorflow
 * 
 * Inputs is one big matrix of the entire world.
 * 0 - is empty space
 * 1 - is the bot itself
 * 2 - is any other player
 * 3 - is a live bomb
 * 4 - is a bomb pickup
 * 
 * Under the matrix, one more row displays the number of bombs in inventory.
 * 
 * Example of a an input if the world was 6x4 big.
 * The world is actually 100x50
 * 
 * [0,0,0,0,0,0]
 * [0,0,1,0,0,0]
 * [0,0,0,3,2,0]
 * [4,0,0,0,0,0]
 * [99] <-- Bomb count
 */

function get_random_position() {
    return {
        x: Math.floor(Math.random() * WORLD_WIDTH), y: Math.floor(Math.random() * WORLD_HEIGHT)
    }
}

class Player {
    constructor() {
        this.position = {
            x: 0,
            y: 0
        }

        this.bombs = 0;
        this.max_speed = 1;
        this.spawn();
        this.name = "Bot " + Math.round(Math.random() * 100)
        this.id = nanoid()
    }

    kill() {
        players.splice(players.indexOf(this), 1)
    }

    // Spawn this player in a random position of the world
    spawn() {
        players.push(this)
        this.set_random_position()
    }

    set_random_position() {
        this.position = get_random_position()
    }

    plant_bomb() {
        if (this.bombs > 0) {
            new Bomb(this.position.x, this.position.y, this)
            this.bombs--;
        } else {
            this.reward(-1)
        }
    }

    update() {
        for (let pickup of bomb_pickups) {
            if (pickup.position.x == this.position.x && pickup.position.y == this.position.y) {
                bomb_pickups.splice(bomb_pickups.indexOf(pickup), 1)
                this.bombs++
                this.reward(1)
            }
        }
    }

    reward() { }

    set_position(x, y) {
        this.position.x = Math.round(x)
        this.position.y = Math.round(y)
    }

    move(x, y) {
        // Calculate the new position if this movement were to be applied.
        var new_x = Math.round(this.position.x + x);
        var new_y = Math.round(this.position.y + y);

        // Make sure player does not move out of bounds
        if (new_x < WORLD_WIDTH && new_x > 0)
            // Move the player
            this.position.x = new_x
        if (new_y < WORLD_HEIGHT && new_y > 0)
            this.position.y = new_y;
    }

}

const { NeuralNetwork, Model, Academy } = require("reimprovejs/dist/reimprove.js")

const modelFitConfig = {              // Exactly the same idea here by using tfjs's model's
    epochs: 1,                        // fit config.
    stepsPerEpoch: 16
};

const numActions = 5;                 // The number of actions your agent can choose to do
const inputSize = (WORLD_WIDTH * WORLD_HEIGHT) + 1;
temporalWindow = 1;             // The window of data which will be sent yo your agent
// For instance the x previous inputs, and what actions the agent took

const totalInputSize = inputSize * temporalWindow + numActions * temporalWindow + inputSize;

const network = new NeuralNetwork();
network.InputShape = [totalInputSize];
network.addNeuralNetworkLayers([
    { type: 'dense', units: 32, activation: 'relu' },
    { type: 'dense', units: numActions, activation: 'softmax' }
]);
// Now we initialize our model, and start adding layers
const model = new Model.FromNetwork(network, modelFitConfig);

// Finally compile the model, we also exactly use tfjs's optimizers and loss functions
// (So feel free to choose one among tfjs's)
model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' })


class NeuralBot extends Player {
    constructor() {
        super()
        this.name = "Neural bot"


        const teacherConfig = {
            lessonsQuantity: 10,                   // Number of training lessons before only testing agent
            lessonsLength: 100,                    // The length of each lesson (in quantity of updates)
            lessonsWithRandom: 2,                  // How many random lessons before updating epsilon's value
            epsilon: 1,                            // Q-Learning values and so on ...
            epsilonDecay: 0.995,                   // (Random factor epsilon, decaying over time)
            epsilonMin: 0.05,
            gamma: 0.8                             // (Gamma = 1 : agent cares really much about future rewards)
        };


        this.academy = new Academy();    // First we need an academy to host everything
        this.teacher = this.academy.addTeacher(teacherConfig);


        const agentConfig = {
            model: model,                          // Our model corresponding to the agent
            agentConfig: {
                memorySize: 5000,                      // The size of the agent's memory (Q-Learning)
                batchSize: 128,                        // How many tensors will be given to the network when fit
                temporalWindow: temporalWindow         // The temporal window giving previous inputs & actions
            }
        };

        this.agent = this.academy.addAgent(agentConfig);

        this.academy.assignTeacherToAgent(this.agent, this.teacher);

    }

    reward(amount) {
        //console.log("Rewarded " + this.name + " with " + amount)
        this.academy.addRewardToAgent(this.agent, amount)
    }

    update() {
        super.update()
        this.predict()
        this.lastPosition = this.position;
    }

    async predict() {

        let result = await this.academy.step([
            {
                teacherName: this.teacher, agentsInput: this.get_world_list()
            }
        ])

        if (result) {
            switch (result.get(this.agent)) {
                case 0:
                    this.move(0, -1)
                    break;
                case 1:
                    this.move(0, 1)
                    break;
                case 2:
                    this.move(-1, 0)
                    break;
                case 3:
                    this.move(1, 0)
                    break;
                case 4:
                    this.plant_bomb()
                    break
            }
        }
    }

    get_world_list() {
        let list = []
        let index = 0;
        for (let y = 0; y < WORLD_HEIGHT; y++) {

            for (let x = 0; x < WORLD_WIDTH; x++) {
                for (let player of players) {
                    if (player.position.x == x && player.position.y == y) {
                        if (player == this) list.push(1)
                        else list.push(2)
                        continue;
                    }
                }

                if (!list[index]) list.push(0)
                index++;
            }

        }

        list.push(this.bombs)
        return list;
    }

    get_world_matrix() {
        let matrix = []
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            let arr = []
            let index = 0;
            for (let x = 0; x < WORLD_WIDTH; x++) {
                for (let player of players) {
                    if (player.position.x == x && player.position.y == y) {
                        if (player == this) arr.push(1)
                        else arr.push(2)
                        continue;
                    }
                }

                if (!arr[index]) arr.push(0)
                index++;
            }
            matrix.push(arr)
        }
        return matrix;
    }
}

setInterval(() => {
    io.emit("world", {
        players,
        bombs,
        bomb_pickups
    })

}, 1000 / 60 /* 30hz tickrate */)


setInterval(() => {
    for (let player of players) {
        player.update()
    }
    for (let bomb of bombs) {
        bomb.update()
    }

    while (bomb_pickups.length < 5) {
        new BombPickup()
    }

    while (players.length < 2) {
        new NeuralBot()
    }
}, 1)




// Monitor system

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use("/", express.static('monitor'))
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/monitor/index.html");
});

io.on('connection', socket => {

});

server.listen(80, () => {
    console.log("World overview is live at http://localhost");
});