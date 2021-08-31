**This project was abandoned because training in nodejs did
not work out how I imagined. This was an experiment and I'm happy with the progress and everything I learned.**

## Idea

* Multiplayer MMO
* Simple login with a nickname and join the world
* Walk around with WASD
* PVP combat (PVE with AI bots)
* AI bots trained with Tensorflow

## How

* Game client in Unity (2D Game, top down)
* Server in Nodejs
* Bots trained with Tensorflow.js
* Client/Server communcation with websockets

## Expectations

I have no clue if the machine learning will work at all.
Hopefully it will work somewhat, and player will be able to challenge
the bots and other players in combat.

## Plan

* Code a simple mmo game client, Unity 2D
* Code the server in Node and connect it with the client
* Implement tensorflow server side.
* Train bots fighting eachother at a higher tick rate for a long time.
* Tweak until it works?

## Requirements

* Server needs to have a configurable tick rate so bot training can be sped up.
* All logic must be done on the server
* CUDA gpu for training. Might be possible to train it on the school computer aswell.

## Problems to solve
* MMO fight mechanic (Bomberman mechanic, drop bombs that explode after a short time with a radius,
  bombs may be picked up from random spawns.)


## Specs
* World size 100W 50H
* 30 hz tick rate
* Players and bots will be treated the same server side


## TODO

- [X] Create an envoirement server side
- [X] Add players to envoirement
- [X] Monitor the enviorement via a website
- [X] Train bots on the envoirement
- [X] Add bomb mechanic
- [ ] Create unity client
- [ ] Connect unity client to the server
- [ ] Optimize for GPU training
