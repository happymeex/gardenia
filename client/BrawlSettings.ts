import Phaser from "phaser";
import { menuTextStyleBase } from "./ui";
import { makeClickable } from "./utils";

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
        makeClickable(returnToHome, this, () => this.scene.start("main-menu"));
        makeClickable(begin, this, () => this.scene.start("brawl"));
        container.add(
            [header, returnToHome, begin, generateLink].map((item) =>
                item.setOrigin(0.5)
            )
        );
        const socket = new WebSocket("ws://localhost:8080/ws");
        socket.onopen = (e) => {
            console.log("connection opened", e);
            socket.send("helloooo!");
        };
        socket.onmessage = (e) => {
            console.log("message:", e);
        };
    }
}

export default BrawlSettings;
