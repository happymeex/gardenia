import Phaser from "phaser";
import { DEFAULT_FADE_TIME, Sound, soundTracks } from "./constants";

/**
 * Sentinel object.
 */
class NullAudio {
    public play() {
        throw new Error("Audio is currently null");
    }
    public resume() {
        throw new Error("Audio is currently null");
    }
    public stop() {}
    public destroy() {}
    public fadeOut(duration: number) {}
    public isPlaying = false;
    public key = "";
}

type Audio =
    | Phaser.Sound.NoAudioSound
    | Phaser.Sound.HTML5AudioSound
    | Phaser.Sound.WebAudioSound
    | NullAudio;

/**
 * An object of this class manages the background music for all scenes in the game.
 */
class BGMManager {
    /** This audio object interfaces with Phaser's audio APIs. */
    private audio: Audio = new NullAudio();
    private currMusic: Sound = Sound.SILENCE;

    /**
     * Stops and destroys music that may currently be playing
     * and starts playing the music specific by `music`.
     *
     * If the music isn't found, plays nothing.
     * If `music` is currently being played, calling this method will
     * restart it, unless `fromStart` is set to false.
     *
     * @param scene current scene
     * @param music key indicating which soundtrack to play
     * @param fromStart if false, then attempting to play music that's already
     *      playing will do nothing. Otherwise, music will always play from the beginning.
     */
    public play(scene: Phaser.Scene, music: Sound, fromStart = true): void {
        if (!fromStart && this.currMusic === music) {
            return;
        }
        this.currMusic = music;
        this.audio.stop();
        this.audio.destroy();
        const soundData = soundTracks.get(music);
        if (soundData) {
            this.audio = scene.sound.add(soundData.key, soundData.config);
            this.audio.play();
        } else {
            this.audio = new NullAudio();
        }
    }

    /**
     * Fades the currently playing audio to 0 volume.
     *
     * @param scene
     * @param duration how long the fadeout should take. By default, it's `DEFAULT_FADE_TIME`.
     */
    public fadeOut(scene: Phaser.Scene, duration = DEFAULT_FADE_TIME) {
        scene.tweens.add({
            targets: this.audio,
            volume: 0,
            duration,
        });
    }
}

export const BGM = new BGMManager();