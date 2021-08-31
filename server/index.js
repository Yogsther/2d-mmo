/**
 * Olle Kaiser 2021
 */

const Mob = require("./Mob")
const Event = require("./Event")
const Player = require("./Player")
const Package = require("./Package")


const game_port = 80;
const tick_rate = 30; //hz



// Websocket, communication with game clients
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: game_port });

// All the characters in the game, players and mobs.
const characters = {}
// Events like when a player joins, leaves, takes damage, dies
// Is sent and cleared on each tick
var events = []

// Like Time.deltaTime for the server. Multiples with mob speed when moving them.
const SERVER_SPEED = .2;

const MOB_STATES = [
    "still",
    "left",
    "right",
    "up",
    "down"
]

setInterval(() => {
    Update()
}, 1000 / tick_rate);



function SpawnMob() {
    // Create a test mob
    let mob = new Mob("Mob " + Math.floor(Math.random() * 100))
    mob.SetSpawn(GenerateSpawnPoint())
    characters[mob.id] = mob;

}

// Runs each tick
function Update() {
    // Only update server if a player is connected.
    if (GetAmountOfPlayers() == 0) return;
    // Run mob logic
    UpdateMobs()

    if (GetAmountOfCharacters() < 10) SpawnMob()
    // Send the tick update to all players
    EmitWorldUpdate()
}


function GetAmountOfPlayers() {
    let players = 0
    for (let id in characters) {
        if (characters[id].player) players++
    }
    return players;
}


wss.on("connection", (ws, req) => {

    // Gives all connections an ID
    ws.id = req.headers['sec-websocket-key'];

    ws.on("message", message => {
        var package = JSON.parse(message)
        switch (package.identifier) {
            case "login":
                OnLogin(ws, package)
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

    // A player disconnects
    ws.on("close", () => {
        let player = GetPlayerFromSocket(ws)
        if (player) {
            let event = new Event("player_left", player.id)
            events.push(event)

            delete characters[player.id]
            console.log(player.name + " left the world.")
        }

    })
});


function DeleteAllCharacters() {
    for (let id in characters) {
        delete characters[id]
    }
}

function PackageFromJSON(json) {
    let parsed = JSON.parse(json)
    return new Package(parsed.identifier, parsed.content)
}


function GenerateSpawnPoint() {
    let range = 50;
    return {
        x: Math.floor(Math.random() * range) - range / 2,
        y: Math.floor(Math.random() * range) - range / 2
    }
}

// Creates an update object with all character position + info
// Also sends the list of events for the last tick.
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

// Send an update
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




function UpdateMobs() {
    for (let id in characters) {
        let character = characters[id];
        if (!character.player) {
            RunMobLogic(character)
        }
    }
}

// Get the distance between two 2D positions
function Distance(pos1, pos2) {
    return Math.hypot(pos2.x - pos1.x, pos2.y - pos1.y)
}


function RunMobLogic(mob) {

    var maxDistanceFromHome = 2;

    var distanceToTarget = 5; // The minim distance to start following player
    var fightDistance = 3; // The distance the mob will stand to the player when attacking
    var targetPlayer; // The current player target

    for (let id in characters) {
        let character = characters[id]
        if (character.player && mob.target == character.id) {
            let player = character;
            let distanceToPlayer = Distance(mob.position, player.position)

            // Attack the player
            if (distanceToPlayer < fightDistance) {
                targetPlayer = player

                // Time is in millis, so we multiply with 1000
                if (Date.now() - mob.lastAttack > mob.attackTime * 1000) {
                    Damage(mob, targetPlayer, mob.damage)
                    mob.lastAttack = Date.now()
                }
            }
            // Move towards a player (the player is close enough to approach but not to attack)
            else if (distanceToPlayer < distanceToTarget) {
                targetPlayer = player;
                // Move twoards the player

                let dir = {
                    x: (player.position.x - mob.position.x) / distanceToTarget,
                    y: (player.position.y - mob.position.y) / distanceToTarget
                }

                mob.position.x += dir.x * mob.speed * SERVER_SPEED
                mob.position.y += dir.y * mob.speed * SERVER_SPEED

            }
        }
    }
    if (!targetPlayer
    ) {

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

        mob.position.x += movement.x * mob.walkingSpeed * SERVER_SPEED
        mob.position.y += movement.y * mob.walkingSpeed * SERVER_SPEED
    }
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
    let ev = new Event("player_joined", id)
    events.push(ev)
}

function Damage(from, target, amount) {
    target.hp -= amount;
    createHealthChangeEvent(target.id, -amount)
    // If the character being attacked is a mob, it will target the player
    if (!target.player)
        target.target = from.id;

    if (target.hp <= 0) {
        Kill(target)
    }
}

function OnDamage(player, package) {
    let damagePackage = JSON.parse(package)
    let target = GetCharacter(damagePackage.id)
    Damage(player, target, damagePackage.amount)
}

function OnHeal(player, package) {
    let healPackage = JSON.parse(package)
    let target = GetCharacter(healPackage.id)

    target.hp += healPackage.amount;
    // Make sure HP does not exceed max hp of the character
    if (target.hp > target.maxHp) target.hp = target.maxHp;
    // Announce to all clients that the character got healed
    createHealthChangeEvent(target.id, healPackage.amount)
}

// Kill a character or player
function Kill(character) {
    let ev = new Event("death", character.id)
    if (character.player) character.ws.send(new Package("died").ToString())
    events.push(ev)
    delete characters[character.id]


}

// This event will display to all users that a character got healed
function createHealthChangeEvent(id, amount) {
    let event = new Event("health_change")
    event.strings["id"] = id
    event.floats["amount"] = amount
    events.push(event)
}

// Changes the poistion of a player
function OnPositionUpdate(player, package) {
    player.position = JSON.parse(package)
}

function OnLogin(ws, package) {
    let loginInfo = JSON.parse(package.content)
    // Create the new player
    let player = new Player(loginInfo.username, loginInfo.token, ws)
    // Add the players to the characters list
    characters[player.id] = player;

    EmitPlayerJoinedEvent(player.id)
    // Send confirmation to the player who joined
    ws.send(new Package("login_success", player.id).ToString())

    console.log(player.name + " joined the world.")
}



console.log(`Started MMO server on port ${game_port}`)