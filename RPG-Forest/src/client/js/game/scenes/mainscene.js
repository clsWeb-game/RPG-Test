import Phaser from 'phaser';
import Player from '../Player';
import Enemy from '../Enemy';
import Item from '../Item';
import { DungeonMap, TILE } from '../DungeonMap';

const TILE_SIZE = 90;
const MAX_MESSAGES = 3;
const HUD_MARGIN = 12;
const STATUS_PANEL_W = 360;
const STATUS_PANEL_H = 80;
const GOLD_PANEL_W = 170;
const GOLD_PANEL_H = 52;
const UTIL_BTN_SIZE = 40;
const UTIL_BTN_GAP = 6;
const LEFT_RAIL_W = 56;
const LEFT_RAIL_H = 200;

export default class MainScene extends Phaser.Scene {
  constructor() { super({ key: 'MainScene' }); }
  init(data) { this.currentFloor = (data && data.floor) ? data.floor : 1; }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    this.COLS = Math.max(10, Math.floor(W / TILE_SIZE));
    this.ROWS = Math.max(8, Math.floor(H / TILE_SIZE));
    this.messages = [];
    this.dead = false;
    this.playerAngle = 0;

    this.add.image(W / 2, H / 2, 'bg').setDisplaySize(W, H).setDepth(-5).setScrollFactor(0);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.28).setDepth(-4).setScrollFactor(0);

    this.dungeon = new DungeonMap(this.COLS, this.ROWS, this.currentFloor);
    const { x, y } = this.dungeon.playerStart;
    this.player = new Player(x, y);
    for (let i = 1; i < this.currentFloor; i++) this.player.gainXP(this.player.xpNeeded);

    this.enemies = this.dungeon.getEnemySpawnPoints(4 + this.currentFloor * 2)
      .map((s) => new Enemy(s.x, s.y, Enemy.randomType(this.currentFloor)));
    this.items = this.dungeon.getItemSpawnPoints(3 + this.currentFloor)
      .map((s) => new Item(s.x, s.y, Item.randomType(this.currentFloor)));

    this._createTileImages();
    this._createEntityImages();
    this.uiGfx = this.add.graphics().setDepth(20);
    this._createHudTexts();

    this.input.keyboard.on('keydown', this._handleKey, this);
    this._addMsg(`Floor ${this.currentFloor} - Find the portal`);
    this._addMsg('Move: Arrow keys / WASD');
    this._draw();
  }

  _createTileImages() {
    this.tileImages = [];
    for (let y = 0; y < this.ROWS; y++) {
      this.tileImages[y] = [];
      for (let x = 0; x < this.COLS; x++) {
        this.tileImages[y][x] = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'grass')
          .setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(0);
      }
    }
  }

  _createEntityImages() {
    this.itemImages = this.items.map((i) => this.add.image(i.x * TILE_SIZE + TILE_SIZE / 2, i.y * TILE_SIZE + TILE_SIZE / 2, i.imageKey).setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(2));
    this.enemyImages = this.enemies.map((e) => this.add.image(e.x * TILE_SIZE + TILE_SIZE / 2, e.y * TILE_SIZE + TILE_SIZE / 2, e.imageKey).setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(3));
    this.hpBarGfx = this.add.graphics().setDepth(4);
    this.playerImage = this.add.image(this.player.x * TILE_SIZE + TILE_SIZE / 2, this.player.y * TILE_SIZE + TILE_SIZE / 2, 'character').setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(5);
  }

  _createHudTexts() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.statusTitle = this.add.text(HUD_MARGIN + 52, HUD_MARGIN + 6, '', { fontSize: '18px', fill: '#f4ddb0', fontFamily: 'monospace' }).setDepth(22);
    this.statusMeta = this.add.text(HUD_MARGIN + 52, HUD_MARGIN + 28, '', { fontSize: '13px', fill: '#d8d8c4', fontFamily: 'monospace' }).setDepth(22);

    const goldX = W - HUD_MARGIN - (UTIL_BTN_SIZE * 2) - UTIL_BTN_GAP - GOLD_PANEL_W;
    this.goldText = this.add.text(goldX + GOLD_PANEL_W - 10, HUD_MARGIN + 10, '', { fontSize: '24px', fill: '#f6d06b', fontFamily: 'monospace' }).setDepth(22).setOrigin(1, 0);
    this.floorText = this.add.text(goldX + GOLD_PANEL_W - 10, HUD_MARGIN + 36, '', { fontSize: '12px', fill: '#c9d9d2', fontFamily: 'monospace' }).setDepth(22).setOrigin(1, 0);

    this.msgText = this.add.text(HUD_MARGIN + 10, H - 47, '', {
      fontSize: '12px',
      fill: '#e3e7db',
      fontFamily: 'monospace',
      lineSpacing: 3,
      wordWrap: { width: Math.min(520, W - 28) - 20 },
    }).setDepth(22);

    this.railIcons = ['point', 'poin1', 'portal', 'megical-tile'].map((k, i) => this.add.image(34, 112 + i * 46, k).setDisplaySize(34, 34).setDepth(22));
    this.railValues = [0, 1, 2, 3].map((_, i) => this.add.text(56, 120 + i * 46, '', { fontSize: '12px', fill: '#f4ddb0', fontFamily: 'monospace' }).setDepth(22));
    this.utilLabelA = this.add.text(goldX + GOLD_PANEL_W + 13, HUD_MARGIN + 11, '?', { fontSize: '18px', fill: '#d8d8c4', fontFamily: 'monospace' }).setDepth(22);
    this.utilLabelB = this.add.text(goldX + GOLD_PANEL_W + UTIL_BTN_SIZE + UTIL_BTN_GAP + 11, HUD_MARGIN + 11, '||', { fontSize: '16px', fill: '#d8d8c4', fontFamily: 'monospace' }).setDepth(22);
  }

  _addMsg(text) { this.messages.unshift(text); if (this.messages.length > MAX_MESSAGES) this.messages.length = MAX_MESSAGES; }

  _handleKey(event) {
    if (this.dead) return;
    const { KeyCodes } = Phaser.Input.Keyboard;
    const map = {
      [KeyCodes.UP]: [0, -1, 180], [KeyCodes.W]: [0, -1, 180],
      [KeyCodes.DOWN]: [0, 1, 0], [KeyCodes.S]: [0, 1, 0],
      [KeyCodes.LEFT]: [-1, 0, 90], [KeyCodes.A]: [-1, 0, 90],
      [KeyCodes.RIGHT]: [1, 0, 270], [KeyCodes.D]: [1, 0, 270],
    };
    const d = map[event.keyCode]; if (!d) return;
    this.playerAngle = d[2];
    this._tryMove(d[0], d[1]);
  }

  _tryMove(dx, dy) {
    const nx = this.player.x + dx, ny = this.player.y + dy;
    if (!this.dungeon.isWalkable(nx, ny)) return;

    const enemy = this.enemies.find((e) => e.alive && e.x === nx && e.y === ny);
    if (enemy) { this._attackEnemy(enemy); this._enemyTurns(); this._draw(); return; }

    this.player.x = nx; this.player.y = ny;
    const item = this.items.find((i) => !i.collected && i.x === nx && i.y === ny);
    if (item) this._addMsg(`${item.name}: ${item.use(this.player)}`);

    if (this.dungeon.tiles[ny][nx] === TILE.STAIRS) {
      this._addMsg(`Entering portal to floor ${this.currentFloor + 1}...`);
      this._draw();
      this.input.keyboard.off('keydown', this._handleKey, this);
      this.time.delayedCall(700, () => this.scene.start('MainScene', { floor: this.currentFloor + 1 }));
      return;
    }
    this._enemyTurns(); this._draw();
  }

  _attackEnemy(enemy) {
    const dmg = enemy.takeDamage(this.player.attackDamage());
    if (!enemy.alive) { const lv = this.player.gainXP(enemy.xp) ? ` LEVEL UP -> ${this.player.level}!` : ''; this._addMsg(`Killed ${enemy.name}! +${enemy.xp} XP.${lv}`); }
    else this._addMsg(`Hit ${enemy.name} for ${dmg}. (HP: ${enemy.hp}/${enemy.maxHp})`);
  }

  _enemyTurns() {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const dx = this.player.x - enemy.x, dy = this.player.y - enemy.y, dist = Math.abs(dx) + Math.abs(dy);
      if (dist === 1) {
        const dmg = this.player.takeDamage(enemy.attackDamage());
        this._addMsg(`${enemy.name} hits you for ${dmg}!`);
        if (!this.player.isAlive()) {
          this.dead = true; this._addMsg('You have been slain...'); this._draw();
          this.time.delayedCall(1800, () => this.scene.start('GameOverScene', { won: false, floor: this.currentFloor, level: this.player.level, gold: this.player.gold }));
          return;
        }
      } else if (dist <= 10) {
        const mx = dx ? Math.sign(dx) : 0, my = dy ? Math.sign(dy) : 0;
        const can = (x, y) => this.dungeon.isWalkable(x, y) && !(this.player.x === x && this.player.y === y) && !this.enemies.some((e) => e.alive && e !== enemy && e.x === x && e.y === y);
        const oldX = enemy.x;
        const oldY = enemy.y;
        if (can(enemy.x + mx, enemy.y + my)) { enemy.x += mx; enemy.y += my; }
        else if (can(enemy.x + mx, enemy.y)) enemy.x += mx;
        else if (can(enemy.x, enemy.y + my)) enemy.y += my;

        const movedX = enemy.x - oldX;
        const movedY = enemy.y - oldY;
        if (movedY === 1) enemy.angle = 0;
        else if (movedY === -1) enemy.angle = 180;
        else if (movedX === -1) enemy.angle = 90;
        else if (movedX === 1) enemy.angle = 270;
      }
    }
  }

  _draw() { this._drawMap(); this._drawEntities(); this._drawUI(); }

  _drawMap() {
    for (let y = 0; y < this.ROWS; y++) for (let x = 0; x < this.COLS; x++) {
      const tile = this.dungeon.tiles[y][x];
      const img = this.tileImages[y][x];
      if (tile === TILE.WALL) img.setTexture('grass').setAlpha(0.88);
      else if (tile === TILE.STAIRS) img.setTexture('portal').setAlpha(0.95);
      else img.setTexture(this.dungeon.floorVariant[y][x]).setAlpha(0.95);
    }
  }

  _drawEntities() {
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i], img = this.itemImages[i];
      if (item.collected) img.setVisible(false);
      else img.setVisible(true).setPosition(item.x * TILE_SIZE + TILE_SIZE / 2, item.y * TILE_SIZE + TILE_SIZE / 2).setTexture(item.imageKey);
    }
    this.hpBarGfx.clear();
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i], img = this.enemyImages[i];
      if (!e.alive) { img.setVisible(false); continue; }
      img.setVisible(true).setPosition(e.x * TILE_SIZE + TILE_SIZE / 2, e.y * TILE_SIZE + TILE_SIZE / 2).setTexture(e.imageKey).setAngle(e.angle || 0);
      const px = e.x * TILE_SIZE, py = e.y * TILE_SIZE, hpPct = e.hp / e.maxHp, barW = TILE_SIZE - 4;
      this.hpBarGfx.fillStyle(0x330000, 0.8).fillRect(px + 2, py - 6, barW, 5);
      this.hpBarGfx.fillStyle(hpPct > 0.5 ? 0x33cc55 : hpPct > 0.25 ? 0xddaa00 : 0xee2222, 0.9).fillRect(px + 2, py - 6, Math.max(1, Math.floor(barW * hpPct)), 5);
    }
    this.playerImage.setPosition(this.player.x * TILE_SIZE + TILE_SIZE / 2, this.player.y * TILE_SIZE + TILE_SIZE / 2).setAngle(this.playerAngle);
  }

  _drawUI() {
    const g = this.uiGfx, p = this.player, W = this.cameras.main.width, H = this.cameras.main.height;
    g.clear();
    g.fillStyle(0x0d1117, 0.78).fillRoundedRect(HUD_MARGIN, HUD_MARGIN, STATUS_PANEL_W, STATUS_PANEL_H, 8);
    g.lineStyle(2, 0x4b5a68, 0.9).strokeRoundedRect(HUD_MARGIN, HUD_MARGIN, STATUS_PANEL_W, STATUS_PANEL_H, 8);
    const hpPct = p.hp / p.maxHp;
    const hpBarX = HUD_MARGIN + 110;
    const hpBarY = HUD_MARGIN + 38;
    const hpBarW = STATUS_PANEL_W - 125;
    g.fillStyle(0x3d1010, 0.92).fillRect(hpBarX, hpBarY, hpBarW, 11);
    g.fillStyle(hpPct > 0.5 ? 0x32d25f : hpPct > 0.25 ? 0xd9b343 : 0xd74d43, 0.96).fillRect(hpBarX, hpBarY, Math.max(2, Math.floor(hpBarW * hpPct)), 11);
    const xpPct = p.xp / p.xpNeeded;
    g.fillStyle(0x1a232a, 0.92).fillRect(hpBarX, hpBarY + 15, hpBarW, 6);
    g.fillStyle(0x5db5d8, 0.96).fillRect(hpBarX, hpBarY + 15, Math.max(1, Math.floor(hpBarW * xpPct)), 6);

    const railX = HUD_MARGIN;
    const railY = HUD_MARGIN + STATUS_PANEL_H + 8;
    g.fillStyle(0x0d1117, 0.72).fillRoundedRect(railX, railY, LEFT_RAIL_W, LEFT_RAIL_H, 8);
    g.lineStyle(1, 0x4b5a68, 0.9).strokeRoundedRect(railX, railY, LEFT_RAIL_W, LEFT_RAIL_H, 8);

    for (let i = 0; i < this.railIcons.length; i++) {
      const slotY = railY + 4 + i * 46;
      g.fillStyle(0x1a232a, 0.9).fillRoundedRect(railX + 4, slotY, 48, 42, 6);
      this.railIcons[i].setPosition(railX + 24, slotY + 21);
      this.railValues[i].setPosition(railX + 46, slotY + 12);
    }

    const goldX = W - HUD_MARGIN - (UTIL_BTN_SIZE * 2) - UTIL_BTN_GAP - GOLD_PANEL_W;
    g.fillStyle(0x0d1117, 0.8).fillRoundedRect(goldX, HUD_MARGIN, GOLD_PANEL_W, GOLD_PANEL_H, 8);
    g.lineStyle(2, 0x4b5a68, 0.9).strokeRoundedRect(goldX, HUD_MARGIN, GOLD_PANEL_W, GOLD_PANEL_H, 8);
    g.fillStyle(0x0d1117, 0.8)
      .fillRoundedRect(goldX + GOLD_PANEL_W + UTIL_BTN_GAP, HUD_MARGIN, UTIL_BTN_SIZE, UTIL_BTN_SIZE, 6)
      .fillRoundedRect(goldX + GOLD_PANEL_W + UTIL_BTN_GAP + UTIL_BTN_SIZE + UTIL_BTN_GAP, HUD_MARGIN, UTIL_BTN_SIZE, UTIL_BTN_SIZE, 6);
    g.lineStyle(2, 0x4b5a68, 0.9)
      .strokeRoundedRect(goldX + GOLD_PANEL_W + UTIL_BTN_GAP, HUD_MARGIN, UTIL_BTN_SIZE, UTIL_BTN_SIZE, 6)
      .strokeRoundedRect(goldX + GOLD_PANEL_W + UTIL_BTN_GAP + UTIL_BTN_SIZE + UTIL_BTN_GAP, HUD_MARGIN, UTIL_BTN_SIZE, UTIL_BTN_SIZE, 6);

    const msgY = H - 66;
    g.fillStyle(0x0d1117, 0.75).fillRoundedRect(HUD_MARGIN, msgY, Math.min(520, W - 28), 54, 8);
    g.lineStyle(1, 0x4b5a68, 0.85).strokeRoundedRect(HUD_MARGIN, msgY, Math.min(520, W - 28), 54, 8);

    this.statusTitle.setText(`Lv.${p.level}`);
    this.statusMeta.setText(`HP ${p.hp}/${p.maxHp}   XP ${p.xp}/${p.xpNeeded}`);
    this.goldText.setText(`${p.gold}`);
    this.floorText.setText(`Floor ${this.currentFloor}`);
    [Math.max(0, Math.floor(p.hp / 10)), p.gold, this.currentFloor, p.level].forEach((v, i) => this.railValues[i].setText(String(v)));

    const lines = this.messages.slice(0, MAX_MESSAGES);
    if (lines.length > 0) lines[0] = `> ${lines[0]}`;
    for (let i = 1; i < lines.length; i++) lines[i] = `  ${lines[i]}`;
    this.msgText.setPosition(HUD_MARGIN + 10, msgY + 8).setText(lines.join('\n'));
  }

  update() {}
}
