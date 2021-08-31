using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

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

    public GameObject loginScreen;
    public InputField nameInput;


    public Vector2 lastSentPosition;

    void Start() {
        Application.runInBackground = true;
        player.gm = this;
        loginScreen.SetActive(true);
    }

    public void Login() {
        player.character.name = nameInput.text;
        player.character.Init();
        network.Connect(nameInput.text);
        loginScreen.SetActive(false);
    }


    public void SpawnCharacter(NetworkCharacter networkCharacter) {

        GameObject characterPrefab = networkCharacter.type == "human" ? Human : Mob;
        GameObject obj = Instantiate(characterPrefab, charactersGroup);

        obj.name = networkCharacter.name;

        Character character = obj.GetComponent<Character>();

        character.gm = this;
        character.online = true;
        character.id = networkCharacter.id;
        character.name = networkCharacter.name;
        character.hp = networkCharacter.hp;
        character.maxHp = networkCharacter.maxHp;
        character.Init();
        character.SetPosition(networkCharacter.position);

        characters.Add(character);
    }

    public void Target(string id) {
        if (player.target == id || id == player.character.id) return;
        Character previousTarget = player.GetTarget();
        if (previousTarget != null) previousTarget.SetTargeted(false);
        player.target = id;

        GetCharacter(id).SetTargeted(true);
    }

    public void Damage(string id, float amount) {
        network.ws.SendText(new Package("damage", new HealthChangePackage(id, amount)).ToString());
    }

    public void Heal(string id, float amount) {
        network.ws.SendText(new Package("heal", new HealthChangePackage(id, amount)).ToString());
    }

    public Character GetCharacter(string id) {
        if (id == player.character.id) return player.character;
        foreach (Character character in characters) {
            if (character.id == id) return character;
        }
        return null;
    }

    public void OnHealthChange(Event ev) {
        Character character = GetCharacter(ev.strings["id"]);
        character.infoDisplay.AnimateText(ev.floats["amount"]);
    }

    public void HandleEvents(Event[] events) {
        foreach (Event ev in events) {
            switch (ev.identifier) {
                case "player_joined":
                    OnPlayerJoined(ev.value);
                    break;
                case "player_left":
                    OnPlayerLeft(ev.value);
                    break;
                case "health_change":
                    OnHealthChange(ev);
                    break;
                case "death":
                    OnCharacterDeath(ev.value);
                    break;
            }
        }
    }

    // When any character died

    void OnCharacterDeath(string id) {
        if (id != player.character.id) {

            Character character = GetCharacter(id);
            Destroy(character.gameObject);
        }

    }

    // When this player died
    public void OnDied() {
        loggedIn = false;
        loginScreen.SetActive(true);
    }

    void OnPlayerLeft(string id) {
        Character left = GetCharacter(id);
        if (left) {
            characters.Remove(left);
            Destroy(left.gameObject);
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
        player.character.gm = this;
        loginScreen.SetActive(false);
        loggedIn = true;
    }
}
