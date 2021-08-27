using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

class MovementDirection {
    public int Up = 0;
    public int Down = 1;
    public int Left = 2;
    public int Rigth = 3;
}

public class Character : MonoBehaviour {

    public Rigidbody2D rb;
    public BoxCollider2D collider;
    public Animator animator;
    public CharacterInfoDisplay infoDisplay;

    public SpriteRenderer targetIndecator;

    public bool online = false; // If this is a local or online character (All characters except for the player are online for now.)
    public string id;
    public string name;

    Vector2 movement; // The next movement to draw. (For offline characters)

    public int hp, maxHp;

    public bool targeted;

    public void Init() {
        rb.isKinematic = online; // Disable collisions for online characters
        infoDisplay.name.text = name;
    }

    void Update() {
        targetIndecator.enabled = targeted;

        if (maxHp > 0) infoDisplay.hpSlider.value = hp / maxHp;

        if (online) {
            /*float now = Time.time * 1000f;
            Vector2 movement = Vector2.Lerp(networkMoveFrom, networkMoveTo, (now - lastTick) / lastTickTime);
            rb.MovePosition(movement * speed);*/
            //rb.MovePosition(networkMoveTo);
        }
    }

    private void FixedUpdate() {
        if (online)
            UpdateOnlineMovement();
        else UpdateOfflineMovememnt();
    }

    void UpdateOfflineMovememnt() {
        // Handle movement for offline characters (Currently only the player)
        Vector2 newPosition = rb.position + movement * Time.deltaTime;
        rb.MovePosition(newPosition);

        UpdateAnimation(movement);
        movement = Vector2.zero;
    }

    void UpdateOnlineMovement() {

    }

    public void SetPosition() {

    }

    public void UpdateAnimation(Vector2 movement) {
        animator.SetFloat("Horizontal", movement.x);
        animator.SetFloat("Vertical", movement.y);

        // Enable or disable walking animation depending if the last input was a movement.
        animator.SetFloat("Speed", movement != Vector2.zero ? 1 : 0);
    }

    // This is used to move all the online characters.
    public void NetworkMove(Vector2 position) {
        UpdateAnimation(position - rb.position);
        rb.MovePosition(position);
    }

    public void MoveTo(Vector2 movement) {
        this.movement = movement;
    }
}
