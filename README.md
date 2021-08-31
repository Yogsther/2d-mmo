## How to setup project locally

### Game

The game client is located in `unity-client`. Import that in your
unity hub. Unity version is 2020.3.2f1.

To try multiplayer, build and run + editor play

### Server

Install NodeJS (NPM is bundled)

1. `cd server` Go to the server folder
2. `npm i` Install dependencies
3. `node .` Start the server


## Game structure

* /server
  * `index.js` is the main startup file.

* /unity-client
  * `Character.cs` all characters in the game (players and mobs) inherit this class
  * `CharacterInfoDisplay.cs` This controlls the hp, username and damage UI
