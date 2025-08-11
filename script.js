"use strict";

// --- KONFIGURACJA --- //

const BOARD_SIZE = 8; // Można zmienić, proceduralne generowanie używa tej zmiennej

// Przykładowi zawodnicy (gracz + AI)
const WRESTLER_COLORS = ['red', 'blue', 'green', 'yellow'];
const WRESTLER_NAMES = ['El Toro', 'La Pantera', 'El Jaguar', 'La Serpiente'];

// Liczba kart dobieranych na turę
const CARDS_PER_TURN = 3;

// Losowe zdarzenia - pułapki i bonusy
const EVENT_TRAPS = ['Trap'];    // np. blokada ruchu, utrata karty itp.
const EVENT_BONUSES = ['Bonus']; // np. leczenie, ruch gratis

// --- STAN GRY --- //

let gameState = {
  board: [], // 2D array z komórkami, ich typem i obiektami
  wrestlers: [], // zawodnicy z pozycją, statystykami, kartami itp.
  currentPlayerIndex: 0,
  turn: 1,
  phase: 'draw', // draw, action, end
  events: [], // pułapki i bonusy na planszy
  equipment: [], // przedmioty na planszy
  selectedCard: null,
  selectedTarget: null,
  animationLock: false,
};

// --- KLASY I STRUKTURY --- //

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.type = 'normal'; // normal, trap, bonus, equipment
    this.content = null;  // wrestler id lub equipment id lub null
  }
}

class Wrestler {
  constructor(id, name, color) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.hp = 10;
    this.strength = 3;
    this.speed = 2;
    this.position = {x: 0, y: 0};
    this.hand = [];
    this.equipment = [];
    this.isAlive = true;
  }
}

class Card {
  constructor(id, name, description, type, effect) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.type = type; // move, attack, defend, special
    this.effect = effect; // funkcja lub opis działania
  }
}

// --- KARTY AKCJI - PRZYKŁADY --- //

const ACTION_CARDS = [
  new Card(1, "Power Punch", "Zadaj 3 obrażenia wybranemu przeciwnikowi w zasięgu 1 pola.", "attack", (user, target) => {
    if(distance(user.position, target.position) <= 1) {
      target.hp -= 3;
      if(target.hp <= 0) target.isAlive = false;
      return `${user.name} zadał 3 obrażenia ${target.name}.`;
    }
    return "Cel poza zasięgiem.";
  }),
  new Card(2, "Quick Step", "Przesuń się o 2 pola w dowolnym kierunku.", "move", (user) => {
    user.position = moveTowards(user.position, 2);
    return `${user.name} przesunął się o 2 pola.`;
  }),
  new Card(3, "Shield Up", "Obrona - zmniejsza obrażenia w następnej turze o 2.", "defend", (user) => {
    user.defense = 2;
    return `${user.name} przygotowuje się do obrony.`;
  }),
  new Card(4, "Throw Slam", "Zepchnij przeciwnika z sąsiedniego pola o 1 pole.", "special", (user, target) => {
    if(distance(user.position, target.position) === 1) {
      let dx = target.position.x - user.position.x;
      let dy = target.position.y - user.position.y;
      let newX = target.position.x + dx;
      let newY = target.position.y + dy;
      if(isInBounds(newX, newY) && !isOccupied(newX, newY)) {
        target.position.x = newX;
        target.position.y = newY;
        return `${user.name} zepchnął ${target.name} z ringu!`;
      }
      return `${target.name} nie może zostać zepchnięty dalej.`;
    }
    return "Przeciwnik nie jest obok.";
  }),
];

// --- POMOCNICZE FUNKCJE --- //

function distance(pos1, pos2) {
  return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
}

function isInBounds(x, y) {
  return x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE;
}

function isOccupied(x, y) {
  return gameState.wrestlers.some(w => w.isAlive && w.position.x === x && w.position.y === y);
}

function getWrestlerAt(x, y) {
  return gameState.wrestlers.find(w => w.isAlive && w.position.x === x && w.position.y === y);
}

