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
        document.getElementById('confirm-action').disabled = false;
      }
      displayActionCards();
      displayTargetsIfNeeded();
    });

    actionPanel.appendChild(cardEl);
  });
}

// -- Wyświetlanie dostępnych celów (jeśli karta wymaga wyboru celu)
function displayTargetsIfNeeded() {
  const currentPlayer = players[currentPlayerIndex];
  if (selectedCard === null) return;

  const card = playerHands[currentPlayer.id][selectedCard];

  if (['attack','push','finisher'].includes(card.id)) {
    // Pokazujemy pola z przeciwnikami obok, żeby kliknąć
    highlightTargets(currentPlayer);
  } else if (card.id === 'move') {
    highlightMovement(currentPlayer);
  } else {
    clearHighlights();
  }
}

// -- Wyróżnianie pól z przeciwnikami obok
function highlightTargets(player) {
  clearHighlights();
  const adjacents = getAdjacentEnemies(player);

  adjacents.forEach(p => {
    const selector = `.cell[data-x="${p.pos.x}"][data-y="${p.pos.y}"]`;
    const cell = document.querySelector(selector);
    if (!cell) return;
    cell.classList.add('highlight-target');
    cell.addEventListener('click', () => {
      selectedTarget = p.id;
      document.getElementById('confirm-action').disabled = false;
      displayActionCards();
    }, { once: true });
  });
}

// -- Wyróżnianie pól ruchu (1 pole w 4 kierunkach, bez przeszkód)
function highlightMovement(player) {
  clearHighlights();
  const moves = getPossibleMoves(player);

  moves.forEach(pos => {
    const selector = `.cell[data-x="${pos.x}"][data-y="${pos.y}"]`;
    const cell = document.querySelector(selector);
    if (!cell) return;
    cell.classList.add('highlight-move');
    cell.addEventListener('click', () => {
      selectedTarget = { x: pos.x, y: pos.y };
      document.getElementById('confirm-action').disabled = false;
      displayActionCards();
    }, { once: true });
  });
}

// -- Czyszczenie podświetleń
function clearHighlights() {
  document.querySelectorAll('.highlight-target, .highlight-move').forEach(el => {
    el.classList.remove('highlight-target', 'highlight-move');
    el.replaceWith(el.cloneNode(true)); // usuwa eventy kliknięć
  });
}

// -- Zwraca sąsiadujących wrogów (obcy zawodnicy obok na planszy)
function getAdjacentEnemies(player) {
  const adj = [];
  const dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];
  dirs.forEach(d => {
    const nx = player.pos.x + d.dx;
    const ny = player.pos.y + d.dy;
    if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) return;
    players.forEach(p => {
      if (p.id !== player.id && p.alive && p.pos.x === nx && p.pos.y === ny) {
        adj.push(p);
      }
    });
  });
  return adj;
}

// -- Zwraca możliwe ruchy (puste pola wokół)
function getPossibleMoves(player) {
  const moves = [];
  const dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];
  dirs.forEach(d => {
    const nx = player.pos.x + d.dx;
    const ny = player.pos.y + d.dy;
    if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) return;
    const key = `${nx}_${ny}`;
    // Sprawdź przeszkody, ściany i zawodników
    if (obstacles.has(key) || walls.has(key)) return;
    let occupied = false;
    players.forEach(p => {
      if (p.alive && p.pos.x === nx && p.pos.y === ny) occupied = true;
    });
    if (!occupied) moves.push({ x: nx, y: ny });
  });
  return moves;
}

// -- Wykonanie ruchu gracza
function movePlayer(player, x, y) {
  if (gameOver) return;
  const oldX = player.pos.x;
  const oldY = player.pos.y;
  player.pos.x = x;
  player.pos.y = y;

  logEvent(`${player.name} przesunął się na pole (${x},${y}).`);

  // Sprawdź bonus na polu
  const key = `${x}_${y}`;
  if (bonuses.has(key)) {
    const bonus = bonuses.get(key);
    applyBonus(player, bonus);
    bonuses.delete(key);
    const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    if (cell) {
      cell.classList.remove('bonus', bonus.type);
      cell.textContent = '';
    }
  }

  updateBoard();
  updateHUD();
}

