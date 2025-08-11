// Rozbudowana gra z zapaśnikami

// Konfiguracja planszy (proceduralna)
const BOARD_ROWS = 8 + Math.floor(Math.random() * 3); // 8-10 wierszy
const BOARD_COLS = 8 + Math.floor(Math.random() * 3); // 8-10 kolumn

const MAX_PLAYERS = 3; // Ilość graczy (1 gracz + 2 AI)

const CELL_TYPES = {
  NORMAL: 'normal',
  TRAP: 'trap',
  BONUS: 'bonus',
  OBSTACLE: 'obstacle',
};

const ITEMS = {
  bandage: {
    name: "Bandaż",
    desc: "Przywraca 2 punkty życia.",
    use: (player, game) => {
      player.hp = Math.min(player.maxHp, player.hp + 2);
      game.log(`Gracz ${player.name} używa Bandażu i odzyskuje 2 HP.`);
    }
  },
  gloves: {
    name: "Rękawice",
    desc: "Zwiększają siłę ataku o 1 przez 3 tury.",
    use: (player, game) => {
      player.tempAttackBuff = 3;
      game.log(`Gracz ${player.name} zakłada Rękawice. Atak +1 na 3 tury.`);
    }
  },
  boots: {
    name: "Buty",
    desc: "Zwiększają zasięg ruchu o
