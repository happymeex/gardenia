import Phaser from "phaser";
import { CANVAS_CENTER } from "../utils/constants";
import { menuTextStyleBase, paragraphTextStyleBase } from "../utils/ui";
import { makeClickable } from "../utils/ui";

class Story extends Phaser.Scene {
    public constructor() {
        super({ key: "story" });
    }
    create() {
        const container = this.add.container(...CANVAS_CENTER);
        const message = this.add.text(
            0,
            0,
            "Apologies! Story mode does not exist yet.\n\n If you'd like to " +
                "support its development,\nor if you think you can help with " +
                "development,\n send me a message on " +
                "Twitter @EC_Matrix.\n\nThank you for playing!",
            { ...paragraphTextStyleBase, align: "center" }
        );

        const returnToHome = this.add.text(
            0,
            200,
            "Return to menu",
            menuTextStyleBase
        );
        makeClickable(returnToHome, this, () => {
            this.scene.start("main-menu");
        });
        container.add(
            [message, returnToHome].map((item) => item.setOrigin(0.5))
        );
    }
}

export default Story;
