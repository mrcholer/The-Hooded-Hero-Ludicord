import type * as Phaser from "phaser";
// AUDIO
export function preloadAudio(scene: Phaser.Scene) {
    // THEME MUSIC
    scene.load.audio("menu-theme", "music/menu_music.ogg");
    scene.load.audio("forest-theme", "music/forest_theme.ogg");
    scene.load.audio("cave-theme", "music/cave_theme.ogg");
    scene.load.audio("boss-theme", "music/boss_theme.ogg");
    scene.load.audio("online-theme", "music/online_theme.ogg");
    scene.load.audio("sakura-theme", "music/sakura_theme.ogg");

    // SOUND EFFECTS
    scene.load.audio("projectile-launch", "music/projectile_launch.ogg");
    scene.load.audio("step", "music/step_mud.ogg");
    scene.load.audio("jump", "music/jump.ogg");
    scene.load.audio("swipe", "music/swipe.ogg");
    scene.load.audio("damage", "music/punch.ogg");
    scene.load.audio("enemy-damage", "music/enemyhit.ogg");
    scene.load.audio("coin-pickup", "music/coin_pickup.ogg");
    scene.load.audio("cursorOver", "music/cursorOver.ogg");
    scene.load.audio("flute", "music/flute.ogg");
    scene.load.audio("page-flip", "music/page_flip.ogg");
    scene.load.audio("select", "music/select.ogg");
    scene.load.audio("lose", "music/lose.ogg");
    scene.load.audio("win", "music/win.ogg");
    scene.load.audio("fail", "music/fail.ogg");
    scene.load.audio("countdown", "music/countdown.ogg");
    scene.load.audio("go", "music/go.ogg");
}
