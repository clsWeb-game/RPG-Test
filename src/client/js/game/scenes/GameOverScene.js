import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.won   = data ? !!data.won   : false;
    this.floor = data ? (data.floor || 1) : 1;
    this.level = data ? (data.level || 1) : 1;
    this.gold  = data ? (data.gold  || 0) : 0;
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Dark overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88);

    const title = this.won ? 'VICTORY!' : 'GAME OVER';
    const titleColor = this.won ? '#ffdd44' : '#ff4444';

    this.add.text(W / 2, H / 2 - 110, title, {
      fontSize: '52px',
      fill: titleColor,
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    const sub = this.won
      ? 'You conquered the dungeon!'
      : 'The dungeon has claimed another soul.';

    this.add.text(W / 2, H / 2 - 55, sub, {
      fontSize: '18px',
      fill: '#aaaacc',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 + 0, [
      `Floor Reached : ${this.floor}`,
      `Hero Level    : ${this.level}`,
      `Gold Collected: ${this.gold}`,
    ].join('\n'), {
      fontSize: '20px',
      fill: '#ffffff',
      fontFamily: 'monospace',
      lineSpacing: 10,
      align: 'left',
    }).setOrigin(0.5);

    const btn = this.add.text(W / 2, H / 2 + 110, '[ PLAY AGAIN ]', {
      fontSize: '26px',
      fill: '#88ddff',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ fill: '#ffffff' }));
    btn.on('pointerout',  () => btn.setStyle({ fill: '#88ddff' }));
    btn.on('pointerdown', () => this._restart());

    this.input.keyboard.once('keydown-ENTER', () => this._restart());
    this.input.keyboard.once('keydown-SPACE', () => this._restart());

    this.add.text(W / 2, H / 2 + 148, 'or press Enter / Space', {
      fontSize: '14px',
      fill: '#555577',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  _restart() {
    this.scene.start('MainScene', { floor: 1 });
  }
}
