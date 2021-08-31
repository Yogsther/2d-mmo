/**
 * Olle Kaiser 2021
 */

const game_port = 80;
const tick_rate = 30; //hz



// Websocket, communication with game clients
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: game_port });

const characters = {}
var events = []

class Event {
    constructor(identifier, value) {
        this.identifier = identifier;
        this.value = value;
        this.floats = {}
        this.strings = {}
        events.push(this)
    }
}

const SERVER_SPEED = .2;

const MOB_STATES = [
    "still",
    "left",
    "right",
    "up",
    "down"
]

function GenerateSpawnPoint() {
    return {
        x: Math.floor(Math.random() * 10) - 5,
        y: Math.floor(Math.random() * 10) - 5
    }
}

const Character = require("./Character")

const Mob = require("./Mob")




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
            hp: character.hp,
            maxHp: character.maxHp
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


let mob = new Mob("test")
characters[mob.id] = mob;

setInterval(() => {
    if (GetAmountOfCharacters() > 1) UpdateMobs()

    //if (GetAmountOfCharacters() < 5) new Mob("Monster")

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

function Distance(pos1, pos2) {
    return Math.hypot(pos2.x - pos1.x, pos2.y - pos1.y)
}

function RunMobLogic(mob) {

    var maxDistanceFromHome = 2;

    var distanceToTarget = 30; // The minim distance to start following player
    var fightDistance = 3; // The distance the mob will stand to the player when attacking
    var targetHuman;
    let distanceToPlayer;

    for (let id in characters) {
        let character = characters[id]
        if (character.player) {
            let player = character;
            distanceToPlayer = Distance(mob.position, player.position)

            if (distanceToPlayer < fightDistance) {
                targetHuman = player
                console.log("IN FIGHT " + distanceToPlayer)
            }
            else if (distanceToPlayer < distanceToTarget) {
                targetHuman = player;
                // Move twoards the player

                let dir = {
                    x: (player.position.x - mob.position.x) / distanceToTarget,
                    y: (player.position.y - mob.position.y) / distanceToTarget
                }

                mob.position.x += dir.x * mob.speed * SERVER_SPEED
                mob.position.y += dir.y * mob.speed * SERVER_SPEED
                console.log("WALKING TOWARDS PLAYER " + distanceToPlayer)
            }
        }
    }
    if (!targetHuman
    ) {
        console.log("CHILLING " + distanceToPlayer)
        if (mob.home.x - mob.position.x >= maxDistanceFromHome) mob.state = "right"
        else if (mob.home.x - mob.position.x <= -maxDistanceFromHome) mob.state = "left"
        else if (mob.home.y - mob.position.y >= maxDistanceFromHome) mob.state = "up"
        else if (mob.home.y - mob.positiony <= -maxDistanceFromHome) mob.state = "down"
        else if (Math.random() > .95) {
            mob.state = MOB_STATES[Math.floor(Math.random() * MOB_STATES.length)]
        }

        var movement = { x: 0, y: 0 }
        switch (mob.state) {
            case "up":
                movement = { x: 0, y: 1 }
                break;
            case "down":
                movement = { x: 0, y: -1 }
                break;
            case "left":
                movement = { x: -1, y: 0 }
                break;
            case "right":
                movement = { x: 1, y: 0 }
                break;
        }

        mob.position.x += movement.x * mob.speed * SERVER_SPEED
        mob.position.y += movement.y * mob.speed * SERVER_SPEED
    }





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

function OnDamage(player, package) {
    let damagePackage = JSON.parse(package)
    let target = GetCharacter(damagePackage.id)
    target.hp -= damagePackage.amount;
    createHealthChangeEvent(target.id, -damagePackage.amount)
    if (target.hp <= 0) {
        Kill(target)
    }
}

function OnHeal(player, package) {
    let healPackage = JSON.parse(package)
    let target = GetCharacter(healPackage.id)
    target.hp += healPackage.amount;
    if (target.hp > target.maxHp) target.hp = target.maxHp;
    createHealthChangeEvent(target.id, healPackage.amount)
}

function Kill(character) {
    new Event("death", character.id)
    delete characters[character.id]
}

function createHealthChangeEvent(id, amount) {
    let event = new Event("health_change")
    event.strings["id"] = id
    event.floats["amount"] = amount
}

function OnPositionUpdate(player, package) {
    player.position = JSON.parse(package)
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

    console.log("Online players " + GetAmountOfCharacters()) +

        ws.on("message", message => {
            var package = JSON.parse(message)
            switch (package.identifier) {
                case "login":
                    let loginInfo = JSON.parse(package.content)
                    let player = new Player(loginInfo.username, loginInfo.token, ws)
                    characters[player.id] = player;
                    console.log(player.name + " joined the world.")
                    EmitPlayerJoinedEvent(player.id)
                    ws.send(new Package("login_success", player.id).ToString())
                    break;
                case "position_update":
                    OnPositionUpdate(GetPlayerFromSocket(ws), package.content)
                    break;
                case "damage":
                    OnDamage(GetPlayerFromSocket(ws), package.content)
                    break;
                case "heal":
                    OnHeal(GetPlayerFromSocket(ws), package.content)
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

console.log(`Started MMO server on port ${game_port}`)