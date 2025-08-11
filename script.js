const BOARD_SIZE = 7;

const playersData = {
  Z1: {
    name: 'El Toro Fuerte',
    hp: 15,
    pos: { x: 3, y: 0 },
    finisher: 'Rage Bull',
    colorClass: 'Z1',
  },
  Z2: {
    name: 'La Sombra Veloz',
    hp: 12,
    pos: { x: 0, y: 3 },
    finisher: 'Shadow Strike',
    colorClass: 'Z2',
  },
  Z3: {
    name: 'Gringo Loco',
    hp: 14,
    pos: { x: 6, y: 3 },
    finisher: 'Crazy Spin',
    colorClass: 'Z3',
  },
  Z4: {
    name: 'Señor Martillo',
    hp: 18,
    pos: { x: 3, y: 6 },
    finisher: 'Hammer Slam',
    colorClass: 'Z4',
  },
};

const obstacles = [
  { x: 2, y: 2 },
  { x: 4, y: 2 },
  { x: 2, y: 4 },
  { x: 4, y: 4 },
];

const bonuses = [
  { x: 3, y: 3, type: 'heal', value: 3 },
];

let board = [];
let players = {};
let currentPlayerOrder = [];
let currentTurn = 0;
let selectedAction = null;
let actionTarget = null;

const boardDiv = document.getElementById('board');
const logDiv = document.getElementById('log');
const actionCardsDiv = document.getElementById('action-cards');
const confirmBtn = document.getElementById('confirm-action');
const currentPlayerNameSpan = document.getElementById('current-player-name');

function log(message) {
  logDiv.innerHTML += message + '<br>';
  logDiv.scrollTop = logDiv.scrollHeight;
}

function initBoard() {
  board = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

  players = JSON.parse(JSON.stringify(playersData));
  currentPlayerOrder = Object.keys(players);
  currentTurn = 0;
  selectedAction = null;
  actionTarget = null;

  // Place players on board
  for (const key of currentPlayerOrder) {
    const p = players[key];
    board[p.pos.y][p.pos.x] = key;
  }
  // Place obstacles
  for (const o of obstacles) {
    board[o.y][o.x] = 'obstacle';
  }
  // Place bonuses
  for (const b of bonuses) {
    board[b.y][b.x] = 'bonus';
  }
}

function renderBoard() {
  boardDiv.innerHTML = '';
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';

      const cellVal = board[y][x];
      if (cellVal) {
        if (cellVal.startsWith && cellVal.startsWith('Z')) {
          cell.textContent = cellVal;
          cell.classList.add(players[cellVal].colorClass);
          cell.title = `${players[cellVal].name} (HP: ${players[cellVal].hp})`;
        } else if (cellVal === 'obstacle') {
          cell.classList.add('obstacle');
          cell.textContent = '⛰️';
          cell.title = 'Przeszkoda - nie można przejść';
          cell.style.cursor = 'default';
        } else if (cellVal === 'bonus') {
          cell.classList.add('bonus');
          cell.textContent = '❤️';
          cell.title = 'Bonus zdrowia';
        }
      }
      cell.dataset.x = x;
      cell.dataset.y = y;

      cell.onclick = () => cellClicked(x, y);
      boardDiv.appendChild(cell);
    }
  }
}

function getCurrentPlayerKey() {
  return currentPlayerOrder[currentTurn];
}

function cellClicked(x, y) {
  const currentKey = getCurrentPlayerKey();
  const player = players[currentKey];

  if (!selectedAction) {
    log('Wybierz kartę akcji najpierw.');
    return;
  }

  const dist = Math.abs(player.pos.x - x) + Math.abs(player.pos.y - y);
  const target = board[y][x];

  if (selectedAction === 'move') {
    if (dist === 1 && !target) {
      movePlayer(currentKey, x, y);
      confirmBtn.disabled = false;
      actionTarget = { x, y };
    } else {
      log('Ruch możliwy tylko na sąsiednie puste pole.');
    }
  } else if (selectedAction === 'attack') {
    if (dist === 1 && target && target.startsWith && target.startsWith('Z') && target !== currentKey) {
      actionTarget = { x, y };
      confirmBtn.disabled = false;
      log(`Atak na ${players[target].name} wybrany.`);
    } else {
      log('Atak możliwy tylko na sąsiadującego przeciwnika.');
    }
  } else if (selectedAction === 'push') {
    if (dist === 1 && target && target.startsWith && target.startsWith('Z') && target !== currentKey) {
      actionTarget = { x, y };
      confirmBtn.disabled = false;
      log(`Wypychanie ${players[target].name} wybrane.`);
    } else {
      log('
