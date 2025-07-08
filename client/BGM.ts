import Phaser from "phaser";
import { DEFAULT_FADE_TIME, Sound, soundTracks } from "./utils/constants";
import { USER } from "./User";

class NullAudio {
    public play() {
        throw new Error("Audio is currently null");
    }
    public resume() {
        throw new Error("Audio is currently null");
    }
    public stop() {}
    public destroy() {}
    public setVolume(value: number) {}
    public isPlaying = false;
    public key = "";
}

type Audio =
    | Phaser.Sound.NoAudioSound
    | Phaser.Sound.HTML5AudioSound
    | Phaser.Sound.WebAudioSound
    | NullAudio;

class BGMManager {
    private audio: Audio = new NullAudio();
    private currMusic: Sound = Sound.SILENCE;

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
            if (!USER.getSettings().musicOn) this.audio.setVolume(0);
            this.audio.play();
        } else {
            this.audio = new NullAudio();
        }
    }

    public hideMusic() {
        this.audio.setVolume(0);
    }

    public restoreMusic() {
        console.log("restoring music");
        const soundData = soundTracks.get(this.currMusic);
        if (soundData) {
            const volume = soundData.config.volume ?? 1;
            this.audio.setVolume(volume);
        }
    }

    public fadeOut(scene: Phaser.Scene, duration = DEFAULT_FADE_TIME) {
        scene.tweens.add({
            targets: this.audio,
            volume: 0,
            duration,
        });
    }
}

export const BGM = new BGMManager();
