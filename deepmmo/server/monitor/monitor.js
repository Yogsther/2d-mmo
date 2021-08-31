var socket = io();

var scale = 20;

var start = Date.now()
var packets = 0;

socket.on("world", world => {
    draw_world(world)
})


const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

canvas.width = 70 * scale;
canvas.height = 35 * scale;

function draw_world(world) {
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    console.log(world.bombs)

    for (let bomb of world.bombs) {
        ctx.fillStyle = "red"
        ctx.fillRect(bomb.position.x * scale, bomb.position.y * scale, scale, scale)
    }

    for (let bomb_pickup of world.bomb_pickups) {
        ctx.fillStyle = "yellow"
        ctx.fillRect(bomb_pickup.position.x * scale, bomb_pickup.position.y * scale, scale, scale)
    }

    for (let player of world.players) {
        ctx.fillStyle = "green"

        let width = 1;
        let height = 1;
        ctx.fillRect((player.position.x - width / 2) * scale, (player.position.y - height / 2) * scale, width * scale, height * scale)

        ctx.fillStyle = "white"
        ctx.font = "15px Arial"
        ctx.textAlign = "center"
        ctx.fillText(player.name + "(" + player.bombs + ")", player.position.x * scale, ((player.position.y) * scale) - 20)
    }
}


// Reloads the page when the server restarts
socket.on("disconnect", () => {
    location.reload()
})
