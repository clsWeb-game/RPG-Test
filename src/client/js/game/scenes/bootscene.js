import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    // Brief title screen before starting
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a14);

    this.add.text(W / 2, H / 2 - 60, 'ROGUEFORGE', {
      fontSize: '56px',
      fill: '#4488ff',
      fontFamily: 'monospace',
      stroke: '#0022aa',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 + 10, 'A Dungeon Roguelike', {
      fontSize: '20px',
      fill: '#8899bb',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const hint = this.add.text(W / 2, H / 2 + 70, 'Press any key to begin', {
      fontSize: '16px',
      fill: '#556688',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Blinking hint
    this.tweens.add({
      targets: hint,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.once('keydown', () => this._start());
    this.input.on('pointerdown', () => this._start());

    // Auto-start after 4 seconds
    this.time.delayedCall(4000, () => this._start());
  }

  _start() {
    this.scene.start('MainScene', { floor: 1 });
  }
}
