import Phaser from "phaser";
import BrawlScene from "./brawl";

const config: Phaser.Types.Core.GameConfig = {
    parent: "game-container",
    width: 1680,
    height: 945,
    scene: [BrawlScene],
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 1500 },
        },
    },
};

const game = new Phaser.Game(config);
