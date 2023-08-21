import Phaser from "phaser";
import background from "./static/forest_bg.png";
import playerSpritesheet from "./static/gardenia_spritesheet.png";
import forestPlatform from "./static/forest_platform.png";
import { loadSettingsIcon, configureSettingsPanel } from "./utils";

import Player, {
    getMotions,
    KeyData,
    hasChanged,
    NO_KEYS_PRESSED,
} from "./Player";

class Brawl extends Phaser.Scene {
    /** Object used to read this player's keypress status.*/
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    /** Maps ids to players and their keypress data. */
    private players: Map<string, { player: Player; keyData: KeyData }> =
        new Map();
    /** Id of this player. */
    private uid: string;
    /** If true, the game is paused because the menu is open. */
    private isPaused = false;
    /** Websocket used to sync game state with server. */
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
        this.socket.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.type === "movement") {
                    this.setPlayerKeyData(data.keysPressed, data.source);
                } else if (data.type === "position") {
                    if (data.source === this.uid) return;
                    const { player, keyData } = this.players.get(data.source);
                    player.updatePosition(data.position.x, data.position.y);
                }
            } catch (err) {
                console.log("error JSON parsing:", e.data);
            }
        };
        setInterval(() => {
            this.socket.send(
                `data_${JSON.stringify({
                    source: this.uid,
                    type: "position",
                    position: this.getPlayerPosition(),
                })}`
            );
        }, 30); // 33 fps
        const { pause, resume, leave } = this.makeFlowControlFunctions();
        configureSettingsPanel(this, pause, resume, leave);
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
            this.players.set(id, {
                player: new Player(
                    id,
                    this,
                    platforms,
                    300 + 100 * i,
                    300,
                    id === this.uid // enable physics only for this player
                ),
                keyData: NO_KEYS_PRESSED,
            });
        });
    }
    update() {
        if (this.cursors === undefined || this.isPaused) return;
        const keysPressed = getMotions(this.cursors);
        if (hasChanged(keysPressed, this.player().keyData)) {
            console.log("detected change!");
            this.socket.send(
                `data_${JSON.stringify({
                    source: this.uid,
                    type: "movement",
                    keysPressed,
                })}`
            );
            this.setPlayerKeyData(keysPressed);
        }
        //player.handleMotion(keysPressed);
        for (const { player, keyData } of this.players.values()) {
            player.handleMotion(keyData);
        }
    }

    /**
     * @param id Id of the player to be retrieved. Defaults to this player's.
     * @returns The player controlled by this client's user.
     */
    private player(id = this.uid): { player: Player; keyData: KeyData } {
        return this.players.get(id);
    }

    /**
     * Updates the keypress data of the player with the given id.
     *
     * @param keyData Keypress data
     * @param id Player id. Defaults to this player's.
     */
    private setPlayerKeyData(keyData: KeyData, id = this.uid) {
        const pkg = this.player(id);
        pkg.keyData = keyData;
    }

    private getPlayerPosition(id = this.uid) {
        return this.player(id).player.getPosition();
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
