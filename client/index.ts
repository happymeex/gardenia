import Phaser from "phaser";
import MainMenu from "./MainMenu";
import Story from "./Story";
import Survival from "./Survival";
import Brawl from "./Brawl";

const config: Phaser.Types.Core.GameConfig = {
    parent: "game-container",
    width: 1680,
    height: 945,
    scene: [MainMenu, Story, Survival, Brawl],
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 1500 },
        },
    },
};

const game = new Phaser.Game(config);
