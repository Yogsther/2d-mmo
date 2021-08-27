using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Mob : MonoBehaviour {

    public Character character;

    void Start() {
        character.online = true;
        character.Init();
    }

    void Update() {

    }
}
