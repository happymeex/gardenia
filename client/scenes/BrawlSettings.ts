import Phaser from "phaser";
import { menuTextStyleBase } from "../ui";
import { getRandomString, makeClickable, makeWebSocket } from "../utils";

class BrawlSettings extends Phaser.Scene {
    public constructor() {
        super({ key: "brawl-settings" });
    }

    private idList: string[];

    create() {
        const container = this.add.container(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2
        );
        const header = this.add.text(0, 0, "Brawl", {
            ...menuTextStyleBase,
            fontSize: "72px",
        });
        const returnToHome = this.add.text(
            -200,
            200,
            "Return to menu",
            menuTextStyleBase
        );
        const begin = this.add.text(200, 200, "Begin", menuTextStyleBase);
        const generateLink = this.add.text(
            0,
            100,
            "Share this link with friends:",
            menuTextStyleBase
        );

        const socket = makeWebSocket();
        const id = getRandomString(5);
        socket.onopen = (e) => {
            socket.send(`ready_${id}`);
        };
        socket.onmessage = (e) => {
            console.log("got message:", e.data);
            const msg = e.data as string;
            const start = () => {
                socket.send("begin_");
                this.scene.start("brawl", { socket, id, idList: this.idList });
            };
            if (msg.startsWith("idList")) {
                const idList: string[] = JSON.parse(
                    msg.replace(new RegExp("idList_"), "")
                );
                this.idList = idList;
                if (idList.length > 1) {
                    makeClickable(begin, this, () => {
                        if (socket.readyState === socket.OPEN) {
                            start();
                        }
                    });
                } else {
                    begin.removeInteractive();
                }
            } else if (msg === "activate") {
                start();
            }
        };

        makeClickable(returnToHome, this, () => {
            this.scene.start("main-menu");
            socket.close(1000);
        });
        container.add(
            [header, returnToHome, begin, generateLink].map((item) =>
                item.setOrigin(0.5)
            )
        );
    }
}

export default BrawlSettings;
