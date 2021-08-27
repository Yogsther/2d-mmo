using System.Collections;
using System.Collections.Generic;
using UnityEngine;


public class GameManager : MonoBehaviour {

    public Player player;
    public Network network;

    public Transform charactersGroup;
    public GameObject Mob;
    public GameObject Human;

    public List<Character> characters = new List<Character>();
    public NetworkCharacter[] networkCharacters;

    public bool loggedIn = false;
    public bool initiallyLoaded = false;

    public Vector2 lastSentPosition;

    void Start() {
        Application.runInBackground = true;
    }

    public void SpawnCharacter(NetworkCharacter networkCharacter) {

        GameObject characterPrefab = networkCharacter.type == "human" ? Human : Mob;
        GameObject obj = Instantiate(characterPrefab, charactersGroup);

        obj.name = networkCharacter.name;

        Character character = obj.GetComponent<Character>();

        character.online = true;
        character.id = networkCharacter.id;
        character.name = networkCharacter.name;
        character.hp = networkCharacter.hp;
        character.maxHp = networkCharacter.maxHp;

        character.Init();

        characters.Add(character);
    }

    public Character GetCharacter(string id) {
        if (id == player.character.id) return player.character;
        foreach (Character character in characters) {
            if (character.id == id) return character;
        }
        return null;
    }

    public void HandleEvents(Event[] events) {
        foreach (Event ev in events) {
            switch (ev.identifier) {
                case "player_joined":
                    OnPlayerJoined(ev.value);
                    break;
            }
        }
    }

    NetworkCharacter GetNetworkCharacter(string id) {
        foreach (NetworkCharacter character in networkCharacters) {
            if (character.id == id) return character;
        }
        return null;
    }

    public void OnPlayerJoined(string id) {

    }

    public void OnTick(Update update) {
        if (!loggedIn) return;

        networkCharacters = update.characters;

        foreach (NetworkCharacter character in networkCharacters) {
            if (GetCharacter(character.id) == null) {
                SpawnCharacter(character);
            }
        }

        // Emit the local players position back to the server
        Vector2 position = player.character.rb.position;
        if (lastSentPosition != position) {
            Package positionUpdate = new Package("position_update", new Dictionary<string, float> {
                { "x", position.x },
                { "y", position.y }
        });
            network.ws.SendText(positionUpdate.ToString());
            lastSentPosition = position;
        }

        // Update values for all players
        foreach (NetworkCharacter networkCharacter in update.characters) {
            Character character = networkCharacter.id == player.character.id ? player.character : GetCharacter(networkCharacter.id);

            // Update health points
            character.hp = networkCharacter.hp;
            character.maxHp = networkCharacter.maxHp;

            // Move online characters to their new positions
            if (character.online) {
                character.NetworkMove(networkCharacter.position);
            }
        }

        HandleEvents(update.events);
    }

    public void OnLogin(string id) {
        player.character.id = id;
        loggedIn = true;
    }

    void Update() {

    }
}
