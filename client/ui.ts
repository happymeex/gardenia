import Phaser from "phaser";

type TextStyle = Phaser.Types.GameObjects.Text.TextStyle;

const baseTextColor = "#f5efa4";
export const menuTextStyleBase: TextStyle = {
    color: baseTextColor,
    fontFamily: "Alegreya SC",
    fontSize: "40px",
};

export const paragraphTextStyleBase: TextStyle = {
    color: baseTextColor,
    fontFamily: "Alegreya",
    fontSize: "24px",
};

type MenuStyle = {
    headerStyle: TextStyle;
    optionStyle: TextStyle;
    optionSpacing: number;
    headerMarginBottom: number;
};

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

export const settingsPanel: MenuStyle = {
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