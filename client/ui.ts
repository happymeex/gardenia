import Phaser from "phaser";

export type TextStyle = Phaser.Types.GameObjects.Text.TextStyle;

export const baseColor = "#f5efa4";
export const darkenedColor = "#8f8b5d";
export const baseColorNumber = 0xf5efa4;
export const capitalFont = "Alegreya SC";
export const lowercaseFont = "Alegreya";
/** Text style for menu text. Use for clickable buttons as well. */
export const menuTextStyleBase: TextStyle = {
    color: baseColor,
    fontFamily: capitalFont,
    fontSize: "40px",
};

/** Text style for lowercase, body text, small font size. */
export const paragraphTextStyleBase: TextStyle = {
    color: baseColor,
    fontFamily: lowercaseFont,
    fontSize: "24px",
};

/** Text style for lowercase, body text, medium font size. */
export const largeParagraph: TextStyle = {
    ...paragraphTextStyleBase,
    fontSize: "32px",
};

type MenuStyle = {
    headerStyle: TextStyle;
    optionStyle: TextStyle;
    optionSpacing: number;
    headerMarginBottom: number;
};

/** Styles for main menu. Specifies font, font size, spacing. */
export const mainMenu: MenuStyle = {
    headerStyle: {
        ...menuTextStyleBase,
        fontSize: "120px",
    },
    optionStyle: {
        ...menuTextStyleBase,
        fontSize: "56px",
    },
    optionSpacing: 80,
    headerMarginBottom: 128,
};

/** Styles for in-game pause menu. Specifies font, font size, spacing. */
export const pauseMenu: MenuStyle = {
    headerStyle: {
        ...menuTextStyleBase,
        fontSize: "72px",
    },
    optionStyle: {
        ...menuTextStyleBase,
        fontSize: "32px",
    },
    optionSpacing: 48,
    headerMarginBottom: 80,
};
