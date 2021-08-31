using System;
using System.Collections.Generic;
using UnityEngine;

public class Player : MonoBehaviour {

    float speed = 5f;
    public Character character;
    public Camera camera;
    public string target; // ID
    public GameManager gm;

    public Ability[] abilities;
    public List<HotbarItem> hotbar;
    public Transform hotbarContainer;
    public GameObject hotbarItemPrefab;

    void Start() {
        character.online = false;
        character.name = "Local player";
        character.Init();

        for (int i = 0; i < abilities.Length; i++) {
            GameObject obj = Instantiate(hotbarItemPrefab, hotbarContainer);
            HotbarItem item = obj.GetComponent<HotbarItem>();
            item.Init((i + 1).ToString(), abilities[i]);
            hotbar.Add(item);
        }
    }

    public Character GetTarget() {
        return gm.GetCharacter(target);
    }

    public void RunAbility(HotbarItem item) {
        Character target = GetTarget();
        if (!item.ability.needsTarget || target) {
            if (item.CanBeUsed()) {
                // Can run ability
                item.StartCooldown();
                Ability ability = item.ability;

                Debug.Log("Used " + ability.name);

                if (ability.damage != 0) {
                    gm.Damage(target.id, ability.damage);
                }
                if (ability.heal != 0) {
                    gm.Heal(character.id, ability.heal);
                }
            }
        }
    }

    void Update() {
        Vector2 movement;
        movement.x = Input.GetAxisRaw("Horizontal");
        movement.y = Input.GetAxisRaw("Vertical");

        // Makes sure diagonal walking is not faster.
        movement = Vector2.ClampMagnitude(movement, 1);

        character.MoveTo(movement * speed);

        // Zoom in and out with the scroll wheel
        // The amount of zoom input is multiplied with the curreny zoom, making the it exponential - makes it feel linear
        camera.orthographicSize -= ((Input.mouseScrollDelta.y * camera.orthographicSize) / 5);
        camera.orthographicSize = Mathf.Clamp(camera.orthographicSize, 1, 20);

        for (int i = 0; i < abilities.Length; i++) {
            string key = (i + 1).ToString();
            if (Input.GetKey(key)) {
                RunAbility(hotbar[i]);
            }
        }
    }


}
