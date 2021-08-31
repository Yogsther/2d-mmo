using UnityEngine;
using UnityEngine.UI;

[CreateAssetMenu(fileName = "Ability", menuName = "Ability/New", order = 1)]
public class Ability : ScriptableObject {
    public Sprite icon;
    public string name;
    public float cooldownTimeInSeconds;
    public float damage;
    public float heal;
    public bool needsTarget;
}