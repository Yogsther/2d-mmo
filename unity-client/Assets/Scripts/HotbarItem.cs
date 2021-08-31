using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class HotbarItem : MonoBehaviour {

    public Text keyText;
    public Image image;
    public Image cooldownOverlay;
    public Ability ability;

    float cooldownLeft = 0;

    public void Init(string key, Ability ability) {
        this.ability = ability;
        this.image.sprite = ability.icon;
        this.keyText.text = key;
    }

    public void StartCooldown() {
        if (CanBeUsed()) cooldownLeft = ability.cooldownTimeInSeconds;
    }

    public bool CanBeUsed() {
        return cooldownLeft == 0;
    }

    void Update() {
        cooldownOverlay.fillAmount = cooldownLeft / ability.cooldownTimeInSeconds;
        if (cooldownLeft > 0) cooldownLeft -= Time.deltaTime;
        if (cooldownLeft < 0) cooldownLeft = 0;
    }
}
