import Phaser from 'phaser';
import Player from '../Player';
import Enemy from '../Enemy';
import Item from '../Item';
import { DungeonMap, TILE } from '../DungeonMap';

const TILE_SIZE = 48;
const MAX_MESSAGES = 5;
const UI_BAR_HEIGHT = 100;

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  init(data) {
    this.currentFloor = (data && data.floor) ? data.floor : 1;
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.COLS = Math.floor(W / TILE_SIZE);
    this.ROWS = Math.floor((H - UI_BAR_HEIGHT) / TILE_SIZE);
    if (this.COLS < 10) this.COLS = 10;
    if (this.ROWS < 8) this.ROWS = 8;

    this.messages = [];
    this.dead = false;
    this.playerAngle = 0;

    this.dungeon = new DungeonMap(this.COLS, this.ROWS, this.currentFloor);

    const { x, y } = this.dungeon.playerStart;
    this.player = new Player(x, y);

    for (let i = 1; i < this.currentFloor; i++) {
      this.player.gainXP(this.player.xpNeeded);
    }

    const enemyCount = 4 + this.currentFloor * 2;
    const enemySpawns = this.dungeon.getEnemySpawnPoints(enemyCount);
    this.enemies = enemySpawns.map(s => new Enemy(s.x, s.y, Enemy.randomType(this.currentFloor)));

    const itemSpawns = this.dungeon.getItemSpawnPoints(3 + this.currentFloor);
    this.items = itemSpawns.map(s => new Item(s.x, s.y, Item.randomType(this.currentFloor)));

    this._createTileImages();
    this._createEntityImages();

    this.uiGfx = this.add.graphics().setDepth(10);

    this._statsText = this.add.text(10, this.ROWS * TILE_SIZE + 8, '', {
      fontSize: '14px',
      fill: '#ccffcc',
      fontFamily: 'monospace',
      lineSpacing: 3,
    }).setDepth(11);

    this._msgText = this.add.text(10, H - 80, '', {
      fontSize: '13px',
      fill: '#aaddaa',
      fontFamily: 'monospace',
      lineSpacing: 4,
      wordWrap: { width: W - 20 },
    }).setDepth(11);

    this._floorText = this.add.text(W - 10, this.ROWS * TILE_SIZE + 8, '', {
      fontSize: '14px',
      fill: '#88ccaa',
      fontFamily: 'monospace',
    }).setDepth(11).setOrigin(1, 0);

    this.input.keyboard.on('keydown', this._handleKey, this);

    this._addMsg(`Floor ${this.currentFloor} — Find the portal`);
    this._addMsg('Move: Arrow keys / WASD');

    this._draw();
  }

  _createTileImages() {
    this.tileImages = [];
    for (let row = 0; row < this.ROWS; row++) {
      this.tileImages[row] = [];
      for (let col = 0; col < this.COLS; col++) {
        const img = this.add.image(
          col * TILE_SIZE + TILE_SIZE / 2,
          row * TILE_SIZE + TILE_SIZE / 2,
          'grass'
        ).setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(0);
        this.tileImages[row][col] = img;
      }
    }
  }

  _createEntityImages() {
    this.itemImages = this.items.map(item => {
      const img = this.add.image(
        item.x * TILE_SIZE + TILE_SIZE / 2,
        item.y * TILE_SIZE + TILE_SIZE / 2,
        item.imageKey
      ).setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(2);
      return img;
    });

    this.enemyImages = this.enemies.map(enemy => {
      const img = this.add.image(
        enemy.x * TILE_SIZE + TILE_SIZE / 2,
        enemy.y * TILE_SIZE + TILE_SIZE / 2,
        enemy.imageKey
      ).setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(3);
      return img;
    });

    this.hpBarGfx = this.add.graphics().setDepth(4);

    this.playerImage = this.add.image(
      this.player.x * TILE_SIZE + TILE_SIZE / 2,
      this.player.y * TILE_SIZE + TILE_SIZE / 2,
      'character'
    ).setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(5);
  }

  _addMsg(text) {
    this.messages.unshift(text);
    if (this.messages.length > MAX_MESSAGES) this.messages.length = MAX_MESSAGES;
  }

  _handleKey(event) {
    if (this.dead) return;

    const { KeyCodes } = Phaser.Input.Keyboard;
    const dirMap = {
      [KeyCodes.UP]:    { dx: 0, dy: -1, angle: 180 },
      [KeyCodes.W]:     { dx: 0, dy: -1, angle: 180 },
      [KeyCodes.DOWN]:  { dx: 0, dy:  1, angle: 0 },
      [KeyCodes.S]:     { dx: 0, dy:  1, angle: 0 },
      [KeyCodes.LEFT]:  { dx: -1, dy: 0, angle: 90 },
      [KeyCodes.A]:     { dx: -1, dy: 0, angle: 90 },
      [KeyCodes.RIGHT]: { dx: 1, dy: 0, angle: 270 },
      [KeyCodes.D]:     { dx: 1, dy: 0, angle: 270 },
    };

    const dir = dirMap[event.keyCode];
    if (!dir) return;
    this.playerAngle = dir.angle;
    this._tryMove(dir.dx, dir.dy);
  }

  _tryMove(dx, dy) {
    const nx = this.player.x + dx;
    const ny = this.player.y + dy;

    if (!this.dungeon.isWalkable(nx, ny)) return;

    const enemy = this.enemies.find(e => e.alive && e.x === nx && e.y === ny);
    if (enemy) {
      this._attackEnemy(enemy);
      this._enemyTurns();
      this._draw();
      return;
    }

    this.player.x = nx;
    this.player.y = ny;

    const item = this.items.find(i => !i.collected && i.x === nx && i.y === ny);
    if (item) {
      const result = item.use(this.player);
      this._addMsg(`${item.name}: ${result}`);
    }

    if (this.dungeon.tiles[ny][nx] === TILE.STAIRS) {
      this._addMsg(`Entering portal to floor ${this.currentFloor + 1}...`);
      this._draw();
      this.input.keyboard.off('keydown', this._handleKey, this);
      this.time.delayedCall(700, () => {
        this.scene.start('MainScene', { floor: this.currentFloor + 1 });
      });
      return;
    }

    this._enemyTurns();
    this._draw();
  }

  _attackEnemy(enemy) {
    const dmg = enemy.takeDamage(this.player.attackDamage());
    if (!enemy.alive) {
      const leveled = this.player.gainXP(enemy.xp);
      const lvlMsg = leveled ? ` LEVEL UP \u2192 ${this.player.level}!` : '';
      this._addMsg(`Killed ${enemy.name}! +${enemy.xp} XP.${lvlMsg}`);
    } else {
      this._addMsg(`Hit ${enemy.name} for ${dmg}. (HP: ${enemy.hp}/${enemy.maxHp})`);
    }
  }

  _enemyTurns() {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.abs(dx) + Math.abs(dy);

      if (dist === 1) {
        const dmg = this.player.takeDamage(enemy.attackDamage());
        this._addMsg(`${enemy.name} hits you for ${dmg}!`);

        if (!this.player.isAlive()) {
          this.dead = true;
          this._addMsg('You have been slain...');
          this._draw();
          this.time.delayedCall(1800, () => {
            this.scene.start('GameOverScene', {
              won: false,
              floor: this.currentFloor,
              level: this.player.level,
              gold: this.player.gold,
            });
          });
          return;
        }
      } else if (dist <= 10) {
        const mx = dx !== 0 ? Math.sign(dx) : 0;
        const my = dy !== 0 ? Math.sign(dy) : 0;

        const canStep = (ex, ey) => {
          if (!this.dungeon.isWalkable(ex, ey)) return false;
          if (this.player.x === ex && this.player.y === ey) return false;
          if (this.enemies.some(e => e.alive && e !== enemy && e.x === ex && e.y === ey)) return false;
          return true;
        };

        if (canStep(enemy.x + mx, enemy.y + my)) {
          enemy.x += mx;
          enemy.y += my;
        } else if (canStep(enemy.x + mx, enemy.y)) {
          enemy.x += mx;
        } else if (canStep(enemy.x, enemy.y + my)) {
          enemy.y += my;
        }
      }
    }
  }

  _draw() {
    this._drawMap();
    this._drawEntities();
    this._drawUI();
  }

  _drawMap() {
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        const tile = this.dungeon.tiles[row][col];
        const img = this.tileImages[row][col];

        if (tile === TILE.WALL) {
          img.setTexture('grass');
        } else if (tile === TILE.STAIRS) {
          img.setTexture('portal');
        } else {
          img.setTexture(this.dungeon.floorVariant[row][col]);
        }
      }
    }
  }

  _drawEntities() {
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const img = this.itemImages[i];
      if (item.collected) {
        img.setVisible(false);
      } else {
        img.setVisible(true);
        img.setPosition(
          item.x * TILE_SIZE + TILE_SIZE / 2,
          item.y * TILE_SIZE + TILE_SIZE / 2
        );
        img.setTexture(item.imageKey);
      }
    }

    this.hpBarGfx.clear();

    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      const img = this.enemyImages[i];
      if (!enemy.alive) {
        img.setVisible(false);
      } else {
        img.setVisible(true);
        img.setPosition(
          enemy.x * TILE_SIZE + TILE_SIZE / 2,
          enemy.y * TILE_SIZE + TILE_SIZE / 2
        );
        img.setTexture(enemy.imageKey);

        const px = enemy.x * TILE_SIZE;
        const py = enemy.y * TILE_SIZE;
        const barW = TILE_SIZE - 4;
        const hpPct = enemy.hp / enemy.maxHp;
        this.hpBarGfx.fillStyle(0x330000, 0.8);
        this.hpBarGfx.fillRect(px + 2, py - 6, barW, 5);
        const hpColor = hpPct > 0.5 ? 0x33cc55 : hpPct > 0.25 ? 0xddaa00 : 0xee2222;
        this.hpBarGfx.fillStyle(hpColor, 0.9);
        this.hpBarGfx.fillRect(px + 2, py - 6, Math.max(1, Math.floor(barW * hpPct)), 5);
      }
    }

    this.playerImage.setPosition(
      this.player.x * TILE_SIZE + TILE_SIZE / 2,
      this.player.y * TILE_SIZE + TILE_SIZE / 2
    );
    this.playerImage.setAngle(this.playerAngle);
  }

  _drawUI() {
    const g = this.uiGfx;
    g.clear();

    const p = this.player;
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const uiY = this.ROWS * TILE_SIZE;

    g.fillStyle(0x0a140a, 0.92);
    g.fillRect(0, uiY, W, H - uiY);
    g.lineStyle(1, 0x2a5a2a, 0.8);
    g.strokeRect(0, uiY, W, 1);

    const statsW = 240;
    g.fillStyle(0x0d1a0d, 0.85);
    g.fillRoundedRect(4, uiY + 4, statsW, 90, 6);
    g.lineStyle(1, 0x2a5a2a, 0.7);
    g.strokeRoundedRect(4, uiY + 4, statsW, 90, 6);

    const hpPct = p.hp / p.maxHp;
    const barW = statsW - 20;
    g.fillStyle(0x1a0000);
    g.fillRect(10, uiY + 32, barW, 10);
    const hpColor = hpPct > 0.5 ? 0x22cc55 : hpPct > 0.25 ? 0xddaa00 : 0xcc2222;
    g.fillStyle(hpColor);
    g.fillRect(10, uiY + 32, Math.max(2, Math.floor(barW * hpPct)), 10);

    const xpPct = p.xp / p.xpNeeded;
    g.fillStyle(0x001a1a);
    g.fillRect(10, uiY + 48, barW, 6);
    g.fillStyle(0x22aaaa);
    g.fillRect(10, uiY + 48, Math.max(1, Math.floor(barW * xpPct)), 6);

    const msgH = 70;
    const msgY = H - msgH;
    g.fillStyle(0x0a140a, 0.85);
    g.fillRoundedRect(4, msgY - 4, W - 8, msgH + 4, 6);
    g.lineStyle(1, 0x2a5a2a, 0.7);
    g.strokeRoundedRect(4, msgY - 4, W - 8, msgH + 4, 6);

    this._statsText.setPosition(10, uiY + 8);
    this._statsText.setText([
      `Lv.${p.level}  HP: ${p.hp}/${p.maxHp}`,
      ``,
      `XP: ${p.xp}/${p.xpNeeded}`,
      `ATK: ${p.atk}   DEF: ${p.def}   Gold: ${p.gold}`,
    ].join('\n'));

    this._floorText.setPosition(W - 10, uiY + 8);
    this._floorText.setText(`Floor ${this.currentFloor}`);

    this._msgText.setPosition(10, msgY);
    const msgLines = this.messages.slice(0, MAX_MESSAGES);
    if (msgLines.length > 0) {
      msgLines[0] = `> ${msgLines[0]}`;
      for (let i = 1; i < msgLines.length; i++) {
        msgLines[i] = `  ${msgLines[i]}`;
      }
    }
    this._msgText.setText(msgLines.join('\n'));
  }

  update() {
    // input is event-driven via keydown listener
  }
}
