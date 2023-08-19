import Phaser from "phaser";
import BrawlScene from "./brawl";

const config: Phaser.Types.Core.GameConfig = {
    parent: "game-container",
    width: 1680,
    height: 945,
    scene: [BrawlScene],
    physics: {
        default: "arcade",
    },
};

const game = new Phaser.Game(config);
