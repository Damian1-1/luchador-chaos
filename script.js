code
const boardSize = 5;
""
"// Plansza to tablica 5x5, puste pola to null, zawodnicy to obiekty"
let board = [];
let players = {
"  Z1: { name: 'El Toro Fuerte', pos: { x: 2, y: 0 }, hp: 10 },"
"  Z2: { name: 'La Sombra Veloz', pos: { x: 0, y: 2 }, hp: 8 },"
"  Z3: { name: 'Gringo Loco', pos: { x: 4, y: 2 }, hp: 9 },"
"  Z4: { name: 'Señor Martillo', pos: { x: 2, y: 4 }, hp: 12 },"
};
let currentPlayerKeys = Object.keys(players);
let currentTurn = 0;
let selectedAction = null;
let logDiv = null;
""
function log(msg) {
  logDiv.innerHTML += msg + '<br>';
  logDiv.scrollTop = logDiv.scrollHeight;
}
""
function initBoard() {
  board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
  // Wstawiamy zawodników na planszę
  for(let key in players) {
    let p = players[key];
    board[p.pos.y][p.pos.x] = key;
  }
}
""
function renderBoard() {
  const boardDiv = document.getElementById('board');
  boardDiv.innerHTML = '';
  for(let y=0; y<boardSize; y++) {
    for(let x=0; x<boardSize; x++) {
      let cell = document.createElement('div');
      cell.className = 'cell';
      let val = board[y][x];
      if(val) {
        cell.textContent = val;
        cell.classList.add(val);
      }
      cell.dataset.x = x;
      cell.dataset.y = y;
"      cell.onclick = () => cellClicked(x,y);"
      boardDiv.appendChild(cell);
    }
  }
}
""
"function cellClicked(x, y) {"
  let currentKey = currentPlayerKeys[currentTurn];
  let player = players[currentKey];
  // ruch do pustego pola obok
  let dist = Math.abs(player.pos.x - x) + Math.abs(player.pos.y - y);
  if(dist === 1 && !board[y][x]) {
"    movePlayer(currentKey, x, y);"
    endTurn();
  } else if(board[y][x] && board[y][x] !== currentKey && selectedAction) {
    // Akcja na przeciwniku na polu sąsiednim
    if(selectedAction === 'attack') {
"      attack(currentKey, board[y][x]);"
    } else if(selectedAction === 'push') {
"      push(currentKey, board[y][x]);"
    }
    endTurn();
  } else {
    log('Nie można wykonać akcji na tym polu.');
  }
}
""
"function movePlayer(key, x, y) {"
  let player = players[key];
"  log(player.name + ' porusza się z (' + player.pos.x + ',' + player.pos.y + ') na (' + x + ',' + y + ')');"
  board[player.pos.y][player.pos.x] = null;
  board[y][x] = key;
  player.pos.x = x;
  player.pos.y = y;
  renderBoard();
}
""
"function attack(attackerKey, targetKey) {"
  let attacker = players[attackerKey];
  let target = players[targetKey];
  let damage = 2; // prosta zasada
  target.hp -= damage;
  log(attacker.name + ' atakuje ' + target.name + ' i zadaje ' + damage + ' obrażeń. HP ' + target.name + ': ' + target.hp);
  if(target.hp <= 0) {
    log(target.name + ' został wyeliminowany!');
    // Usuwamy z planszy i z listy
    board[target.pos.y][target.pos.x] = null;
    delete players[targetKey];
    currentPlayerKeys = Object.keys(players);
    if(currentPlayerKeys.length === 1) {
      alert(currentPlayerKeys[0] + ' wygrywa grę!');
      location.reload();
    }
  }
  renderBoard();
}
""
"function push(attackerKey, targetKey) {"
  let attacker = players[attackerKey];
  let target = players[targetKey];
"  // Próba wypchnięcia przeciwnika na pole za nim, jeśli wolne i w planszy"
  let dx = target.pos.x - attacker.pos.x;
  let dy = target.pos.y - attacker.pos.y;
  let newX = target.pos.x + dx;
  let newY = target.pos.y + dy;
  if(newX >= 0 && newX < boardSize && newY >= 0 && newY < boardSize && !board[newY][newX]) {
"    log(attacker.name + ' wypycha ' + target.name + ' na pole (' + newX + ',' + newY + ')');"
    board[target.pos.y][target.pos.x] = null;
    board[newY][newX] = targetKey;
    target.pos.x = newX;
    target.pos.y = newY;
"    // Sprawdź czy wypchnięty poza planszę (np. jeśli na brzegu, to eliminacja)"
    if(newX === 0 || newX === boardSize-1 || newY === 0 || newY === boardSize-1) {
      log(target.name + ' został wypchnięty z ringu i wyeliminowany!');
      board[newY][newX] = null;
      delete players[targetKey];
      currentPlayerKeys = Object.keys(players);
      if(currentPlayerKeys.length === 1) {
        alert(currentPlayerKeys[0] + ' wygrywa grę!');
        location.reload();
      }
    } else {
      renderBoard();
    }
  } else {
    log('Nie można wypchnąć przeciwnika na to pole.');
  }
}
""
function chooseAction(action) {
  selectedAction = action;
  log('Wybrano akcję: ' + action);
}
""
function endTurn() {
  selectedAction = null;
  currentTurn = (currentTurn + 1) % currentPlayerKeys.length;
  log('Tura gracza: ' + players[currentPlayerKeys[currentTurn]].name);
}
""
function startGame() {
  initBoard();
  renderBoard();
  logDiv = document.getElementById('log');
  log('Tura gracza: ' + players[currentPlayerKeys[currentTurn]].name);
}
""
startGame();
