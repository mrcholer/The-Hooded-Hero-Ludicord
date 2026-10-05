const getTimestamp = () => {
    let d = new Date();
    return d.getTime();
};

const generateRandomHint = (scene, width, height) => {
    const messages = [
        "Not all heroes wear capes, some wear hoods..",
        "Hint: Yes, you can double jump!",
        "The Hooded Hero's favorite show is Arrow, who would've guessed right??",
        "Hint: A little birdy said to stay away from Level 3, unless...",
        "Hint: Does our hero ever need to restock on arrows?? Spam away!",
        "Hint: Sword attacks do double the damage of arrows. You're welcome. ",
    ];
    const randomIndex = Math.floor(Math.random() * messages.length);

    const hintText = messages[randomIndex];

    const text = scene.add.text(width / 2, height / 1.1, hintText, {
        fontFamily: "customFont",
        fontSize: "15px",
        fontWeight: "bold",
        color: "#FFF",
    });

    text.setOrigin(0.5, 0.5);
};

export { generateRandomHint, getTimestamp };
