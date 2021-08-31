const tf = require('@tensorflow/tfjs')

const WORLD_WIDTH = 70;
const WORLD_HEIGHT = 35;

var players = []


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

class Player {
    constructor() {
        this.position = {
            x: 0,
            y: 0
        }

        this.max_speed = 1;
        this.spawn();
        this.name = "Bot " + Math.round(Math.random() * 100)
    }


    // Spawn this player in a random position of the world
    spawn() {
        players.push(this)
        this.set_random_position()
    }

    set_random_position() {
        this.set_position(Math.random() * WORLD_WIDTH, Math.random() * WORLD_HEIGHT);
    }

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

class NeuralBot extends Player {
    constructor() {
        super()

        this.input_nodes = WORLD_WIDTH * WORLD_HEIGHT
        this.hidden_nodes = 1
        this.output_nodes = 4

        this.name = "Neural bot"


        this.model = this.create_model()
        this.predict()
    }

    create_model() {


        let model = tf.sequential();
        var hidden = tf.layers.dense({
            units: this.hidden_nodes,
            inputShape: [WORLD_HEIGHT, WORLD_WIDTH],
            activation: "sigmoid"
        })

        hidden.batchInputShape = hidden.batchInputShape.slice(1)

        model.add(hidden)

        const output = tf.layers.dense({
            units: this.output_nodes,
            activation: "softmax"
        })


        model.add(output)
        console.log(model.layers)

        model.summary();
        return model

    }

    copy() {
        let model = this.create_model()
        var weights = this.model.getWeights()
        model.setWeights(weights)
        this.model = model;
    }

    update() {
        //if (this.lastPosition == this.position) this.copy()
        this.predict()

        this.lastPosition = this.position;
    }

    predict() {

        //const xs = tf.tensor2d(this.get_world_matrix())
        const xs = tf.tensor2d(this.get_world_matrix())

        console.log(JSON.stringify(xs))
        const ys = this.model.predict(xs)
        const outputs = ys.dataSync()


        var biggest = -1;
        for (let i = 0; i < this.output_nodes; i++) {
            if (biggest == -1 || outputs[i] > outputs[biggest]) biggest = i;
        }

        console.log(biggest)

        switch (biggest) {
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

        }
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
        players
    })

}, 1000 / 30 /* 30hz tickrate */)


/* setInterval(() => {
    for (let player of players) {
        player.update()
    }
}, 100) */

for (let player of players) {
    player.update()
}

new NeuralBot()


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