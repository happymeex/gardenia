import Phaser from "phaser";
import MainMenu from "./scenes/MainMenu";
import Story from "./scenes/Story";
import Survival from "./scenes/Survival";
import Brawl from "./scenes/Brawl";
import SurvivalSettings from "./scenes/SurvivalSettings";
import BrawlSettings from "./scenes/BrawlSettings";
import BrawlJoin from "./scenes/BrawlJoin";
import BrawlCreate from "./scenes/BrawlCreate";
import Tutorial from "./scenes/Tutorial";
import Options from "./scenes/Options";
import { getUserId, setUserId } from "./utils";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./constants";
import { USER } from "./constants";

const config: Phaser.Types.Core.GameConfig = {
    parent: "game-container",
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    scene: [
        MainMenu,
        Story,
        Survival,
        SurvivalSettings,
        Brawl,
        BrawlSettings,
        BrawlJoin,
        BrawlCreate,
        Tutorial,
        Options,
    ],
    physics: {
        default: "arcade",
        arcade: {
            debug: true,
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
            USER.setName(id);
            console.log("got id:", id);
            setUserId(id);
        });
} else {
    console.log("existing id:", id);
    USER.setName(id);
    fetch(`/auth?id=${id}`);
}

const game = new Phaser.Game(config);
