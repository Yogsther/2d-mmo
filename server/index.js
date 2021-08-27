/**
 * Olle Kaiser 2021
 */

const game_port = 80;
const tick_rate = 30; //hz

const { nanoid } = require('nanoid');

// Websocket, communication with game clients
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: game_port });

const characters = {}
var events = []

class Event {
    constructor(identifier, value) {
        this.identifier = identifier;
        this.value = value;
        events.push(this)
    }
}

const SERVER_SPEED = .2;

class Character {
    constructor(name) {
        this.name = name;
        this.type = "mob"
        this.player = false;
        this.position = { x: 5, y: 0 }
        this.lastTickPosition = this.position;
        this.speed = 1;
        this.maxHp = 20;
        this.hp = this.maxHp;

        this.id = nanoid()

        characters[this.id] = this
    }
}

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

function DeleteAllCharacters() {
    for (let id in characters) {
        delete characters[id]
    }
}

function PackageFromJSON(json) {
    let parsed = JSON.parse(json)
    return new Package(parsed.identifier, parsed.content)
}

class Package {
    constructor(identifier, content) {
        this.identifier = identifier;
        this.content = content;
    }
    ToString() {
        return JSON.stringify(this);
    }
}

function CreateWorldUpdate() {
    let update = {
        characters: [],
        events
    }
    for (let id in characters) {
        let character = characters[id]
        update.characters.push({
            id: id,
            name: character.name,
            speed: character.speed,
            type: character.type,
            position: character.position,
            lastTickPosition: character.lastTickPosition,
        })
    }

    update = JSON.stringify(update)
    events = []

    return update;
}

function GetCharacter(id) {
    return characters[id]
}

function EmitWorldUpdate() {
    let update = CreateWorldUpdate()

    for (let id in characters) {
        let character = characters[id]
        if (character.ws) {
            character.ws.send(new Package("tick", update).ToString())
        }
    }


}

function GetAmountOfCharacters() {
    return Object.keys(characters).length
}

setInterval(() => {
    if (GetAmountOfCharacters() > 1) UpdateMobs()
    EmitWorldUpdate()
}, 1000 / tick_rate);

function UpdateMobs() {
    for (let id in characters) {
        let character = characters[id];
        if (!character.player) {
            RunMobLogic(character)
        }
    }
}

function RunMobLogic(mob) {
    console.log("Running mob ")
    mob.lastTickPosition = mob.position;
    //mob.position.x += mob.speed * SERVER_SPEED
}

function GetPlayerFromSocket(ws) {
    for (let id in characters) {
        let character = characters[id]
        if (character.ws && character.ws.id == ws.id) {
            return character;
        }
    }
}

function EmitPlayerJoinedEvent(id) {
    new Event("player_joined", id)
}

wss.on("connection", (ws, req) => {

    /* DeleteAllCharacters()
    new Character("Mob test") */

    ws.id = req.headers['sec-websocket-key'];

    ws.on("close", () => {
        let player = GetPlayerFromSocket(ws)
        new Event("player_left", player.id)
        delete characters[player.id]
        console.log(player.name + " left the world.")
    })

    ws.on("message", message => {
        var package = JSON.parse(message)
        switch (package.identifier) {
            case "login":
                let loginInfo = JSON.parse(package.content)
                let player = new Player(loginInfo.username, loginInfo.token, ws)
                console.log(player.name + " joined the world.")
                EmitPlayerJoinedEvent(player.id)
                ws.send(new Package("login_success", player.id).ToString())
                break;
            case "position_update":
                let character = GetPlayerFromSocket(ws)
                character.position = JSON.parse(package.content)
                break;
        }
    })


    /*  ws.on("message", (message) => {
         var package = JSON.parse(message)
         var userId = null;
         if (package.token) {
             let userToken = db.get("tokens").find({ token: package.token }).value()
             if (userToken) userId = userToken.user
         }
 
     } */


    /*  switch (package.identifier) {
         case "open_pack":
             var drop = openPack(userId, package.packet);
            package.packet; */


    // Send all users that connect the tips, all card packs (what they contain and their names)
    // and the database of all cards
    /* ws.send(Pack("tips", JSON.stringify(getTips())))
    ws.send(Pack("packs", JSON.stringify(getPacks())))
    ws.send(Pack("cards", getUnityCards())) */
});