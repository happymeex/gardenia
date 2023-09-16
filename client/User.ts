import { BGM } from "./BGM";

export interface UserSettings {
    /** If true, sound effects (punching, damage, etc.) play. */
    sfxOn: boolean;
    /** If true, background music plays. */
    musicOn: boolean;
}

const defaultSettings: UserSettings = {
    sfxOn: true,
    musicOn: true,
};

export const OPTIONS: Array<{
    label: string;
    onChange: (state: boolean) => void;
    setting: keyof UserSettings;
}> = [
    {
        label: "Sound Effects",
        onChange: (state: boolean) => {
            USER.setSetting("sfxOn", state);
        },
        setting: "sfxOn",
    },
    {
        label: "Music",
        onChange: (state: boolean) => {
            USER.setSetting("musicOn", state);
        },
        setting: "musicOn",
    },
];

class User {
    private name = "Anonymous";
    private hasSetName = false;
    private settings: UserSettings = defaultSettings;
    constructor() {}

    /** Gets user's name */
    public getName(): string {
        return this.name;
    }

    /**
     * Sets the user's name to `name`. Does nothing on subsequent calls.
     *
     * @returns true if name was set, false if not.
     */
    public setName(name: string): boolean {
        if (this.hasSetName) return false;
        this.name = name;
        this.hasSetName = true;
        return true;
    }

    /** Gets user settings. */
    public getSettings(): UserSettings {
        return structuredClone(this.settings);
    }

    /**
     *
     * @param setting name of the setting
     * @param value value to set the setting to.
     */
    public setSetting(
        setting: keyof UserSettings,
        value: UserSettings[typeof setting]
    ): void {
        this.settings[setting] = value;
        if (setting === "musicOn") {
            if (value) {
                BGM.restoreMusic();
            } else {
                BGM.hideMusic();
            }
        }
    }

    public setSettings(settings: UserSettings) {
        this.settings = structuredClone(settings);
    }
}

/** User object holding name, settings data */
export const USER = new User();
