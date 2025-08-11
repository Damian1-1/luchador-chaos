'use strict';

const BOARD_SIZE = 7;
const MAX_HAND = 3;
const TURN_TIME_LIMIT = 30; // sec

// -- Dane zawodników
const players = [
  {
    id: 'Z1',
    name: 'El Toro',
    hp: 25,
    maxHp: 25,
    pos: { x: 0, y: 0 },
    finisher: 'Toro Smash',
    shield: 0,
    speedBonus: 0,
    alive: true,
  },
  {
    id: 'Z2',
    name: 'La Serpiente',
    hp: 22,
    maxHp: 22,
    pos: { x: 6, y: 0 },
    finisher: 'Serpent’s Bite',
    shield: 0,
    speedBonus: 0,
    alive: true,
  },
  {
    id: 'Z3',
    name: 'El Águila',
    hp: 20,
    maxHp: 20,
    pos: { x: 0, y: 6 },
    finisher: 'Eagle Dive',
    shield: 0,
    speedBonus: 0,
    alive: true,
  },
  {
    id: 'Z4',
    name: 'La Llama',
    hp: 18,
    maxHp: 18,
    pos: { x: 6, y: 6 },
    finisher: 'Flame Burst',
    shield: 0,
    speedBonus: 0,
    alive: true,
  },
];

// -- Plansza: puste, obstacle, wall, bonus
// Klucze w mapie to "x_y"
const obstacles = new Set(['3_3', '2_3', '4_3', '3_2']);
const walls = new Set(['0_3', '6_3', '3_0', '3_6']); // odbijające ściany
const bonuses = new Map([
  ['1_1', { type: 'heal', value: 5 }],
  ['5_1', { type: 'speed', value: 1 }],
  ['1_5', { type: 'shield', value: 3 }],
]);

// -- Karty akcji
const ACTIONS_POOL = [
  {
    id: 'move',
    name: 'Ruch',
    desc: 'Przesuń się o 1 pole w wybranym kierunku.',
    icon: '🦶',
    execute: (player, data) => movePlayer(player, data.x, data.y),
  },
  {
    id: 'attack',
    name: 'Atak',
    desc: 'Zadaj 4 obrażenia przeciwnikowi na sąsiednim polu.',
    icon: '👊',
    execute: (player, data) => attackPlayer(player, data.targetId),
  },
  {
    id: 'push',
    name: 'Wypychanie',
    desc: 'Wypchnij przeciwnika na wolne pole za nim.',
    icon: '🛡️',
    execute: (player, data) => pushPlayer(player, data.targetId, data.pushX, data.pushY),
  },
  {
    id: 'heal',
    name: 'Leczenie',
    desc: 'Odzyskaj 5 HP.',
    icon: '❤️',
    execute: (player) => healPlayer(player, 5),
  },
  {
    id: 'speed',
    name: 'Przyspieszenie',
    desc: 'Zwiększ ruch o 1 przez 2 tury.',
    icon: '⚡',
    execute: (player) => applySpeedBonus(player, 1, 2),
  },
  {
    id: 'shield',
    name: 'Tarcza',
    desc: 'Zredukuj otrzymywane obrażenia o 3 przez 3 tury.',
    icon: '🛡️',
    execute: (player) => applyShield(player, 3, 3),
  },
  {
    id: 'finisher',
    name: 'Finisher',
    desc: 'Potężny specjalny ruch zadający 10 obrażeń i efektami.',
    icon: '🔥',
    execute: (player, data) => finisherMove(player, data.targetId),
  },
];

// -- Stan gry
let board = [];
let currentPlayerIndex = 0;
let turnNumber = 1;
let playerHands = {};
let selectedCard = null;
let selectedTarget = null;
let timerInterval = null;
let timeLeft = TURN_TIME_LIMIT;
let gameOver = false;

