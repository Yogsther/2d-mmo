const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

const camera = { x: 0, y: 0 }

const SCALE = 3;

// The ground tile
// 4x4 images
// 64x64 pixels per image
let groundTexture = new Image()
groundTexture.src = "img/ground.png"
let texture_count = 4 * 4;

groundTexture.onload = () => {
    render()
}

function drawTexture(index, x, y, scale = 1) {
    let tile_x = index % 4;
    let tile_y = (index - tile_x) / 4;
    ctx.drawImage(groundTexture, tile_x * 64, tile_y * 64, 64, 64, x, y, 64 * scale, 64 * scale)
}


function render() {

}