function moveTowards(pos, steps) {
  // Proste losowe przesunięcie w granicach planszy (można rozszerzyć)
  let possibleMoves = [];
  for(let dx = -steps; dx <= steps; dx++) {
    for(let dy = -steps; dy <= steps; dy++) {
      let nx = pos.x + dx;
      let ny = pos.y + dy;
      if(isInBounds(nx, ny) && !isOccupied(nx, ny)) {
        possibleMoves.push({x: nx, y: ny});
      }
    }
  }
  if(possibleMoves.length === 0) return pos;
  // wybierz losowo
  return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random()*(max-min+1))+min;
}

// --- INICJALIZACJA PLANSZY --- //

function initBoard() {
  gameState.board = [];
  for(let y=0; y<BOARD_SIZE; y++) {
    let row = [];
    for(let x=0; x<BOARD_SIZE; x++) {
      row.push(new Cell(x,y));
    }
    gameState.board.push(row);
  }
  placeRandomEvents();
  placeRandomEquipment();
}

// --- GENEROWANIE LOSOWYCH PUŁAPEK I BONUSÓW --- //

function placeRandomEvents() {
  const totalEvents = Math.floor(BOARD_SIZE * BOARD_SIZE * 0.1);
  let placed = 0;
  while(placed < totalEvents) {
    let x = randomInt(0, BOARD_SIZE-1);
    let y = randomInt(0, BOARD_SIZE-1);
    let cell = gameState.board[y][x];
    if(cell.type === 'normal') {
      // losuj czy pułapka czy bonus
      if(Math.random() < 0.5) {
        cell.type = 'trap';
      } else {
        cell.type = 'bonus';
      }
      placed++;
    }
  }
}

// --- GENEROWANIE LOSOWYCH PRZEDMIOTÓW (EKWIPUNEK) --- //

const EQUIPMENT_TYPES = [
  {id: 1, name: "Healing Bandage", description: "Leczy 3 HP po użyciu."},
  {id: 2, name: "Power Gloves", description: "Zwiększa siłę o 1 na 3 tury."},
  {id: 3, name: "Speed Boots", description: "Zwiększa ruch o 1 na 2 tury."},
];

function placeRandomEquipment() {
  const totalEquip = Math.floor(BOARD_SIZE * BOARD_SIZE * 0.05);
  let placed = 0;
  while(placed < totalEquip) {
    let x = randomInt(0, BOARD_SIZE-1);
    let y = randomInt(0, BOARD_SIZE-1);
    let cell = gameState.board[y][x];
    if(cell.type === 'normal') {
      cell.type = 'equipment';
      cell.content = EQUIPMENT_TYPES[randomInt(0, EQUIPMENT_TYPES.length - 1)].id;
      placed++;
    }
  }
}

// --- INICJALIZACJA ZAWODNIKÓW --- //

function initWrestlers() {
  gameState.wrestlers = [];
  for(let i=0; i<WRESTLER_NAMES.length; i++) {
    let w = new Wrestler(i, WRESTLER_NAMES[i], WRESTLER_COLORS[i]);
    // pozycje startowe (rogi planszy)
    switch(i) {
      case 0: w.position = {x:0, y:0}; break;
      case 1: w.position = {x:BOARD_SIZE-1, y:0}; break;
      case 2: w.position = {x:0, y:BOARD_SIZE-1}; break;
      case 3: w.position = {x:BOARD_SIZE-1, y:BOARD_SIZE-1}; break;
    }
    gameState.wrestlers.push(w);
  }
}

// --- LOSOWANIE KART NA TURĘ --- //

function drawCards(wrestler) {
  wrestler.hand = [];
  for(let i=0; i<CARDS_PER_TURN; i++) {
    wrestler.hand.push(ACTION_CARDS[randomInt(0, ACTION_CARDS.length - 1)]);
  }
}

// --- WYŚWIETLANIE PLANSZY --- //

