export const TILE = {
  WALL: 0,
  FLOOR: 1,
  STAIRS: 2,
};

class Room {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  get centerX() { return this.x + Math.floor(this.w / 2); }
  get centerY() { return this.y + Math.floor(this.h / 2); }

  intersects(other, pad = 1) {
    return (
      this.x - pad <= other.x + other.w &&
      this.x + this.w + pad >= other.x &&
      this.y - pad <= other.y + other.h &&
      this.y + this.h + pad >= other.y
    );
  }
}

export class DungeonMap {
  constructor(cols, rows, floor = 1) {
    this.cols = cols;
    this.rows = rows;
    this.floor = floor;
    this.tiles = [];
    this.rooms = [];
    this.playerStart = null;
    this.stairsPos = null;
    this._generate();
  }

  _generate() {
    this.tiles = Array.from({ length: this.rows }, () =>
      new Array(this.cols).fill(TILE.WALL)
    );

    const maxRooms = 8 + Math.min(this.floor, 4);
    const minSize = 3;
    const maxSize = 6;

    for (let attempt = 0; attempt < 300 && this.rooms.length < maxRooms; attempt++) {
      const w = minSize + Math.floor(Math.random() * (maxSize - minSize + 1));
      const h = minSize + Math.floor(Math.random() * (maxSize - minSize + 1));
      const x = 1 + Math.floor(Math.random() * (this.cols - w - 2));
      const y = 1 + Math.floor(Math.random() * (this.rows - h - 2));
      const room = new Room(x, y, w, h);

      if (this.rooms.some(r => r.intersects(room))) continue;

      for (let ry = room.y; ry < room.y + room.h; ry++) {
        for (let rx = room.x; rx < room.x + room.w; rx++) {
          this.tiles[ry][rx] = TILE.FLOOR;
        }
      }

      if (this.rooms.length > 0) {
        const prev = this.rooms[this.rooms.length - 1];
        this._carveCorridor(prev.centerX, prev.centerY, room.centerX, room.centerY);
      }

      this.rooms.push(room);
    }

    if (this.rooms.length === 0) {
      // Fallback: create a single open room
      for (let ry = 1; ry < this.rows - 1; ry++) {
        for (let rx = 1; rx < this.cols - 1; rx++) {
          this.tiles[ry][rx] = TILE.FLOOR;
        }
      }
      this.rooms.push(new Room(1, 1, this.cols - 2, this.rows - 2));
    }

    this.playerStart = { x: this.rooms[0].centerX, y: this.rooms[0].centerY };

    const last = this.rooms[this.rooms.length - 1];
    this.stairsPos = { x: last.centerX, y: last.centerY };
    this.tiles[last.centerY][last.centerX] = TILE.STAIRS;
  }

  _carveCorridor(x1, y1, x2, y2) {
    let cx = x1;
    while (cx !== x2) {
      this.tiles[y1][cx] = TILE.FLOOR;
      cx += cx < x2 ? 1 : -1;
    }
    let cy = y1;
    while (cy !== y2) {
      this.tiles[cy][x2] = TILE.FLOOR;
      cy += cy < y2 ? 1 : -1;
    }
    this.tiles[y2][x2] = TILE.FLOOR;
  }

  isWalkable(x, y) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return false;
    return this.tiles[y][x] !== TILE.WALL;
  }

  getEnemySpawnPoints(count) {
    const points = [];
    for (let i = 1; i < this.rooms.length && points.length < count; i++) {
      const room = this.rooms[i];
      const num = 1 + Math.floor(Math.random() * 2);
      for (let n = 0; n < num && points.length < count; n++) {
        const x = room.x + 1 + Math.floor(Math.random() * Math.max(1, room.w - 2));
        const y = room.y + 1 + Math.floor(Math.random() * Math.max(1, room.h - 2));
        if (x === this.stairsPos.x && y === this.stairsPos.y) continue;
        if (points.some(p => p.x === x && p.y === y)) continue;
        points.push({ x, y });
      }
    }
    return points;
  }

  getItemSpawnPoints(count) {
    const points = [];
    for (let i = 1; i < this.rooms.length && points.length < count; i++) {
      if (Math.random() < 0.7) {
        const room = this.rooms[i];
        const x = room.x + Math.floor(Math.random() * room.w);
        const y = room.y + Math.floor(Math.random() * room.h);
        if (x === this.stairsPos.x && y === this.stairsPos.y) continue;
        if (points.some(p => p.x === x && p.y === y)) continue;
        points.push({ x, y });
      }
    }
    return points;
  }
}
