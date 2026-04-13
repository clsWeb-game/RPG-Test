const ENEMY_DEFS = {
  goblin: {
    name: 'Goblin',
    hp: 18,
    atk: 7,
    def: 1,
    xp: 12,
    color: 0x33bb33,
    symbol: 'g',
  },
  orc: {
    name: 'Orc',
    hp: 38,
    atk: 13,
    def: 4,
    xp: 28,
    color: 0x228833,
    symbol: 'O',
  },
  troll: {
    name: 'Troll',
    hp: 65,
    atk: 17,
    def: 7,
    xp: 55,
    color: 0x1a6622,
    symbol: 'T',
  },
  skeleton: {
    name: 'Skeleton',
    hp: 25,
    atk: 10,
    def: 3,
    xp: 20,
    color: 0xccccaa,
    symbol: 'S',
  },
  boss: {
    name: 'Dragon',
    hp: 150,
    atk: 24,
    def: 10,
    xp: 200,
    color: 0xff4400,
    symbol: 'D',
  },
};

export default class Enemy {
  constructor(x, y, type = 'goblin') {
    const def = ENEMY_DEFS[type] || ENEMY_DEFS.goblin;
    this.x = x;
    this.y = y;
    this.type = type;
    this.name = def.name;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.atk = def.atk;
    this.def = def.def;
    this.xp = def.xp;
    this.color = def.color;
    this.symbol = def.symbol;
    this.alive = true;
  }

  takeDamage(amount) {
    const dmg = Math.max(1, amount - this.def);
    this.hp = Math.max(0, this.hp - dmg);
    if (this.hp === 0) this.alive = false;
    return dmg;
  }

  attackDamage() {
    return Math.max(1, this.atk + Math.floor(Math.random() * 5) - 2);
  }

  static randomType(floor) {
    const r = Math.random();
    if (floor >= 5 && r < 0.1) return 'boss';
    if (floor >= 4 && r < 0.25) return 'troll';
    if (floor >= 3 && r < 0.45) return 'skeleton';
    if (floor >= 2 && r < 0.55) return 'orc';
    return 'goblin';
  }
};

