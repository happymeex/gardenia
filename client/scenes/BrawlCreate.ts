import Phaser from "phaser";
import { CANVAS_CENTER, SpriteSheet } from "../constants";
import { USER } from "../User";
import {
    makeClickable,
    largeParagraph,
    menuTextStyleBase,
    darkenedColor,
    paragraphTextStyleBase,
} from "../ui";
import { makeBrawlWebSocket, darkenText, undarkenText } from "../utils";

class BrawlCreate extends Phaser.Scene {
    public constructor() {
        super({ key: "brawl-create" });
    }

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
        const generateLink = this.add.text(
            0,
            0,
            "Send a join code to up to two friends:",
            largeParagraph
        );
        const brawlIdText = this.add.text(
            0,
            50,
            "Loading...",
            paragraphTextStyleBase
        );
        const numJoined = this.add.text(
            0,
            125,
            `No others have joined`,
            largeParagraph
        );
        const begin = this.add.text(0, 175, "Begin", {
            ...menuTextStyleBase,
            color: darkenedColor,
        });

        const id = USER.getName();
        fetch(`/new-brawl-id?id=${id}`)
            .then((res) => res.text())
            .then((brawlId) => {
                brawlIdText.text = brawlId;
                return brawlId;
            })
            .then((brawlId) => {
                const socket = makeBrawlWebSocket(brawlId, id, true); // as host
                this.socket = socket;
                socket.onopen = (e) => {
                    // possibly do something here
                };
                socket.onmessage = (e) => {
                    console.log("got message:", e.data);
                    const msg = e.data as string;
                    const start = () => {
                        socket.send("begin_");
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
                        const numOthers = idList.length - 1;
                        numJoined.text =
                            numOthers === 1
                                ? "1 other has joined"
                                : `${
                                      numOthers ? numOthers : 0
                                  } others have joined`;
                        if (idList.length > 1) {
                            makeClickable(begin, this, () => {
                                if (socket.readyState === socket.OPEN) {
                                    start();
                                }
                            });
                            undarkenText(begin);
                        } else {
                            begin.removeInteractive();
                            darkenText(begin);
                        }
                    } else if (msg === "activate") {
                        start();
                    }
                };
            });
        makeClickable(goBack, this, () => {
            this.scene.start("brawl-settings");
            if (this.socket) this.socket.close(1000);
        });
        container.add(
            [
                header,
                subHeader,
                goBack,
                generateLink,
                brawlIdText,
                numJoined,
                begin,
            ].map((item) => item.setOrigin(0.5))
        );
    }
}

export default BrawlCreate;