function renderBoard() {
  const boardEl = document.getElementById('board');
  boardEl.style.setProperty('--board-size', BOARD_SIZE);
  boardEl.innerHTML = '';
  for(let y=0; y<BOARD_SIZE; y++) {
    for(let x=0; x<BOARD_SIZE; x++) {
      const cell = gameState.board[y][x];
      const cellEl = document.createElement('div');
      cellEl.classList.add('cell');
      if(cell.type === 'trap') cellEl.classList.add('trap');
      if(cell.type === 'bonus') cellEl.classList.add('bonus');
      if(cell.type === 'equipment') cellEl.classList.add('equipment');
      cellEl.dataset.x = x;
      cellEl.dataset.y = y;

      // Tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      if(cell.type === 'trap') tooltip.textContent = "Pułapka: utrata ruchu lub karty!";
      else if(cell.type === 'bonus') tooltip.textContent = "Bonus: leczenie lub dodatkowy ruch!";
      else if(cell.type === 'equipment') {
        const eq = EQUIPMENT_TYPES.find(e => e.id === cell.content);
        tooltip.textContent = `Przedmiot: ${eq.name} - ${eq.description}`;
      } else {
        tooltip.textContent = `Pole (${x}, ${y})`;
      }
      cellEl.appendChild(tooltip);

      // Zawodnik na polu
      const wrestler = getWrestlerAt(x,y);
      if(wrestler) {
        const wEl = document.createElement('div');
        wEl.classList.add('wrestler', wrestler.color);
        wEl.textContent = wrestler.name[0];
        cellEl.appendChild(wEl);
      }
      boardEl.appendChild(cellEl);
    }
  }
}

// --- WYŚWIETLANIE PANELU INFORMACYJNEGO --- //

function renderInfoPanel() {
  const infoPanel = document.getElementById('info-panel');
  infoPanel.innerHTML = '';

  const currentWrestler = gameState.wrestlers[gameState.currentPlayerIndex];
  const h2 = document.createElement('h2');
  h2.textContent = `Tura: ${gameState.turn} — Gracz: ${currentWrestler.name}`;
  infoPanel.appendChild(h2);

  // Statystyki zawodnika
  const stats = document.createElement('div');
  stats.innerHTML = `
    <b>HP:</b> ${currentWrestler.hp} <br>
    <b>Siła:</b> ${currentWrestler.strength} <br>
    <b>Prędkość:</b> ${currentWrestler.speed} <br>
    <b>Ekwipunek:</b> ${currentWrestler.equipment.map(e => e.name).join(', ') || "Brak"} <br>
  `;
  infoPanel.appendChild(stats);

  // Karty
  const cardsDiv = document.createElement('div');
  cardsDiv.className = 'cards-container';

  currentWrestler.hand.forEach((card, idx) => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    if(gameState.selectedCard === idx) cardDiv.style.backgroundColor = '#044';
    cardDiv.innerHTML = `<b>${card.name}</b><br><small>${card.description}</small>`;
    cardDiv.onclick = () => {
      if(gameState.animationLock) return;
      gameState.selectedCard = idx;
      gameState.selectedTarget = null;
      renderInfoPanel();
    };
    cardsDiv.appendChild(cardDiv);
  });
  infoPanel.appendChild(cardsDiv);

  // Przyciski
  const btnUse = document.createElement('button');
  btnUse.textContent = 'Użyj karty';
  btnUse.onclick = useSelectedCard;
  btnUse.disabled = gameState.selectedCard === null || gameState.animationLock;
  infoPanel.appendChild(btnUse);

  const btnEndTurn = document.createElement('button');
  btnEndTurn.textContent = 'Zakończ turę';
  btnEndTurn.onclick = nextTurn;
  btnEndTurn.disabled = gameState.animationLock;
  infoPanel.appendChild(btnEndTurn);

  // Zapis i wczytanie
  const btnSave = document.createElement('button');
  btnSave.textContent = 'Zapisz grę';
  btnSave.onclick = saveGame;
  infoPanel.appendChild(btnSave);

  const btnLoad = document.createElement('button');
  btnLoad.textContent = 'Wczytaj grę';
  btnLoad.onclick = loadGame;
  infoPanel.appendChild(btnLoad);

  // Komunikaty z gry
  const messagesDiv = document.createElement('div');
  messagesDiv.id = 'game-messages';
  infoPanel.appendChild(messagesDiv);
}

