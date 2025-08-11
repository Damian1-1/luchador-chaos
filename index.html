<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8" />
<title>Turowa gra wrestlingowa</title>
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
</head>
<body>
<h2>Turowa gra wrestlingowa (demo)</h2>
<div id="board"></div>
<div id="info-panel"></div>

<script>
  // --- STAN GRY ---
  const BOARD_SIZE = 6;

  let gameState = {
    board: [],
    wrestlers: [],
    currentPlayerIndex: 0,
    turn: 1,
    selectedCard: null,
    selectedTarget: null,
    animationLock: false,
  };

  // --- KARTY ---
  const ACTION_CARDS = [
    {
      id: 1,
      name: 'Ruch',
      type: 'move',
      description: 'Przesuń zawodnika o 2 pola w dowolnym kierunku.',
      effect: (wrestler) => {
        // ruch wykonany w useSelectedCard
        return `${wrestler.name} przesuwa się o 2 pola.`;
      }
    },
    {
      id: 2,
      name: 'Atak',
      type: 'attack',
      description: 'Zadaj 2 obrażenia przeciwnikowi w zasięgu 1 pola.',
      effect: (attacker, target) => {
        target.hp -= 2;
        if(target.hp <= 0) {
          target.isAlive = false;
        }
        return `${attacker.name} atakuje ${target.name} i zadaje 2 obrażeń.`;
      }
    },
    {
      id: 3,
      name: 'Obrona',
      type: 'defend',
      description: 'Zwiększ obronę o 2 na tę turę.',
      effect: (wrestler) => {
        wrestler.defense += 2;
        return `${wrestler.name} wzmacnia obronę o 2 na tę turę.`;
      }
    },
    {
      id: 4,
      name: 'Specjalny cios',
      type: 'special',
      description: 'Zadaj 4 obrażenia przeciwnikowi w zasięgu 1 pola.',
      effect: (attacker, target) => {
        target.hp -= 4;
        if(target.hp <= 0) {
          target.isAlive = false;
        }
        return `${attacker.name} wykonuje specjalny cios na ${target.name} i zadaje 4 obrażeń.`;
      }
    }
  ];

  // --- INICJALIZACJA PLANSZY ---
  function initBoard() {
    gameState.board = [];
    for(let y=0; y<BOARD_SIZE; y++) {
      let row = [];
      for(let x=0; x<BOARD_SIZE; x++) {
        row.push(null);
      }
      gameState.board.push(row);
    }
  }

  // --- INICJALIZACJA ZAWODNIKÓW ---
  function initWrestlers() {
    gameState.wrestlers = [
      { id: 1, name: 'Gracz1', hp: 10, defense: 0, isAlive: true, position: {x: 0, y: 0}, hand: [], equipment: [] },
      { id: 2, name: 'AI', hp: 10, defense: 0, isAlive: true, position: {x: BOARD_SIZE-1, y: BOARD_SIZE-1}, hand: [], equipment: [] },
    ];
  }

  // --- RYSOWANIE PLANSZY ---
  function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    for(let y=0; y<BOARD_SIZE; y++) {
      for(let x=0; x<BOARD_SIZE; x++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.x = x;
        cell.dataset.y = y;

        const wrestlerHere = gameState.wrestlers.find(w => w.isAlive && w.position.x === x && w.position.y === y);
        if(wrestlerHere) {
          const wEl = document.createElement('div');
          wEl.className = 'wrestler';
          wEl.textContent = wrestlerHere.name[0];
          if(gameState.currentPlayerIndex === gameState.wrestlers.indexOf(wrestlerHere)) {
            wEl.style.backgroundColor = '#2a7';
          } else {
            wEl.style.backgroundColor = '#a22';
          }
          cell.appendChild(wEl);
        }

        boardEl.appendChild(cell);
      }
    }
  }

  // --- RYSOWANIE PANELU INFORMACJI ---
  function renderInfoPanel() {
    const infoPanel = document.getElementById('info-panel');
    infoPanel.innerHTML = '';
    const currentWrestler = gameState.wrestlers[gameState.currentPlayerIndex];
    if(!currentWrestler.isAlive) {
      addGameMessage("Twój zawodnik został wyeliminowany, przejdź dalej.");
      return;
    }

    const stats = document.createElement('div');
    stats.innerHTML = `
      <b>Gracz:</b> ${currentWrestler.name} <br>
      <b>HP:</b> ${currentWrestler.hp} <br>
      <b>Obrona:</b> ${currentWrestler.defense} <br>
      <b>Pozycja:</b> (${currentWrestler.position.x}, ${currentWrestler.position.y}) <br>
      <b>Ręka kart:</b> ${currentWrestler.hand.map(e => e.name).join(', ') || "Brak"} <br>
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

  // --- KOMUNIKATY GRY ---
  function addGameMessage(text) {
    const messagesDiv = document.getElementById('game-messages');
    if(!messagesDiv) return;
    const p = document.createElement('p');
    p.textContent = text;
    messagesDiv.prepend(p);
    if(messagesDiv.childNodes.length > 6) {
      messagesDiv.removeChild(messagesDiv.lastChild);
    }
  }

  // --- UŻYWANIE KARTY ---
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
      // Ruch automatyczny - przesunięcie o 2 pola w prawo, lub na planszy jeśli nie można
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

  // --- RUCH - proste przesunięcie w prawo lub w dół jeśli koniec planszy ---
  function moveTowards(pos, steps) {
    let x = pos.x + steps;
    let y = pos.y;
    if(x >= BOARD_SIZE) {
      y = y + 1;
      x = x - BOARD_SIZE;
      if(y >= BOARD_SIZE) y = BOARD_SIZE - 1;
    }
    return {x, y};
  }

  // --- ANIMACJE RUCHU ---
  function animateMove(wrestler, from, to) {
    gameState.animationLock = true;
    const boardEl = document.getElementById('board');
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
    const dx = (to.x - from.x) * 63;
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

  // --- PROSTE AI (dla demo) ---
  function simpleAIUseCard(card, wrestler) {
    let targets = gameState.wrestlers.filter(w => w.isAlive && w.id !== wrestler.id);
    targets = targets.filter(t => distance(wrestler.position, t.position) <= 1);

    if(targets.length > 0 && (card.type === 'attack' || card.type === 'special')) {
      const target = targets[0];
      const msg = card.effect(wrestler, target);
      animateAttack(wrestler, target);
      addGameMessage(msg);
      renderBoard();
      renderInfoPanel();
    } else {
      addGameMessage("Brak celów w zasięgu ataku. Karta stracona.");
    }
  }

  // --- ANIMACJA ATAKU ---
  function animateAttack(attacker, target) {
    gameState.animationLock = true;
    const boardEl = document.getElementById('board');
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

  // --- ODLEGŁOŚĆ ---
  function distance(pos1, pos2) {
    return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
  }

  // --- KOLEJKA ---
  function nextTurn() {
    if(gameState.animationLock) return;
    gameState.currentPlayerIndex++;
    if(gameState.currentPlayerIndex >= gameState.wrestlers.length) {
      gameState.currentPlayerIndex = 0;
      gameState.turn++;
    }
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

  // --- ROZDAWANIE KART ---
  function drawCards(wrestler) {
    wrestler.hand = [];
    // Prosto losujemy po 2 karty z akcji
    for(let i=0; i<2; i++) {
      const card = ACTION_CARDS[Math.floor(Math.random()*ACTION_CARDS.length)];
      wrestler.hand.push(card);
    }
  }

  // --- ZAPIS I WCZYTANIE ---
  function saveGame() {
    const data = JSON.stringify(gameState, (key, value) => {
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

    // Przywróć karty z efektami
    for(const w of gameState.wrestlers) {
      w.hand = w.hand.map(c => ACTION_CARDS.find(ac => ac.id === c.id) || c);
    }
    renderBoard();
    renderInfoPanel();
    addGameMessage("Gra wczytana.");
  }

  // --- START ---
  function startGame() {
    initBoard();
    initWrestlers();
    gameState.currentPlayerIndex = 0;
    gameState.turn = 1;
    drawCards(gameState.wrestlers[0]);
    renderBoard();
    renderInfoPanel();
    addGameMessage("Gra rozpoczęta.");
  }

  startGame();
</script>
</body>
</html>
