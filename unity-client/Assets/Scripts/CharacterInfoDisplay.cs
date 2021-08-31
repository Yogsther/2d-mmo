using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;


public class CharacterInfoDisplay : MonoBehaviour {

    public Text name;
    public Slider hpSlider;
    public Text animateTextPrefab;
    public Transform animateTextFromLeft, animateTextFromRight, animateTextTo; // The end position of text animation

    public Color32 positiveTextColor, negativeColorText;
    public List<Text> textAnimations;
    float textAnimationSpeed = 2f;

    public void AnimateText(float value) {
        Text text = Instantiate(animateTextPrefab, transform);
        text.transform.position = new Vector2(Random.Range(animateTextFromLeft.position.x, animateTextFromRight.position.x), animateTextFromLeft.position.y);
        bool positive = value >= 0;
        text.gameObject.SetActive(true);
        text.text = (positive ? "+" : "-") + value;
        text.color = positive ? positiveTextColor : negativeColorText;
        textAnimations.Add(text);
    }

    void Update() {
        foreach (Text text in textAnimations.ToList()) {
            text.transform.position = new Vector2(text.transform.position.x, text.transform.position.y + Time.deltaTime * textAnimationSpeed);
            float distanceLeft = animateTextTo.position.y - text.transform.position.y;
            if (distanceLeft < 0) {
                textAnimations.Remove(text);
                Destroy(text.gameObject);
            } else if (distanceLeft < 1) {
                Color32 newColor = text.color;
                newColor.a = (byte)(distanceLeft * 255);
                text.color = newColor;
            }
        }

    }
}

