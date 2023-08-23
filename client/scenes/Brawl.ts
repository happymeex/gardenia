import Phaser from "phaser";
import playerSpritesheet from "../static/gardenia_spritesheet.png";
import forestPlatform from "../static/forest_platform.png";
import { loadSettingsIcon, configurePauseMenu } from "../utils";
import { Field, MsgTypes } from "../enums";

import Player, { getMotions } from "../Player";
import { PlayerBody } from "../SpriteBody";

class Brawl extends Phaser.Scene {
    private player: Player;
    /** Object used to read this player's keypress status.*/
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    /** Maps ids to players and their keypress data. */
    private otherPlayers: Map<string, PlayerBody>;
    /** Id of this player. */
    private uid: string;
    /** If true, the game is paused because the menu is open. */
    private isPaused;
    /** Websocket used to sync game state with server. */
    private socket: WebSocket | undefined = undefined;
    /**
     * Id of the browser "process" responsible for pinging the server with this player's
     * sprite position/appearance every N milliseconds. Use this as the argument to clearInterval
     * when the player leaves the scene.
     */
    private spritePinger: number;

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
        this.isPaused = false; // need to reset this in case this brawl isn't the first one of the sitting
        this.otherPlayers = new Map();
        this.socket = data.socket;
        this.uid = data.id;

        this.socket.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg[Field.TYPE] === MsgTypes.SPRITE) {
                if (msg[Field.SOURCE] === this.uid) return;
                const playerBody = this.otherPlayers.get(msg[Field.SOURCE]);
                const { x, y } = msg[Field.POSITION];
                playerBody.setPosition(x, y);
                playerBody.setAppearance(msg[Field.APPEARANCE]);
            }
        };
        this.spritePinger = setInterval(() => {
            this.socket.send(
                `data_${JSON.stringify({
                    [Field.SOURCE]: this.uid,
                    [Field.TYPE]: MsgTypes.SPRITE,
                    [Field.POSITION]: this.player.getPosition(),
                    [Field.APPEARANCE]: this.player.getAppearance(),
                })}`
            );
        }, 30); // 33 fps
        const { pause, resume, leave } = this.makeFlowControlFunctions();
        configurePauseMenu(this, pause, resume, leave);
        const platforms = this.physics.add.staticGroup();

        platforms.create(100, 800, "platform");
        platforms.create(300, 800, "platform");
        platforms.create(400, 800, "platform");
        platforms.create(520, 800, "platform");
        platforms.create(730, 800, "platform");
        platforms.create(930, 800, "platform");
        platforms.create(1130, 800, "platform");
        platforms.create(1330, 800, "platform");
        data.idList.forEach((id, i) => {
            const x = 300 + 100 * i;
            const y = 300;
            if (id === this.uid) {
                this.player = new Player(id, this, platforms, x, y);
            } else
                this.otherPlayers.set(id, new PlayerBody(this, x, y, "right"));
        });
    }
    update() {
        if (this.cursors === undefined || this.isPaused) return;
        const keysPressed = getMotions(this.cursors);
        this.player.handleMotion(keysPressed);
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
                clearInterval(this.spritePinger);
                this.socket.close(1000); // indicates normal closure
            },
        };
    }
}

export default Brawl;