// --- KOMUNIKATY GRY --- //

function addGameMessage(text) {
  const messagesDiv = document.getElementById('game-messages');
  const p = document.createElement('p');
  p.textContent = text;
  messagesDiv.prepend(p);
  if(messagesDiv.childNodes.length > 6) {
    messagesDiv.removeChild(messagesDiv.lastChild);
  }
}

// --- UŻYWANIE KARTY --- //

function useSelectedCard() {
  if(gameState.selectedCard === null) {
    addGameMessage("Wybierz kartę.");
    return;
  }
  if(gameState.animationLock) return;

  const currentWrestler = gameState.wrestlers[gameState.currentPlayerIndex];
  const card = currentWrestler.hand[gameState.selectedCard];

  // Dla kart ataku wybieramy cel
  if(card.type === 'attack' || card.type === 'special') {
    addGameMessage("Kliknij na przeciwnika, aby go zaatakować.");
    // Tutaj można dodać mechanizm wyboru celu na planszy, uprościmy dla demo:
    simpleAIUseCard(card, currentWrestler);
  } else if(card.type === 'move') {
    // Ruch automatyczny
    const oldPos = {...currentWrestler.position};
    currentWrestler.position = moveTowards(currentWrestler.position, 2);
    animateMove(currentWrestler, oldPos, currentWrestler.position);
    addGameMessage(card.effect(currentWrestler));
  } else if(card.type === 'defend') {
    addGameMessage(card.effect(currentWrestler));
  }

  // Usuwamy kartę z ręki
  currentWrestler.hand.splice(gameState.selectedCard, 1);
  gameState.selectedCard = null;
  renderInfoPanel();
  renderBoard();
}

// --- ANIMACJE RUCHU --- //

function animateMove(wrestler, from, to) {
  gameState.animationLock = true;
  const boardEl = document.getElementById('board');
  // Znajdź element pionka
  const cells = boardEl.querySelectorAll('.cell');
  let fromCell = null;
  let wEl = null;
  cells.forEach(cell => {
    if(+cell.dataset.x === from.x && +cell.dataset.y === from.y) {
      fromCell = cell;
    }
  });
  if(!fromCell) {
    gameState.animationLock = false;
    return;
  }
  wEl = fromCell.querySelector('.wrestler');
  if(!wEl) {
    gameState.animationLock = false;
    return;
  }
  // Animacja przesunięcia
  const dx = (to.x - from.x) * 63; // 60px + 3px gap
  const dy = (to.y - from.y) * 63;
  wEl.style.transition = 'transform 0.6s ease';
  wEl.style.transform = `translate(${dx}px, ${dy}px)`;

  setTimeout(() => {
    wEl.style.transition = '';
    wEl.style.transform = '';
    renderBoard();
    gameState.animationLock = false;
  }, 650);
}

// --- PROSTE AI (WERSJA DEMO) --- //

function simpleAIUseCard(card, wrestler) {
  // Znajdź możliwy cel w zasięgu karty
  let targets = gameState.wrestlers.filter(w => w.isAlive && w.id !== wrestler.id);
  targets = targets.filter(t => distance(wrestler.position, t.position) <= 1);

  if(targets.length > 0 && (card.type === 'attack' || card.type === 'special')) {
    const target = targets[0]; // najprostsza strategia: pierwszy możliwy
    const msg = card.effect(wrestler, target);
    animateAttack(wrestler, target);
    addGameMessage(msg);
    renderBoard();
    renderInfoPanel();
  } else {
    addGameMessage("Brak celów w zasięgu ataku. Karta stracona.");
  }
}

// --- ANIMACJA ATAKU --- //

