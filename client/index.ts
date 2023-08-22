import Phaser from "phaser";
import MainMenu from "./scenes/MainMenu";
import Story from "./scenes/Story";
import Survival from "./scenes/Survival";
import Brawl from "./scenes/Brawl";
import SurvivalSettings from "./scenes/SurvivalSettings";
import BrawlSettings from "./scenes/BrawlSettings";
import { getUserId, setUserId } from "./utils";

const config: Phaser.Types.Core.GameConfig = {
    parent: "game-container",
    width: 1344,
    height: 756,
    scene: [MainMenu, Story, Survival, SurvivalSettings, BrawlSettings, Brawl],
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 1500 },
        },
    },
    dom: {
        createContainer: true,
    },
    fps: {
        target: 30,
    },
};

const id = getUserId();
if (id === null) {
    fetch("/new-id")
        .then((res) => res.text())
        .then((id) => {
            console.log("got id:", id);
            setUserId(id);
        });
} else {
    console.log("existing id:", id);
    fetch(`/auth?id=${id}`);
}

const game = new Phaser.Game(config);
