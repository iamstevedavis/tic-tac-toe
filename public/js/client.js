// Chat 👇
const socket = io();

const gameBtns = Array.from(document.querySelectorAll('.game-board button'));
const gameBtnsClick = Array.from(document.querySelectorAll('.game-board > button'));
const form = document.querySelector('form');
const messages = document.getElementById('messages');
const msgInput = document.getElementById('msg');
const turnMsg = document.getElementById('turn-message');

form.addEventListener('submit', function(e){
    e.preventDefault();
    sendMessage();
});

socket.on('chat message', function(msg) {
    appendMessage(msg);
});

let myTurn = true, 
             symbol;

function boardState() {
    let boardObj = {}

    gameBtns.map((btn) => {
        boardObj[btn.getAttribute('id')] = btn.innerText || '';
    });
    return boardObj;
}

function gameOver() {
    let state = boardState();

    matches = ['XXX', 'OOO'];

    gameRows = [
        state.a1 + state.a2 + state.a3,
        state.b1 + state.b2 + state.b3,
        state.c1 + state.c2 + state.c3,
        state.a1 + state.b1 + state.c1,
        state.a2 + state.b2 + state.c2,
        state.a3 + state.b3 + state.c3,
        state.a1 + state.b2 + state.c3,
        state.a3 + state.b2 + state.c1,
    ]

    for(let i=0; i < gameRows.length; i++) {
        if(gameRows[i] === matches[0] || gameRows[i] === matches[1]) {
            return true;
        }
    }
}

function broadcastTurn() {
    if(!myTurn){
        turnMsg.innerText = 'Opponent\'s turn!';
        gameBtns.map((btn) => {
            return btn.setAttribute('disabled', true);
        });
    } else {
        turnMsg.innerText = 'Your turn!';
        gameBtns.map((btn) => {
            return btn.removeAttribute('disabled');
        });
    }
}

function makeMove(e) {
    e.preventDefault();

    if (!myTurn) {
        return;
    }

    if (this.innerText.length) {
        return;
    }

    socket.emit('makeMove', {
        symbol: symbol,
        position: this.getAttribute('id')
    });
}

socket.on('moveMade', function(data){
    document.querySelector('#' + data.position).innerText = data.symbol; 
    myTurn = (data.symbol !== symbol);

    if (!gameOver()){
        broadcastTurn();
    } else {
        if (myTurn){
            turnMsg.innerText = 'Game Over. You Lose!';
        } else {
            turnMsg.innerText = 'Game Over. You Win!';
        }
        gameBtns.map((btn) => {
            return btn.setAttribute('disabled', true);
        });
    }
});

socket.on('beginGame', function(data){
    symbol = data.symbol;
    myTurn = (symbol === 'X');
    broadcastTurn();
});

socket.on('opponentLeft', function(data){
    turnMsg.innerText = 'Your opponent has left the game 😢';
    gameBtns.map((btn) => {
        return btn.setAttribute('disabled', true);
    });
});

// 
const appendMessage = function(msg) {
    let li = document.createElement("li");
    li.appendChild(document.createTextNode(msg));
    messages.appendChild(li);
    window.scrollTo(0, document.body.scrollHeight);
};

const sendMessage = function() {
    socket.emit('chat message', msgInput.value);
    msgInput.value = '';
};
//
(function(){
    gameBtns.map((btn) => {
        return btn.setAttribute('disabled', true);
    });
    gameBtnsClick.forEach(function(btn){
        btn.addEventListener('click', makeMove);
    });
})();
      