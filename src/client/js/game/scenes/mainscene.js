import Phaser from 'phaser';
import Player from '../Player';
import Enemy from '../Enemy';
import Item from '../Item';
import { DungeonMap, TILE } from '../DungeonMap';

const TILE_SIZE = 40;
const COLS = 20;
const ROWS = 15;
const MAX_MESSAGES = 5;

const C = {
  wall:        0x1a1a2e,
  wallShade:   0x0d0d1a,
  wallHighlight: 0x2a2a44,
  floor:       0x25253a,
  floorAlt:    0x2a2a40,
  stairs:      0xddaa00,
  stairsDark:  0x886600,
  player:      0x4488ff,
  playerGlow:  0x88aaff,
  uiBg:        0x0a0a16,
  hpFull:      0x22cc55,
  hpMid:       0xddaa00,
  hpLow:       0xcc2222,
  xpBar:       0x7733cc,
  msgBg:       0x080812,
};

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  init(data) {
    this.currentFloor = (data && data.floor) ? data.floor : 1;
  }

  create() {
    this.messages = [];
    this.dead = false;

    this.dungeon = new DungeonMap(COLS, ROWS, this.currentFloor);

    const { x, y } = this.dungeon.playerStart;
    this.player = new Player(x, y);

    // Pre-scale player for deeper floors
    for (let i = 1; i < this.currentFloor; i++) {
      this.player.gainXP(this.player.xpNeeded);
    }

    const enemyCount = 4 + this.currentFloor * 2;
    const enemySpawns = this.dungeon.getEnemySpawnPoints(enemyCount);
    this.enemies = enemySpawns.map(s => new Enemy(s.x, s.y, Enemy.randomType(this.currentFloor)));

    const itemSpawns = this.dungeon.getItemSpawnPoints(3 + this.currentFloor);
    this.items = itemSpawns.map(s => new Item(s.x, s.y, Item.randomType(this.currentFloor)));

    // Graphics layers (drawn in order)
    this.mapGfx    = this.add.graphics().setDepth(0);
    this.entityGfx = this.add.graphics().setDepth(1);
    this.uiGfx     = this.add.graphics().setDepth(2);

    // Persistent text objects (updated each frame, not recreated)
    this._statsText = this.add.text(10, 8, '', {
      fontSize: '13px',
      fill: '#ffffff',
      fontFamily: 'monospace',
      lineSpacing: 3,
    }).setDepth(3);

    this._msgText = this.add.text(10, 600 - 94, '', {
      fontSize: '13px',
      fill: '#aaccaa',
      fontFamily: 'monospace',
      lineSpacing: 4,
      wordWrap: { width: 780 },
    }).setDepth(3);

    this._floorText = this.add.text(800 - 10, 8, '', {
      fontSize: '13px',
      fill: '#aaaacc',
      fontFamily: 'monospace',
    }).setDepth(3).setOrigin(1, 0);

    this.input.keyboard.on('keydown', this._handleKey, this);

    this._addMsg(`Floor ${this.currentFloor} — Reach the stairs >`);
    this._addMsg('Move: Arrow keys / WASD');

    this._draw();
  }

  _addMsg(text) {
    this.messages.unshift(text);
    if (this.messages.length > MAX_MESSAGES) this.messages.length = MAX_MESSAGES;
  }

  _handleKey(event) {
    if (this.dead) return;

    const { KeyCodes } = Phaser.Input.Keyboard;
    const map = {
      [KeyCodes.UP]:    [0, -1],
      [KeyCodes.W]:     [0, -1],
      [KeyCodes.DOWN]:  [0,  1],
      [KeyCodes.S]:     [0,  1],
      [KeyCodes.LEFT]:  [-1, 0],
      [KeyCodes.A]:     [-1, 0],
      [KeyCodes.RIGHT]: [1,  0],
      [KeyCodes.D]:     [1,  0],
    };

    const dir = map[event.keyCode];
    if (!dir) return;
    this._tryMove(dir[0], dir[1]);
  }

  _tryMove(dx, dy) {
    const nx = this.player.x + dx;
    const ny = this.player.y + dy;

    if (!this.dungeon.isWalkable(nx, ny)) return;

    // Attack enemy at target cell
    const enemy = this.enemies.find(e => e.alive && e.x === nx && e.y === ny);
    if (enemy) {
      this._attackEnemy(enemy);
      this._enemyTurns();
      this._draw();
      return;
    }

    // Move player
    this.player.x = nx;
    this.player.y = ny;

    // Pick up item
    const item = this.items.find(i => !i.collected && i.x === nx && i.y === ny);
    if (item) {
      const result = item.use(this.player);
      this._addMsg(`${item.name}: ${result}`);
    }

    // Stairs?
    if (this.dungeon.tiles[ny][nx] === TILE.STAIRS) {
      this._addMsg(`Descending to floor ${this.currentFloor + 1}...`);
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
      const lvlMsg = leveled ? ` LEVEL UP → ${this.player.level}!` : '';
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
        // Move toward player
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
    const g = this.mapGfx;
    g.clear();

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = this.dungeon.tiles[row][col];
        const px = col * TILE_SIZE;
        const py = row * TILE_SIZE;

        if (tile === TILE.WALL) {
          g.fillStyle(C.wall);
          g.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          // Top/left edge highlight
          g.fillStyle(C.wallHighlight, 0.4);
          g.fillRect(px, py, TILE_SIZE, 2);
          g.fillRect(px, py, 2, TILE_SIZE);
          // Bottom/right shadow
          g.fillStyle(C.wallShade, 0.6);
          g.fillRect(px, py + TILE_SIZE - 2, TILE_SIZE, 2);
          g.fillRect(px + TILE_SIZE - 2, py, 2, TILE_SIZE);
        } else {
          // Checkerboard subtle variation
          const alt = (row + col) % 2 === 0;
          g.fillStyle(alt ? C.floor : C.floorAlt);
          g.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          if (tile === TILE.STAIRS) {
            // Downward stairs symbol (diamond)
            g.fillStyle(C.stairsDark);
            g.fillRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12);
            g.fillStyle(C.stairs);
            // Draw ">" stair symbol using triangles
            g.fillTriangle(
              px + 10, py + 10,
              px + TILE_SIZE - 10, py + TILE_SIZE / 2,
              px + 10, py + TILE_SIZE - 10
            );
            g.fillTriangle(
              px + TILE_SIZE / 2 - 2, py + 10,
              px + TILE_SIZE - 10, py + TILE_SIZE / 2,
              px + TILE_SIZE / 2 - 2, py + TILE_SIZE - 10
            );
          }
        }
      }
    }
  }

  _drawEntities() {
    const g = this.entityGfx;
    g.clear();

    // Items
    for (const item of this.items) {
      if (item.collected) continue;
      const cx = item.x * TILE_SIZE + TILE_SIZE / 2;
      const cy = item.y * TILE_SIZE + TILE_SIZE / 2;
      const r = TILE_SIZE / 4;
      g.fillStyle(item.color, 0.85);
      g.fillCircle(cx, cy, r);
      g.lineStyle(2, 0xffffff, 0.5);
      g.strokeCircle(cx, cy, r);
    }

    // Enemies
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const px = enemy.x * TILE_SIZE;
      const py = enemy.y * TILE_SIZE;
      const pad = 5;

      // Enemy body
      g.fillStyle(enemy.color);
      g.fillRect(px + pad, py + pad, TILE_SIZE - pad * 2, TILE_SIZE - pad * 2);
      g.lineStyle(1, 0x000000, 0.5);
      g.strokeRect(px + pad, py + pad, TILE_SIZE - pad * 2, TILE_SIZE - pad * 2);

      // HP bar
      const barW = TILE_SIZE - 4;
      const hpPct = enemy.hp / enemy.maxHp;
      g.fillStyle(0x550000);
      g.fillRect(px + 2, py - 7, barW, 5);
      g.fillStyle(hpPct > 0.5 ? 0x33cc55 : hpPct > 0.25 ? 0xddaa00 : 0xee2222);
      g.fillRect(px + 2, py - 7, Math.max(1, Math.floor(barW * hpPct)), 5);
    }

    // Player
    const p = this.player;
    const cx = p.x * TILE_SIZE + TILE_SIZE / 2;
    const cy = p.y * TILE_SIZE + TILE_SIZE / 2;

    // Glow ring
    g.fillStyle(C.playerGlow, 0.2);
    g.fillCircle(cx, cy, 18);

    // Body
    g.fillStyle(C.player);
    g.fillCircle(cx, cy, 13);
    g.lineStyle(2, C.playerGlow);
    g.strokeCircle(cx, cy, 13);

    // Center dot
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(cx, cy, 4);
  }

  _drawUI() {
    const g = this.uiGfx;
    g.clear();

    const p = this.player;

    // ── Stats panel (top-left) ──
    const statsW = 210;
    const statsH = 118;
    g.fillStyle(C.uiBg, 0.82);
    g.fillRoundedRect(4, 4, statsW, statsH, 6);
    g.lineStyle(1, 0x334466, 0.7);
    g.strokeRoundedRect(4, 4, statsW, statsH, 6);

    // HP bar
    const hpPct = p.hp / p.maxHp;
    const barW = statsW - 20;
    g.fillStyle(0x330000);
    g.fillRect(10, 34, barW, 10);
    const hpColor = hpPct > 0.5 ? C.hpFull : hpPct > 0.25 ? C.hpMid : C.hpLow;
    g.fillStyle(hpColor);
    g.fillRect(10, 34, Math.max(2, Math.floor(barW * hpPct)), 10);

    // XP bar
    const xpPct = p.xp / p.xpNeeded;
    g.fillStyle(0x220033);
    g.fillRect(10, 50, barW, 6);
    g.fillStyle(C.xpBar);
    g.fillRect(10, 50, Math.max(1, Math.floor(barW * xpPct)), 6);

    // ── Message log (bottom) ──
    const msgH = 98;
    const msgY = 600 - msgH;
    g.fillStyle(C.msgBg, 0.82);
    g.fillRoundedRect(4, msgY - 4, 792, msgH + 4, 6);
    g.lineStyle(1, 0x334466, 0.7);
    g.strokeRoundedRect(4, msgY - 4, 792, msgH + 4, 6);

    // ── Update text ──
    this._statsText.setText([
      `Lv.${p.level}  HP: ${p.hp}/${p.maxHp}`,
      ``,
      `XP: ${p.xp}/${p.xpNeeded}`,
      `ATK: ${p.atk}   DEF: ${p.def}   Gold: ${p.gold}`,
    ].join('\n'));

    this._floorText.setText(`Floor ${this.currentFloor}`);

    const msgLines = this.messages.slice(0, MAX_MESSAGES);
    msgLines[0] = `> ${msgLines[0]}`;
    for (let i = 1; i < msgLines.length; i++) {
      msgLines[i] = `  ${msgLines[i]}`;
    }
    this._msgText.setText(msgLines.join('\n'));
  }

  update() {
    // input is event-driven via keydown listener
  }
}
