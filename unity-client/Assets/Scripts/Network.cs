using NativeWebSocket;
using Newtonsoft.Json;
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Package {
    public string identifier;
    public string content;

    public Package(string identifier, object? content) {
        Set(identifier, content);
    }

    public void Set(string identifier, object? content) {
        this.identifier = identifier;
        this.content = JsonConvert.SerializeObject(content);
    }

    public string ToString() {
        return JsonConvert.SerializeObject(new Dictionary<string, string>() {
            {"identifier", identifier },
            { "content", content}
        });
    }
}


public class Event {
    public string identifier, value;
    public Dictionary<string, string> strings;
    public Dictionary<string, float> floats;
}

public class Update {
    public NetworkCharacter[] characters;
    public Event[] events;
}


public class HealthChangePackage {
    public HealthChangePackage(string id, float amount) {
        this.id = id;
        this.amount = amount;
    }
    public string id;
    public float amount;
}

public class NetworkCharacter {
    public string name, id, type;
    public int hp, maxHp;
    public float speed;
    public Vector2 position, lastTickPosition;
}


public class Network : MonoBehaviour {

    public WebSocket ws;
    public string token;
    public GameManager gm;

    public void Connect(string username) {
        Package package = new Package("login", new Dictionary<string, string>() {
            {"username", username },
            {"token", token }
        });

        ws.SendText(package.ToString());
    }

    async void Start() {

        token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());

        ws = new WebSocket("ws://localhost");

        ws.OnClose += (e) => {
            Debug.Log("Connection closed");
            if (this != null) StartCoroutine(Reconnect());
        };

        ws.OnOpen += () => {
            Debug.Log("Connected");
            Connect("OlleTest");
        };

        ws.OnMessage += (bytes) => {

            string message = System.Text.Encoding.UTF8.GetString(bytes);
            Package package = JsonUtility.FromJson<Package>(message);

            switch (package.identifier) {

                case "login_success":
                    gm.OnLogin(package.content);
                    break;
                case "tick":
                    OnTick(JsonConvert.DeserializeObject<Update>(package.content));
                    break;
            }
        };

        await ws.Connect();
    }

    void OnTick(Update update) {
        gm.OnTick(update);
    }

    // Try to reconnect if it loses conection to the server
    IEnumerator Reconnect() {
        yield return new WaitForSeconds(1);
        ws.Connect();
    }

    void Update() {
#if !UNITY_WEBGL || UNITY_EDITOR
        ws.DispatchMessageQueue();
#endif
    }

}
