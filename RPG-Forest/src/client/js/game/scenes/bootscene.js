import Phaser from 'phaser';
// NOTE: keep these as static `new URL(<literal>, import.meta.url)` so Parcel rewrites
// them to fingerprinted asset URLs at build time.
const grassUrl = new URL('../../../assets/grass.png', import.meta.url).toString();
const walkUrl = new URL('../../../assets/walk.jpg', import.meta.url).toString();
const portalUrl = new URL('../../../assets/portal.jpg', import.meta.url).toString();
const pointUrl = new URL('../../../assets/point.jpg', import.meta.url).toString();
const poin1Url = new URL('../../../assets/poin1.jpg', import.meta.url).toString();
const megicalTileUrl = new URL('../../../assets/megical-tile.jpg', import.meta.url).toString();
const characterUrl = new URL('../../../assets/character.png', import.meta.url).toString();
const goblinUrl = new URL('../../../assets/goblin.png', import.meta.url).toString();
const orcUrl = new URL('../../../assets/orc.png', import.meta.url).toString();
const skeletonUrl = new URL('../../../assets/skeleton.png', import.meta.url).toString();
const dragonUrl = new URL('../../../assets/dragon.png', import.meta.url).toString();
const dragon2Url = new URL('../../../assets/dragon2.png', import.meta.url).toString();
const logoUrl = new URL('../../../assets/logo2.jpg', import.meta.url).toString();

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    const loadingText = this.add.text(W / 2, H / 2, 'Loading...', {
      fontSize: '28px',
      fill: '#44cc88',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      loadingText.setText(`Loading... ${Math.floor(value * 100)}%`);
    });
    this.load.on('complete', () => loadingText.destroy());

    // Use bundler-resolved URLs so Phaser always gets a valid URL string.
    // (Some assets are JPEGs, so extensions must match the on-disk files.)
    this.load.image('grass', grassUrl);
    this.load.image('walk', walkUrl);
    this.load.image('portal', portalUrl);
    this.load.image('point', pointUrl);
    this.load.image('poin1', poin1Url);
    this.load.image('megical-tile', megicalTileUrl);
    this.load.image('character', characterUrl);
    this.load.image('goblin', goblinUrl);
    this.load.image('orc', orcUrl);
    this.load.image('skeleton', skeletonUrl);
    this.load.image('dragon', dragonUrl);
    this.load.image('dragon2', dragon2Url);
    this.load.image('logo', logoUrl);
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x060e06);

    this.add.text(W / 2, H / 2 - 80, 'ENCHANTED FOREST', {
      fontSize: '48px',
      fill: '#33dd77',
      fontFamily: 'monospace',
      stroke: '#0a4422',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2, 'A Magical Roguelike', {
      fontSize: '20px',
      fill: '#66aa88',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const hint = this.add.text(W / 2, H / 2 + 60, 'Press any key to begin', {
      fontSize: '16px',
      fill: '#448866',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: hint,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.once('keydown', () => this._start());
    this.input.on('pointerdown', () => this._start());

    this.time.delayedCall(4000, () => this._start());
  }

  _start() {
    this.scene.start('MainScene', { floor: 1 });
  }
}
