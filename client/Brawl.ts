import Phaser from "phaser";
import background from "./static/forest_bg.png";
import playerSpritesheet from "./static/gardenia_spritesheet.png";
import forestPlatform from "./static/forest_platform.png";
import { loadSettingsIcon, addSettingsIcon } from "./utils";

import Player, { getMotions } from "./Player";

class Brawl extends Phaser.Scene {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    private player: Player;
    public constructor() {
        super({ key: "brawl" });
    }
    preload() {
        loadSettingsIcon(this);
        this.load.image("platform", forestPlatform);
        this.load.spritesheet("player", playerSpritesheet, {
            frameWidth: 128,
            frameHeight: 128,
        });
        this.cursors = this.input.keyboard?.createCursorKeys();
    }
    create() {
        addSettingsIcon(this);
        const platforms = this.physics.add.staticGroup();

        platforms.create(100, 800, "platform");
        platforms.create(300, 800, "platform");
        platforms.create(400, 800, "platform");
        platforms.create(520, 800, "platform");
        platforms.create(730, 800, "platform");
        this.player = new Player("meex", this, platforms, 300, 300);
    }
    update() {
        const cursors = this.cursors; // holds keypress data
        if (cursors === undefined) return;
        this.player.handleMotion(getMotions(cursors));
    }
}

export default Brawl;
