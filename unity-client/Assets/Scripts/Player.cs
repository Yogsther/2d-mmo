using System;
using UnityEngine;

public class Player : MonoBehaviour {

    float speed = 5f;
    public Character character;
    public Camera camera;

    public string target; // ID


    void Start() {
        character.online = false;
        character.name = "Local player";
        character.Init();
    }

    void Update() {
        Vector2 movement;
        movement.x = Input.GetAxisRaw("Horizontal");
        movement.y = Input.GetAxisRaw("Vertical");

        // Makes sure diagonal walking is not faster.
        movement = Vector2.ClampMagnitude(movement, 1);

        character.MoveTo(movement * speed);

        // Zoom in and out with the scroll wheel
        camera.orthographicSize -= (Input.mouseScrollDelta.y / 5);
        camera.orthographicSize = Mathf.Clamp(camera.orthographicSize, 1, 20);
    }


}