// -- Zastosowanie bonusu
function applyBonus(player, bonus) {
  switch(bonus.type) {
    case 'heal':
      healPlayer(player, bonus.value);
      logEvent(`${player.name} zebrał bonus leczenia (+${bonus.value} HP).`);
      break;
    case 'speed':
      applySpeedBonus(player, bonus.value, 3);
      logEvent(`${player.name} zdobył bonus szybkości (+${bonus.value} ruchu na 3 tury).`);
      break;
    case 'shield':
      applyShield(player, bonus.value, 3);
      logEvent(`${player.name} zdobył bonus tarczy (+${bonus.value} tarczy na 3 tury).`);
      break;
  }
}

// -- Leczenie
function healPlayer(player, amount) {
  if (!player.alive) return;
  player.hp = Math.min(player.maxHp, player.hp + amount);
  logEvent(`${player.name} odzyskał ${amount} HP.`);
  updateHUD();
}

// -- Zastosowanie przyspieszenia
function applySpeedBonus(player, amount, duration) {
  player.speedBonus = amount;
  player.speedBonusDuration = duration;
  logEvent(`${player.name} ma przyspieszenie +${amount} na ${duration} tur.`);
  updateHUD();
}

// -- Zastosowanie tarczy
function applyShield(player, amount, duration) {
  player.shield = amount;
  player.shieldDuration = duration;
  logEvent(`${player.name} ma tarczę redukującą obrażenia o ${amount} przez ${duration} tur.`);
  updateHUD();
}

// -- Atak na przeciwnika
function attackPlayer(player, targetId) {
  if (gameOver) return;
  const target = players.find(p => p.id === targetId);
  if (!target || !target.alive) return;

  // Oblicz obrażenia z uwzględnieniem tarczy
  const baseDamage = 4;
  let damage = baseDamage;
  if (target.shield > 0) {
    damage = Math.max(0, damage - target.shield);
  }

  target.hp -= damage;
  logEvent(`${player.name} zaatakował ${target.name} i zadał ${damage} obrażeń.`);

  if (target.hp <= 0) {
    target.alive = false;
    logEvent(`${target.name} został wyeliminowany!`);
  }

  updateHUD();
  updateBoard();
}

// -- Wypychanie przeciwnika
function pushPlayer(player, targetId, pushX, pushY) {
  if (gameOver) return;
  const target = players.find(p => p.id === targetId);
  if (!target || !target.alive) return;

  // Sprawdź czy można wypchnąć na pushX,pushY
  const key = `${pushX}_${pushY}`;
  if (
    pushX < 0 || pushX >= BOARD_SIZE || pushY < 0 || pushY >= BOARD_SIZE ||
    obstacles.has(key) || walls.has(key)
  ) {
    logEvent(`Nie można wypchnąć ${target.name} na to pole.`);
    return;
  }
  let occupied = false;
  players.forEach(p => {
    if (p.alive && p.pos.x === pushX && p.pos.y === pushY) occupied = true;
  });
  if (occupied) {
    logEvent(`Nie można wypchnąć ${target.name} na zajęte pole.`);
    return;
  }

  target.pos.x = pushX;
  target.pos.y = pushY;

  logEvent(`${player.name} wypchnął ${target.name} na pole (${pushX},${pushY}).`);

  updateBoard();
  updateHUD();
}

// -- Finisher
function finisherMove(player, targetId) {
  if (gameOver) return;
  const target = players.find(p => p.id === targetId);
  if (!target || !target.alive) return;

  const damage = 10;
  let finalDamage = damage;
  if (target.shield > 0) {
    finalDamage = Math.max(0, damage - target.shield);
  }

  target.hp -= finalDamage;
  logEvent(`${player.name} wykonał finisher ${player.finisher} na ${target.name}, zadając ${finalDamage} obrażeń!`);

  if (target.hp <= 0) {
    target.alive = false;
    logEvent(`${target.name} został wyeliminowany!`);
  }

  // Efekty dodatkowe finishera — np. zablokowanie ruchu przeciwnika na 1 turę, redukcja tarczy itp.
  // Tu można rozbudować efekt

  updateHUD();
  updateBoard();
}

