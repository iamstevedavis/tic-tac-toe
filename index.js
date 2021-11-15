const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const port = process.env.PORT || 3000;

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/public'));
});

app.use(express.static('public'));

let players = {},
    unmatched;

function joinGame(socket) {
    players[socket.id] = {
        opponent: unmatched,
        symbol: 'X',
        socket: socket
    };
    if (unmatched) {
        players[socket.id].symbol = 'O',
        players[unmatched].opponent = socket.id,
        unmatched = null
    } else {
        unmatched = socket.id;
    }
}

function getOpponent(socket) {
    if (!players[socket.id].opponent) {
        return;
    }
    return players[
        players[socket.id].opponent
    ].socket;
}

io.on('connection', function(socket){
    socket.on('chat message', function (msg) {
        io.emit('chat message', msg);
    });

    joinGame(socket);

    if(getOpponent(socket)){
        socket.emit('beginGame', {
            symbol: players[socket.id].symbol
        });
        getOpponent(socket).emit('beginGame', {
            symbol: players[getOpponent(socket).id].symbol
        });
    }
    socket.on('makeMove', function(data){
        if(!getOpponent(socket)){
            return;
        }
        socket.emit('moveMade', data);
        getOpponent(socket).emit('moveMade', data);
    });
    socket.on('disconnect', function () {
        if (getOpponent(socket)) {
            getOpponent(socket).emit('opponentLeft');
        }
    });
});

http.listen(port, function(){
    console.log('listening on *:' + port);
});



