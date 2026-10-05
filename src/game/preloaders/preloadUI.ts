import type * as Phaser from "phaser";
// PROJECTILES
export function preloadUI(scene: Phaser.Scene) {
    scene.load.image("header", "ui/Panels/header.png");
    scene.load.image("header-shadow", "ui/Panels/header_shadow.png");
    scene.load.image("panel-1", "ui/Panels/panel_1.png");
    scene.load.image("panel-2", "ui/Panels/panel_2.png");
    scene.load.image("panel-3", "ui/Panels/panel_3.png");
    scene.load.image("panel-4", "ui/Panels/panel_4.png");

    scene.load.image("player-icon", "ui/Status/portrait_character.png");
    scene.load.image("portrait", "ui/Status/portrait.png");

    scene.load.image("stage-icon", "ui/Stage/stage_default.png");

    scene.load.image("textbox", "ui/Textbox/textbox.png");

    scene.load.image("coin", "ui/Icons/icon_small_coin.png");
    scene.load.image("star", "ui/Icons/icon_big_star.png");
    scene.load.image("star-full", "ui/Stage/star_full.png");
    scene.load.image("star-shadow", "ui/Stage/star_shadow.png");
    scene.load.image("heart-empty", "ui/Status/heart_empty.png");
    scene.load.image("heart-fill", "ui/Status/heart_fill.png");
    scene.load.image("thunderbolt", "ui/Icons/icon_big_energy.png");
    scene.load.image("profile", "ui/Icons/icon_small_profile.png");
    scene.load.image("settings-button", "ui/Icons/icon_big_setting.png");
    scene.load.image("home", "ui/Icons/icon_small_home.png");
    scene.load.image("restart", "ui/Icons/icon_small_restart.png");
    scene.load.image("small-close", "ui/Icons/icon_small_close.png");
    scene.load.image("small-left", "ui/Icons/icon_small_left.png");
    scene.load.image("controls-btn", "ui/Icons/icon_big_book.png");
    scene.load.image("contacts-btn", "ui/Icons/icon_small_message.png");
    scene.load.image("trophy", "ui/Status/trophy.svg");

    scene.load.image("next-btn", "ui/Icons/icon_small_next.png");
    scene.load.image("prev-btn", "ui/Icons/icon_small_prev.png");
    scene.load.image("music-btn-on", "ui/Icons/icon_small_music_on.png");
    scene.load.image("music-btn-off", "ui/Icons/icon_small_music_off.png");
    scene.load.image("sound-btn-on", "ui/Icons/icon_small_sound_on.png");
    scene.load.image("sound-btn-off", "ui/Icons/icon_small_sound_off.png");
    scene.load.image("mute-btn-on", "ui/Icons/icon_small_notification.png");
    scene.load.image("mute-btn-off", "ui/Icons/icon_small_notificationoff.png");

    scene.load.image("switch-off-bg", "ui/Settings/switch_off_bg.png");

    scene.load.image("switch-on", "ui/Settings/settings_slider_yellow.png");
    scene.load.image("switch-off", "ui/Settings/switch_off.png");
    scene.load.image("skull", "ui/Stage/defeat.png");
    scene.load.image("yellow-bar", "ui/Settings/settings_slider_fill.png");

    scene.load.image("page", "ui/Icons/page_icon.png");
    scene.load.image("left-key", "ui/Icons/arrow_left_icon.png");
    scene.load.image("right-key", "ui/Icons/arrow_right_icon.png");
    scene.load.image("space-key", "ui/Icons/spacebar_icon.png");
    scene.load.image("shift-key", "ui/Icons/shift_icon.png");
    scene.load.image("q-key", "ui/Icons/Q_icon.png");
    scene.load.image("e-key", "ui/Icons/E_icon.png");

    scene.load.image("back-btn", "ui/Buttons/back_btn.png");
    scene.load.image("close-btn", "ui/Buttons/close_btn.png");
    scene.load.image("restart-btn", "ui/Buttons/restart_btn.png");
    scene.load.image("restart-btn-big", "ui/Buttons/restart_btn_big.png");
    scene.load.image("email-btn", "ui/Buttons/email_btn.png");
    scene.load.image("home-btn", "ui/Buttons/home_btn.png");
    scene.load.image("home-btn-big", "ui/Buttons/home_btn_big.png");
    scene.load.image("yes-btn", "ui/Buttons/yes_btn.png");
    scene.load.image("no-btn", "ui/Buttons/no_btn.png");
    scene.load.image("play-btn", "ui/Buttons/play_btn.png");

    scene.load.image("blue-button", "ui/Buttons/button_blue.png");
    scene.load.image("brown-button", "ui/Buttons/button_brown.png");
    scene.load.image("red-button", "ui/Buttons/button_red.png");
    scene.load.image("green-button", "ui/Buttons/button_green.png");
    scene.load.image("yellow-button", "ui/Buttons/button_yellow.png");

    scene.load.image("blue-long-button", "ui/Buttons/button_color_blue.png");
    scene.load.image("brown-long-button", "ui/Buttons/button_color_brown.png");
    scene.load.image("red-long-button", "ui/Buttons/button_color_red.png");
    scene.load.image("green-long-button", "ui/Buttons/button_color_green.png");
    scene.load.image(
        "yellow-long-button",
        "ui/Buttons/button_color_yellow.png"
    );

    scene.load.image("small-blue-button", "ui/Buttons/button_small_blue.png");
    scene.load.image("small-red-button", "ui/Buttons/button_small_red.png");
    scene.load.image(
        "small-yellow-button",
        "ui/Buttons/button_square_yellow.png"
    );
}
