import Phaser from 'phaser';

import grassImg from '../../../assets/grass.png';
import walkImg from '../../../assets/walk.png';
import portalImg from '../../../assets/portal.png';
import pointImg from '../../../assets/point.png';
import poin1Img from '../../../assets/poin1.png';
import megicalImg from '../../../assets/megical-tile.png';
import characterImg from '../../../assets/character.png';
import goblinImg from '../../../assets/goblin.png';
import orcImg from '../../../assets/orc.png';
import skeletonImg from '../../../assets/skeleton.png';
import dragonImg from '../../../assets/dragon.png';
import dragon2Img from '../../../assets/dragon2.png';
import logoImg from '../../../assets/logo2.png';

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

    this.load.image('grass', grassImg);
    this.load.image('walk', walkImg);
    this.load.image('portal', portalImg);
    this.load.image('point', pointImg);
    this.load.image('poin1', poin1Img);
    this.load.image('megical-tile', megicalImg);
    this.load.image('character', characterImg);
    this.load.image('goblin', goblinImg);
    this.load.image('orc', orcImg);
    this.load.image('skeleton', skeletonImg);
    this.load.image('dragon', dragonImg);
    this.load.image('dragon2', dragon2Img);
    this.load.image('logo', logoImg);
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
