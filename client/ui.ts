import Phaser from "phaser";

type TextStyle = Phaser.Types.GameObjects.Text.TextStyle;

export const MENU_TEXTSTYLE_BASE: TextStyle = {
    color: "#f5efa4",
    fontFamily: "Alegreya SC",
};

type MenuStyle = {
    headerStyle: TextStyle;
    optionStyle: TextStyle;
    optionSpacing: number;
    headerMarginBottom: number;
};

export const mainMenu: MenuStyle = {
    headerStyle: {
        ...MENU_TEXTSTYLE_BASE,
        fontSize: "120px",
    },
    optionStyle: {
        ...MENU_TEXTSTYLE_BASE,
        fontSize: "56px",
    },
    optionSpacing: 80,
    headerMarginBottom: 128,
};

export const settingsPanel: MenuStyle = {
    headerStyle: {
        ...MENU_TEXTSTYLE_BASE,
        fontSize: "72px",
    },
    optionStyle: {
        ...MENU_TEXTSTYLE_BASE,
        fontSize: "32px",
    },
    optionSpacing: 48,
    headerMarginBottom: 80,
};