// -- Zakończenie tury
function endTurn() {
  if (gameOver) return;

  // Reset wyborów
  selectedCard = null;
  selectedTarget = null;
  document.getElementById('confirm-action').disabled = true;
  clearHighlights();

  // Aktualizacja bonusów (tarcza, szybkość)
  const currentPlayer = players[currentPlayerIndex];
  if (currentPlayer.shieldDuration) {
    currentPlayer.shieldDuration--;
    if (currentPlayer.shieldDuration <= 0) {
      currentPlayer.shield = 0;
      logEvent(`${currentPlayer.name} stracił tarczę.`);
    }
  }
  if (currentPlayer.speedBonusDuration) {
    currentPlayer.speedBonusDuration--;
    if (currentPlayer.speedBonusDuration <= 0) {
      currentPlayer.speedBonus = 0;
      logEvent(`${currentPlayer.name} stracił przyspieszenie.`);
    }
  }

  // Sprawdź czy gra zakończona
  const alivePlayers = players.filter(p => p.alive);
  if (alivePlayers.length <= 1) {
    gameOver = true;
    logEvent(`Gra zakończona! Zwycięzca: ${alivePlayers[0] ? alivePlayers[0].name : 'brak'}`);
    document.getElementById('confirm-action').disabled = true;
    clearInterval(timerInterval);
    return;
  }

  // Przejście do następnego gracza
  do {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  } while (!players[currentPlayerIndex].alive);

  turnNumber++;
  drawCards(players[currentPlayerIndex].id);
  displayActionCards();
  updateHUD();
  startTurnTimer();
}

// -- Timer tury
function startTurnTimer() {
  clearInterval(timerInterval);
  timeLeft = TURN_TIME_LIMIT;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      logEvent(`${players[currentPlayerIndex].name} stracił czas i traci turę.`);
      endTurn();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const timerEl = document.getElementById('turn-timer');
  timerEl.textContent = `Czas tury: ${timeLeft}s`;
}

// -- Inicjalizacja gry
function startGame() {
  initBoard();
  drawCards(players[currentPlayerIndex].id);
  displayActionCards();
  updateBoard();
  updateHUD();
  startTurnTimer();
  logEvent(`Gra rozpoczęta! Zaczyna ${players[currentPlayerIndex].name}.`);
  document.getElementById('confirm-action').disabled = true;
  gameOver = false;
}

// -- Obsługa potwierdzenia akcji
document.getElementById('confirm-action').addEventListener('click', () => {
  if (gameOver) return;
  const currentPlayer = players[currentPlayerIndex];
  if (selectedCard === null) return;

  const card = playerHands[currentPlayer.id][selectedCard];
  if (!card) return;

  switch(card.id) {
    case 'move':
      if (!selectedTarget) return;
      card.execute(currentPlayer, selectedTarget);
      break;
    case 'attack':
    case 'push':
    case 'finisher':
      if (!selectedTarget) return;
      if (card.id === 'push') {
        // Wyliczamy gdzie wypchnąć (kierunek)
        const targetPlayer = players.find(p => p.id === selectedTarget);
        if (!targetPlayer) return;
        const dx = targetPlayer.pos.x - currentPlayer.pos.x;
        const dy = targetPlayer.pos.y - currentPlayer.pos.y;
        const pushX = targetPlayer.pos.x + dx;
        const pushY = targetPlayer.pos.y + dy;
        card.execute(currentPlayer, selectedTarget, pushX, pushY);
      } else {
        card.execute(currentPlayer, selectedTarget);
      }
      break;
    case 'heal':
    case 'speed':
    case 'shield':
      card.execute(currentPlayer);
      break;
  }

  endTurn();
});

// -- Start
startGame();