// -- Inicjalizacja planszy i UI
function initBoard() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.x = x;
      cell.dataset.y = y;

      const key = `${x}_${y}`;

      if (obstacles.has(key)) {
        cell.classList.add('obstacle');
        cell.textContent = '🪨';
      } else if (walls.has(key)) {
        cell.classList.add('wall');
        cell.textContent = '🧱';
      } else if (bonuses.has(key)) {
        cell.classList.add('bonus', bonuses.get(key).type);
        switch(bonuses.get(key).type) {
          case 'heal': cell.textContent = '❤️'; break;
          case 'speed': cell.textContent = '⚡'; break;
          case 'shield': cell.textContent = '🛡️'; break;
        }
      }

      boardEl.appendChild(cell);
    }
  }
}

// -- Aktualizacja widoku planszy
function updateBoard() {
  const boardEl = document.getElementById('board');
  // Usuwamy klasy zawodników z komórek
  boardEl.querySelectorAll('.cell').forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('Z1','Z2','Z3','Z4');
  });

  // Rysujemy zawodników
  players.forEach(p => {
    if (!p.alive) return;
    const selector = `.cell[data-x="${p.pos.x}"][data-y="${p.pos.y}"]`;
    const cell = boardEl.querySelector(selector);
    if (!cell) return;
    cell.classList.add(p.id);
    cell.textContent = p.id;

    // Jeśli tam bonus, też pokaż ikonę bonusu pod zawodnikiem (małe w rogu)
    const key = `${p.pos.x}_${p.pos.y}`;
    if (bonuses.has(key)) {
      const bonusType = bonuses.get(key).type;
      const bonusIcon = document.createElement('span');
      bonusIcon.classList.add('bonus-icon');
      switch(bonusType) {
        case 'heal': bonusIcon.textContent = '❤️'; break;
        case 'speed': bonusIcon.textContent = '⚡'; break;
        case 'shield': bonusIcon.textContent = '🛡️'; break;
      }
      bonusIcon.style.position = 'absolute';
      bonusIcon.style.bottom = '3px';
      bonusIcon.style.right = '5px';
      bonusIcon.style.fontSize = '18px';
      bonusIcon.style.pointerEvents = 'none';
      cell.appendChild(bonusIcon);
    }
  });
}

// -- Logowanie zdarzeń
function logEvent(text) {
  const logEl = document.getElementById('log');
  const time = new Date().toLocaleTimeString();
  logEl.textContent = `${time}: ${text}\n` + logEl.textContent;
}

// -- Aktualizacja HUD graczy i tury
function updateHUD() {
  const hudEl = document.getElementById('players-stats');
  hudEl.innerHTML = '';

  players.forEach(p => {
    const div = document.createElement('div');
    div.classList.add('player-stat');
    div.classList.add(p.alive ? 'alive' : 'dead');
    div.style.borderColor = p.alive ? 'limegreen' : 'darkred';
    div.innerHTML = `<div class="player-name">${p.name}</div>
                     <div class="player-hp">HP: ${p.hp} / ${p.maxHp}</div>
                     <div class="player-finisher">Finisher: ${p.finisher}</div>`;
    hudEl.appendChild(div);
  });

  const currentName = players[currentPlayerIndex].name;
  document.getElementById('current-player-name').textContent = currentName;
  document.getElementById('turn-number').textContent = turnNumber;
}

// -- Losowanie kart na rękę
function drawCards(playerId) {
  const hand = [];
  while(hand.length < MAX_HAND) {
    const card = ACTIONS_POOL[Math.floor(Math.random()*ACTIONS_POOL.length)];
    hand.push(card);
  }
  playerHands[playerId] = hand;
}

// -- Wyświetlanie kart akcji
function displayActionCards() {
  const actionPanel = document.getElementById('action-cards');
  actionPanel.innerHTML = '';

  const currentPlayer = players[currentPlayerIndex];
  const hand = playerHands[currentPlayer.id];

  hand.forEach((card, i) => {
    const cardEl = document.createElement('div');
    cardEl.classList.add('action-card');
    cardEl.textContent = `${card.icon} ${card.name}`;
    cardEl.title = card.desc;
    cardEl.dataset.index = i;

    if (selectedCard === i) {
      cardEl.classList.add('selected');
    }

    cardEl.addEventListener('click', () => {
      if (selectedCard === i) {
        selectedCard = null;
        selectedTarget = null;
        document.getElementById('confirm-action').disabled = true;
      } else {
        selectedCard = i;
        selectedTarget = null;
        document.getElementById('confirm-action').disabled
