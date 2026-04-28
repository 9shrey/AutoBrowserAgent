import type { Frame, Thought, ActionResult, SessionData } from "../../shared/types.js";

export class ReplayController {
  private session: SessionData;
  private currentStep: number = 1;
  private playing: boolean = false;
  private playInterval: ReturnType<typeof setInterval> | null = null;
  private speed: number = 1; // seconds between steps
  private onStepChange?: (step: number) => void;

  constructor(session: SessionData) {
    this.session = session;
  }

  get totalSteps(): number {
    return this.session.manifest.totalSteps;
  }

  get step(): number {
    return this.currentStep;
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  getCurrentFrame(): Frame | undefined {
    return this.session.frames.find((f) => f.step === this.currentStep);
  }

  getCurrentThought(): Thought | undefined {
    return this.session.thoughts.find((t) => t.step === this.currentStep);
  }

  getCurrentAction(): ActionResult | undefined {
    return this.session.actions.find((a) => a.step === this.currentStep);
  }

  subscribe(onChange: (step: number) => void): void {
    this.onStepChange = onChange;
  }

  seek(step: number): void {
    this.currentStep = Math.max(1, Math.min(step, this.totalSteps));
    this.onStepChange?.(this.currentStep);
  }

  play(): void {
    if (this.playing) return;
    this.playing = true;
    this.playInterval = setInterval(() => {
      if (this.currentStep < this.totalSteps) {
        this.seek(this.currentStep + 1);
      } else {
        this.pause();
      }
    }, this.speed * 1000);
  }

  pause(): void {
    this.playing = false;
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
  }

  setSpeed(speedMs: number): void {
    this.speed = speedMs;
    if (this.playing) {
      this.pause();
      this.play();
    }
  }

  stepForward(): void {
    this.seek(this.currentStep + 1);
  }

  stepBackward(): void {
    this.seek(this.currentStep - 1);
  }

  goToStart(): void {
    this.seek(1);
  }

  goToEnd(): void {
    this.seek(this.totalSteps);
  }

  destroy(): void {
    this.pause();
    this.onStepChange = undefined;
  }
}