function animateAttack(attacker, target) {
  gameState.animationLock = true;
  const boardEl = document.getElementById('board');

  // Znajdź elementy pionków
  let attackerEl, targetEl;
  const cells = boardEl.querySelectorAll('.cell');
  cells.forEach(cell => {
    if(+cell.dataset.x === attacker.position.x && +cell.dataset.y === attacker.position.y) {
      attackerEl = cell.querySelector('.wrestler');
    }
    if(+cell.dataset.x === target.position.x && +cell.dataset.y === target.position.y) {
      targetEl = cell.querySelector('.wrestler');
    }
  });
  if(!attackerEl || !targetEl) {
    gameState.animationLock = false;
    return;
  }
  attackerEl.classList.add('attack');

  setTimeout(() => {
    attackerEl.classList.remove('attack');
    if(!target.isAlive) {
      addGameMessage(`${target.name} został wyeliminowany!`);
    }
    renderBoard();
    renderInfoPanel();
    gameState.animationLock = false;
  }, 800);
}

// --- KOLEJKA TUR --- //

function nextTurn() {
  if(gameState.animationLock) return;
  gameState.currentPlayerIndex++;
  if(gameState.currentPlayerIndex >= gameState.wrestlers.length) {
    gameState.currentPlayerIndex = 0;
    gameState.turn++;
  }
  // Jeśli gracz nieżywy, pomiń
  while(!gameState.wrestlers[gameState.currentPlayerIndex].isAlive) {
    gameState.currentPlayerIndex++;
    if(gameState.currentPlayerIndex >= gameState.wrestlers.length) {
      gameState.currentPlayerIndex = 0;
      gameState.turn++;
    }
  }
  drawCards(gameState.wrestlers[gameState.currentPlayerIndex]);
  gameState.selectedCard = null;
  gameState.selectedTarget = null;
  renderBoard();
  renderInfoPanel();
  addGameMessage(`Tura gracza ${gameState.wrestlers[gameState.currentPlayerIndex].name}.`);
}

// --- ZAPIS I WCZYTANIE GRY --- //

function saveGame() {
  const data = JSON.stringify(gameState, (key, value) => {
    // Usuwamy funkcje z obiektów (np. efekt kart)
    if(typeof value === 'function') return undefined;
    return value;
  });
  localStorage.setItem('wrestlingGameSave', data);
  addGameMessage("Gra zapisana.");
}

function loadGame() {
  const data = localStorage.getItem('wrestlingGameSave');
  if(!data) {
    addGameMessage("Brak zapisu gry.");
    return;
  }
  const loaded = JSON.parse(data);
  Object.assign(gameState, loaded);

  // Po załadowaniu musimy przywrócić karty z efektami
  for(const w of gameState.wrestlers) {
    w.hand = w.hand.map(c => ACTION_CARDS.find(ac => ac.id === c.id) || c);
  }
  renderBoard();
  renderInfoPanel();
  addGameMessage("Gra wczytana.");
}

// --- INICJALIZACJA --- //

function startGame() {
  initBoard();
  initWrestlers();
  gameState.currentPlayerIndex = 0;
  gameState.turn = 1;
  gameState.phase = 'draw';
  drawCards(gameState.wrestlers[0]);
  renderBoard();
  renderInfoPanel();
  addGameMessage("Gra rozpoczęta.");
}

// --- URUCHOMIENIE --- //

startGame();

</script>

<style>
  #board {
    display: grid;
    grid-template-columns: repeat(6, 60px);
    grid-template-rows: repeat(6, 60px);
    gap: 3px;
    margin-bottom: 15px;
  }
  .cell {
    width: 60px;
    height: 60px;
    background-color: #eee;
    border: 1px solid #ccc;
    position: relative;
  }
  .cell .wrestler {
    width: 56px;
    height: 56px;
    background-color: #2277cc;
    border-radius: 8px;
    margin: 2px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-weight: bold;
    user-select: none;
  }
  .cell .wrestler.attack {
    animation: attackAnim 0.8s;
  }
  @keyframes attackAnim {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(10px); }
  }
  #info-panel {
    border: 1px solid #ccc;
    padding: 10px;
    max-width: 370px;
    background: #f9f9f9;
  }
  .cards-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 10px 0;
  }
  .card {
    background: #def;
    border: 1px solid #aac;
    border-radius: 5px;
    padding: 4px 6px;
    width: 110px;
    cursor: pointer;
    user-select: none;
  }
  button {
    margin: 5px 4px 5px 0;
    padding: 6px 12px;
  }
</style>

</body>
</html>
