import Phaser from "phaser";
import { CANVAS_CENTER } from "../constants";
import { USER, OPTIONS } from "../User";
import {
    Checkbox,
    menuTextStyleBase,
    makeClickable,
    paragraphTextStyleBase,
} from "../ui";

/**
 * Screen with options to toggle volume, sound fx
 */
class Options extends Phaser.Scene {
    constructor() {
        super({ key: "options" });
    }
    create() {
        const container = this.add.container(...CANVAS_CENTER);
        const header = this.add
            .text(0, -250, "Options", menuTextStyleBase)
            .setOrigin(0.5);
        const goBack = this.add
            .text(-400, -250, "\u2039 Back", menuTextStyleBase)
            .setOrigin(0.5);

        const settings = USER.getSettings();
        const options = this.add.container(0, 0);
        OPTIONS.forEach(({ label, onChange, setting }, i) => {
            const optionContainer = this.add.container(0, 60 * i);
            const checkbox = new Checkbox(
                this,
                -100,
                0,
                settings[setting],
                onChange
            );
            const text = this.add
                .text(-50, 0, label, paragraphTextStyleBase)
                .setOrigin(0, 0.5);
            optionContainer.add(text);
            checkbox.addToContainer(optionContainer);
            options.add(optionContainer);
        });

        container.add([header, goBack, options]);
        makeClickable(goBack, this, () => {
            this.scene.start("main-menu");
        });
    }
}

export default Options;
