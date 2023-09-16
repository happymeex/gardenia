import Phaser from "phaser";
import Landing from "./scenes/Landing";
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
import { USER, UserSettings } from "./User";

const config: Phaser.Types.Core.GameConfig = {
    parent: "game-container",
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    scene: [
        Landing,
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

type UserData = UserSettings & {
    id: string;
    name: string;
};

const id = getUserId();
let authURL = "/auth";
if (id !== null) {
    authURL += `?id=${id}`;
}
fetch(authURL)
    .then((res) => res.text())
    .then((data) => {
        const userData: UserData = JSON.parse(data);
        setUserId(userData.id);
        USER.setName(userData.name);
        USER.setSettings(userData);
    });

const game = new Phaser.Game(config);
