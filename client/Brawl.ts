import Phaser from "phaser";
import background from "./static/forest_bg.png";
import playerSpritesheet from "./static/gardenia_spritesheet.png";
import forestPlatform from "./static/forest_platform.png";
import { loadSettingsIcon, configureSettingsPanel } from "./utils";

import Player, { getMotions, KeyData, NO_KEYS_PRESSED } from "./Player";

class Brawl extends Phaser.Scene {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    private player: Player;
    private uid: string;
    private isPaused = false;
    private keysPressed: KeyData = NO_KEYS_PRESSED;
    private socket: WebSocket | undefined = undefined;
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
    create(data: { socket: WebSocket; id: string; idList: string[] }) {
        this.socket = data.socket;
        this.uid = data.id;
        console.log("In brawl, idList", data.idList);
        this.socket.send("In brawl now:");
        this.socket.onmessage = (e) => {
            console.log("got message:", e.data);
            const data = JSON.parse(e.data);
            if (data.type === "movement") {
                //this.player.handleMotion(data.keysPressed);
                this.keysPressed = data.keysPressed;
            }
        };
        const { pause, resume, leave } = this.makeFlowControlFunctions();
        configureSettingsPanel(this, pause, resume, leave);
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
        if (cursors === undefined || this.isPaused) return;
        const keysPressed = getMotions(cursors);
        this.player.handleMotion(this.keysPressed);
        this.socket.send(
            `data_${JSON.stringify({
                source: this.uid,
                type: "movement",
                keysPressed,
            })}`
        );
    }

    /**
     * Creates handler functions to be run when pausing, resuming, and leaving the scene.
     * Specifically: pausing/resuming the physics engine, toggling `this.isPause`,
     * and closing the websocket connection if leaving.
     *
     * @returns Object whose values are the appropriate pause and resume functions
     */
    private makeFlowControlFunctions() {
        return {
            pause: () => {
                this.physics.pause();
                this.isPaused = true;
            },
            resume: () => {
                this.physics.resume();
                this.isPaused = false;
            },
            leave: () => {
                this.socket.close(1000); // indicates normal closure
            },
        };
    }
}

export default Brawl;
