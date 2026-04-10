const ITEM_DEFS = {
  potion: {
    name: 'Health Potion',
    color: 0xff4455,
    use(player) {
      const healed = player.heal(40);
      return `Healed ${healed} HP.`;
    },
  },
  bigPotion: {
    name: 'Elixir',
    color: 0xff88aa,
    use(player) {
      const healed = player.heal(player.maxHp);
      return `Fully restored! +${healed} HP.`;
    },
  },
  sword: {
    name: 'Iron Sword',
    color: 0xccccdd,
    use(player) {
      player.atk += 5;
      return `ATK +5 (now ${player.atk})`;
    },
  },
  shield: {
    name: 'Wooden Shield',
    color: 0xaa8844,
    use(player) {
      player.def += 3;
      return `DEF +3 (now ${player.def})`;
    },
  },
  gold: {
    name: 'Gold',
    color: 0xffdd00,
    use(player) {
      const amount = 10 + Math.floor(Math.random() * 20);
      player.gold += amount;
      return `Picked up ${amount} gold. (${player.gold} total)`;
    },
  },
};

export default class Item {
  constructor(x, y, type = 'potion') {
    const def = ITEM_DEFS[type] || ITEM_DEFS.potion;
    this.x = x;
    this.y = y;
    this.type = type;
    this.name = def.name;
    this.color = def.color;
    this.collected = false;
  }

  use(player) {
    this.collected = true;
    return ITEM_DEFS[this.type].use(player);
  }

  static randomType(floor) {
    const r = Math.random();
    if (r < 0.40) return 'potion';
    if (floor >= 3 && r < 0.50) return 'bigPotion';
    if (r < 0.65) return 'gold';
    if (r < 0.80) return 'sword';
    return 'shield';
  }
}
