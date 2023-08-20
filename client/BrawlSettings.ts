import Phaser from "phaser";
import { menuTextStyleBase } from "./ui";
import { makeClickable, makeWebSocket } from "./utils";

class BrawlSettings extends Phaser.Scene {
    public constructor() {
        super({ key: "brawl-settings" });
    }

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
        socket.onopen = (e) => {
            socket.send("ready");
        };
        socket.onmessage = (e) => {
            if (e.data === "true") {
                makeClickable(begin, this, () =>
                    this.scene.start("brawl", { socket })
                );
            } else begin.removeInteractive();
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
