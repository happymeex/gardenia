import Phaser from "phaser";
import { DEFAULT_FADE_TIME, Sound, soundTracks } from "./utils/constants";
import { USER } from "./User";

/**
 * Sentinel object.
 */
class NullAudio {
    public play(): void {
        throw new Error("Audio is currently null");
    }
    public resume(): void {
        throw new Error("Audio is currently null");
    }
    public stop(): void {}
    public destroy(): void {}
    public setVolume(value: number): void {}
    public isPlaying: boolean = false;
    public key: string = "";
}

type Audio =
    | Phaser.Sound.NoAudioSound
    | Phaser.Sound.HTML5AudioSound
    | Phaser.Sound.WebAudioSound
    | NullAudio;

/**
 * Manages background music playback.
 */
export class BGMManager {
  private static instance: BGMManager;
  private audio: Audio = new NullAudio();
  private currMusic: Sound = Sound.SILENCE;

  private constructor() {}

  /**
   * Get the singleton instance of BGMManager.
   * @returns The BGMManager instance.
   */
  public static getInstance(): BGMManager {
    if (!BGMManager.instance) {
      BGMManager.instance = new BGMManager();
    }
    return BGMManager.instance;
  }

  /**
   * Play a background music track.
   * @param scene The current Phaser scene.
   * @param music The key indicating which soundtrack to play.
   * @param fromStart If false, attempting to play music that's already playing will not restart it.
   */
  public play(scene: Phaser.Scene, music: Sound, fromStart = true) {
    if (this.currMusic === music && !fromStart) {
      return;
    }

    this.audio.stop();
    this.audio.destroy();

    const soundData = soundTracks.get(music);
    if (soundData) {
      this.audio = scene.sound.add(music, soundData);
      this.audio.play();
      this.currMusic = music;
    } else {
      console.warn(`Music with key ${music} not found.`);
      this.currMusic = Sound.SILENCE;
    }
  }

  /**
   * Stop the currently playing background music.
   */
  public hideMusic() {
    this.audio.setVolume(0);
  }

  /**
   * Resume the currently paused background music.
   */
  public restoreMusic() {
    console.log("restoring music");
    const soundData = soundTracks.get(this.currMusic);
    if (soundData) {
      this.audio.setVolume(soundData.volume || 1);
    }
  }

  /**
   * Fade the currently playing audio to 0 volume.
   * @param scene The current Phaser scene.
   * @param duration How long the fadeout should take. Defaults to DEFAULT_FADE_TIME.
   */
  public fadeOut(scene: Phaser.Scene, duration = DEFAULT_FADE_TIME) {
    scene.tweens.add({
      targets: this.audio,
      volume: 0,
      duration: duration,
      onComplete: () => {
        this.audio.stop();
        this.audio.destroy();
        this.currMusic = Sound.SILENCE;
      },
    });
  }
}

export const BGM = BGMManager.getInstance();
