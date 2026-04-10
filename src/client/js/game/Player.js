export default class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hp = 100;
    this.maxHp = 100;
    this.atk = 12;
    this.def = 4;
    this.level = 1;
    this.xp = 0;
    this.xpNeeded = 50;
    this.gold = 0;
  }

  takeDamage(amount) {
    const dmg = Math.max(1, amount - this.def);
    this.hp = Math.max(0, this.hp - dmg);
    return dmg;
  }

  heal(amount) {
    const prev = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - prev;
  }

  attackDamage() {
    return Math.max(1, this.atk + Math.floor(Math.random() * 6) - 2);
  }

  gainXP(amount) {
    this.xp += amount;
    if (this.xp >= this.xpNeeded) {
      this._levelUp();
      return true;
    }
    return false;
  }

  _levelUp() {
    this.xp -= this.xpNeeded;
    this.level += 1;
    this.xpNeeded = Math.floor(this.xpNeeded * 1.6);
    this.maxHp += 20;
    this.hp = this.maxHp;
    this.atk += 3;
    this.def += 2;
  }

  isAlive() {
    return this.hp > 0;
  }
}
