import Phaser from "phaser";
import { CANVAS_CENTER, SpriteSheet } from "../constants";
import {
    menuTextStyleBase,
    paragraphTextStyleBase,
    darkenedColor,
    TextStyle,
    lowercaseFont,
    baseColor,
    makeClickable,
} from "../ui";
import {
    getUserId,
    makeBrawlWebSocket,
    undarkenText,
    darkenText,
    showNotification,
} from "../utils";

class BrawlJoin extends Phaser.Scene {
    public constructor() {
        super({ key: "brawl-join" });
    }
    private joinCodeInput: Phaser.GameObjects.DOMElement;
    private joinButton: Phaser.GameObjects.Text;
    private joinCode: string;
    private idList: string[];
    private socket: WebSocket;

    create() {
        this.add.image(...CANVAS_CENTER, SpriteSheet.MENU_BG_BLURRED);
        const container = this.add.container(...CANVAS_CENTER);
        const header = this.add.text(0, -250, "Brawl", {
            ...menuTextStyleBase,
            fontSize: "72px",
        });
        const subHeader = this.add.text(
            0,
            -200,
            "Duke it out with friends!",
            paragraphTextStyleBase
        );
        const goBack = this.add.text(
            -400,
            -250,
            "\u2039 Back",
            menuTextStyleBase
        );
        const largeParagraph: TextStyle = {
            ...paragraphTextStyleBase,
            fontSize: "32px",
        };
        const enterJoinCode = this.add
            .text(-100, 0, "Enter a join code:", largeParagraph)
            .setOrigin(0.5);
        this.joinButton = this.add
            .text(0, 10, "Join", {
                ...menuTextStyleBase,
                color: darkenedColor,
            })
            .setOrigin(0.5, 0)
            .setAlign("center");
        this.joinCodeInput = this.add.dom(
            125,
            0,
            "input",
            `display: initial;
            background-color: transparent;
            color: ${baseColor};
            border: none;
            font-size: 24px;
            font-family: ${lowercaseFont};
            text-align: center;
            width: 200px;
            border-bottom: 1px solid ${baseColor}`
        );
        this.joinCodeInput.node.id = "join-code-input"; // to apply focus styling that I put in index.html
        this.joinCodeInput.node["placeholder"] = "Join code";
        this.joinCodeInput.addListener("input");
        this.joinCodeInput.node.addEventListener(
            "input",
            this.makeInputHandler()
        );
        const joinCodeContainer = this.add.container(0, -50, [
            enterJoinCode,
            this.joinCodeInput,
        ]);
        makeClickable(goBack, this, () => {
            this.scene.start("brawl-settings");
            if (this.socket) this.socket.close(1000);
        });
        makeClickable(this.joinButton, this, this.makeJoinHandler());
        this.joinButton.disableInteractive();

        container.add(joinCodeContainer);
        container.add(
            [header, subHeader, goBack].map((item) => item.setOrigin(0.5))
        );
        container.add(this.joinButton);
    }
    private makeInputHandler() {
        return (e: Event) => {
            const target = e.target as HTMLInputElement;
            this.joinCode = target.value;
            if (target.value.length > 0) {
                this.joinButton.setStyle({
                    ...this.joinButton.style,
                    color: baseColor,
                });
                this.joinButton.setInteractive();
            } else {
                this.joinButton.setStyle({
                    ...this.joinButton.style,
                    color: darkenedColor,
                });
                this.joinButton.disableInteractive();
            }
        };
    }
    private makeJoinHandler() {
        const id = getUserId();
        if (id === null) throw new Error("Unexpected null id!");
        return () => {
            this.joinCodeInput.node.setAttribute("disabled", "");
            this.joinButton.disableInteractive();
            darkenText(this.joinButton);
            const socket = makeBrawlWebSocket(this.joinCode, id);
            this.socket = socket;
            socket.onopen = (e) => {};
            socket.onmessage = (e) => {
                console.log("got message:", e.data);
                const start = () => {
                    socket.send("begin_");
                    this.socket.onerror = () => {};
                    this.socket.onclose = () => {};
                    this.scene.start("brawl", {
                        socket,
                        id,
                        idList: this.idList,
                    });
                };
                const msg = e.data as string;
                const [type, content] = msg.split("_", 2);
                if (type === "validate") {
                    undarkenText(this.joinButton);
                    this.joinButton.text =
                        "Joined!\nWaiting for host to start the brawl...";
                } else if (type === "activate") {
                    start();
                } else if (type === "idList") {
                    const idList: string[] = JSON.parse(content);
                    this.idList = idList;
                } else if (type === "error") {
                    showNotification(this, content);
                }
            };
            socket.onerror = (e) => {
                showNotification(this, "Unexpected connection error!");
                this.allowClickJoin();
            };
            socket.onclose = (e) => {
                this.allowClickJoin();
            };
        };
    }
    /** Resets state of the join button and join code input to allow interactivity. */
    private allowClickJoin() {
        this.joinButton.text = "Join";
        this.joinButton.setInteractive();
        this.joinCodeInput.node.removeAttribute("disabled");
        undarkenText(this.joinButton);
    }
    shutdown() {
        this.joinCodeInput.destroy();
    }
}

export default BrawlJoin;
