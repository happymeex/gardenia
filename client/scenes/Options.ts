import Phaser from "phaser";
import { CANVAS_CENTER, USER, UserSettings } from "../constants";
import {
    menuTextStyleBase,
    makeClickable,
    baseColorNumber,
    paragraphTextStyleBase,
} from "../ui";

const CHECKBOX_SIZE = 32;
const OPTIONS: Array<{
    label: string;
    onChange: (state: boolean) => void;
    setting: keyof UserSettings;
}> = [
    {
        label: "Sound Effects",
        onChange: (state: boolean) => {
            USER.setSetting("soundFX", state);
        },
        setting: "soundFX",
    },
    {
        label: "Music",
        onChange: (state: boolean) => {
            USER.setSetting("music", state);
        },
        setting: "music",
    },
];

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

class Checkbox {
    private innerFill: Phaser.GameObjects.Rectangle;
    private outerBox: Phaser.GameObjects.Rectangle;

    /**
     * Adds a checkbox to `scene` whose checked status is given by `initialState`.
     *
     * @param scene Scene to add the checkbox to
     * @param x x-coordinate of checkbox location
     * @param y y-coordinate of checkbox location
     * @param checked initial status of the checkbox.
     */
    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        private checked: boolean,
        private onChange: (state: boolean) => void
    ) {
        this.outerBox = scene.add
            .rectangle(x, y, CHECKBOX_SIZE, CHECKBOX_SIZE)
            .setStrokeStyle(4, baseColorNumber);
        this.innerFill = scene.add
            .rectangle(x, y, 0.6 * CHECKBOX_SIZE, 0.6 * CHECKBOX_SIZE)
            .setFillStyle(baseColorNumber);
        if (!checked) {
            this.innerFill.setVisible(false);
        }
        makeClickable(
            this.outerBox,
            scene,
            () => {
                this.setState(!this.checked);
            },
            false,
            1,
            1,
            0.1
        );
    }

    /**
     * Adds the checkbox to `container`. Note that the coordinates `x`, `y` passed into
     * the constructor become relative to the container's position.
     *
     */
    public addToContainer(container: Phaser.GameObjects.Container) {
        container.add([this.outerBox, this.innerFill]);
    }

    /** Checks the checkbox if `state` is true and unchecks otherwise. */
    public setState(state: boolean) {
        this.checked = state;
        this.onChange(state);
        this.innerFill.setVisible(state);
    }
}

export default Options;
