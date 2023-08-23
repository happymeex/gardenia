import Phaser from "phaser";
import {
    menuTextStyleBase,
    paragraphTextStyleBase,
    darkenedColor,
    TextStyle,
    lowercaseFont,
    baseColor,
} from "../ui";
import {
    getUserId,
    makeClickable,
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
        const container = this.add.container(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2
        );
        const header = this.add.text(0, -250, "Brawl", {
            ...menuTextStyleBase,
            fontSize: "72px",
        });
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
        container.add([header, goBack].map((item) => item.setOrigin(0.5)));
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
        return () => {
            this.joinCodeInput.node.setAttribute("disabled", "");
            this.joinButton.disableInteractive();
            darkenText(this.joinButton);
            const socket = makeBrawlWebSocket(this.joinCode, id);
            this.socket = socket;
            socket.onopen = (e) => {
                undarkenText(this.joinButton);
                this.joinButton.text =
                    "Joined!\nWaiting for host to start the brawl...";
            };
            socket.onmessage = (e) => {
                console.log("got message:", e.data);
                const msg = e.data as string;
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
                if (msg.startsWith("idList")) {
                    const idList: string[] = JSON.parse(
                        msg.replace(new RegExp("idList_"), "")
                    );
                    this.idList = idList;
                } else if (msg === "activate") {
                    start();
                }
            };
            socket.onerror = (e) => {
                showNotification(
                    this,
                    "Brawl not found!\n(Or, you are attempting to join twice.)"
                );
                this.joinButton.setInteractive();
                this.joinCodeInput.node.removeAttribute("disabled");
                undarkenText(this.joinButton);
            };
            socket.onclose = (e) => {
                this.joinButton.setInteractive();
                this.joinCodeInput.node.removeAttribute("disabled");
                undarkenText(this.joinButton);
            };
        };
    }
    shutdown() {
        this.joinCodeInput.destroy();
    }
}

export default BrawlJoin;