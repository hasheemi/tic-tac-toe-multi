var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var fs = require("fs");
var path = require("path");
var http = require("http").Server(app);
var io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
let namaPemain = "";
let namaArr = [];

io.set("heartbeat interval", 1000);
io.set("heartbeat timeout", 5000);

app.use(express.static(path.join(__dirname, "public")));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

var tipeGame; // dapatkan tipe game, random , private atau code
function getTipeGame(query) {
  let key = Object.keys(query);
  tipeGame = key[1];
}

// benampilkan view
app.get("/join", function (req, res) {
  res.sendFile(__dirname + "/views/join.html");
});

app.get("/game", function (req, res) {
  gameQuery = req.query;
  namaPemain = req.query.nama;
  getTipeGame(gameQuery);

  res.sendFile(__dirname + "/views/game.html");
});

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/views/index.html");
});

//buat yang lihat ini , ini hanya akalan karena hosting nya pusing
app.get("/media/:folder/:file", (req, res) => {
  let folder = req.params.folder;
  let file = req.params.file;
  res.sendFile(__dirname + `/public/${folder}/${file}`);
});
function RandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// pilih tanda o atau x untuk player secara acak
function pilihTanda() {
  number = RandomInt(0, 1);
  if (number == 0) {
    pemain = ["X", "O"];
  } else if (number == 1) {
    pemain = ["O", "X"];
  }
  return pemain;
}

//pilih siapa yang main terlebih dulu
function giliranMain() {
  number = RandomInt(0, 1);
  if (number == 0) {
    giliran = [true, false];
  } else if (number == 1) {
    giliran = [false, true];
  }
  return giliran;
}

// cari pemain
function cariPemain(IDpemain) {
  for (var room in papan) {
    for (var i = 0; i < papan[room].length; i++) {
      papan[room][i].id;
      if (IDpemain == papan[room][i].id) {
        return papan[room][i];
      }
    }
  }
}

// cari pemain lain
function cariPemainLain(player) {
  var playerData = papan[player.roomId];

  //console.log("\nGame Rooms:")
  //console.log(papan)

  //console.log("\nRoom ID:")
  //console.log(player.roomId)

  var pemainLain;

  if (playerData[0].playerNumber == player.playerNumber) {
    pemainLain = playerData[1];
  } else if (playerData[1].playerNumber == player.playerNumber) {
    pemainLain = playerData[0];
  }

  return pemainLain;
}

// mencari room yang tersedia
function cariRoom(playerId) {
  for (var room in papan) {
    for (var i = 0; i < papan[room].length; i++) {
      papan[room][i].id;
      if (playerId == papan[room][i].id) {
        return room;
      }
    }
  }
  return false;
}

//mengacak giliran
function acakGiliran(playerData) {
  turn = giliranMain();

  playerData[0].turn = turn[0];
  playerData[1].turn = turn[1];

  return playerData;
}

function getRoomId() {
  return RandomInt(1, 10000);
}

function initStartValues() {
  letters = pilihTanda();
  turn = giliranMain();
  playerData = [];
  usersOn = 1;
  roomId = getRoomId();

  valueList = {
    letters: letters,
    turn: turn,
    playerData: playerData,
    usersOn: usersOn,
    roomId: roomId,
  };

  return valueList;
}

function buangPlayer(playerId) {
  for (var i = 0; i < playerData.length; i++) {
    if (playerId == playerData[i].id) {
      playerData.splice(i, 1);
      return;
    }
  }
}

randomGame = initStartValues();

papan = {};

io.on("connection", function (socket) {
  //console.log("\nConnection")

  if (tipeGame == "random") {
    var joinInfo = {
      id: socket.id,
      roomId: randomGame.roomId,
      playerNumber: randomGame.usersOn,
      letter: randomGame.letters[randomGame.usersOn - 1],
      turn: randomGame.turn[randomGame.usersOn - 1],
      roomType: "random",
      nama: namaPemain || `player ${randomGame.usersOn}`,
    };

    randomGame.playerData.push(joinInfo);

    randomGame.usersOn++;

    socket.emit("playersJoined", joinInfo);

    if (randomGame.usersOn > 2) {
      papan[randomGame.roomId] = randomGame.playerData;
      io.to(randomGame.playerData[0].id).emit("gameStart");
      io.to(randomGame.playerData[1].id).emit("gameStart");
      randomGame = initStartValues();
      socket.emit("mydata", joinInfo);
    }
  } else if (tipeGame == "createPrivate") {
    var privateGame = initStartValues();
    var joinInfo = {
      id: socket.id,
      roomId: privateGame.roomId,
      playerNumber: privateGame.usersOn,
      letter: privateGame.letters[privateGame.usersOn - 1],
      turn: privateGame.turn[privateGame.usersOn - 1],
      roomType: "private",
      gameValues: privateGame,
      nama: namaPemain || `player ${privateGame.usersOn}`,
    };
    socket.emit("playersJoined", joinInfo);

    papan[privateGame.roomId] = [joinInfo];
  } else if (tipeGame == "gameCode") {
    var gameRoomId = Number(gameQuery.gameCode);
    // var gameRoomId = Number(codeid);
    if (papan[gameRoomId] == undefined) {
      socket.emit("gameNotExist", gameRoomId);
    } else {
      var gameValues = papan[gameRoomId][0].gameValues;

      gameValues.usersOn++;

      var joinInfo = {
        id: socket.id,
        roomId: gameValues.roomId,
        playerNumber: gameValues.usersOn,
        letter: gameValues.letters[gameValues.usersOn - 1],
        turn: gameValues.turn[gameValues.usersOn - 1],
        roomType: "private",
        nama: namaPemain || `player ${gameValues.usersOn}`,
      };

      if (papan[gameRoomId].length <= 1) {
        papan[gameRoomId].push(joinInfo);

        socket.emit("playersJoined", joinInfo);
        // console.log(localStorage);
        io.to(papan[gameRoomId][0].id).emit("gameStart");
        io.to(papan[gameRoomId][1].id).emit("gameStart");
        socket.emit("mydata", joinInfo);
      } else if (papan[gameRoomId].length >= 2) {
        socket.emit("overCap", gameRoomId);
      }
    }
  }

  socket.on("winner", function (player) {
    // cari pemenang
    var pemainLain = cariPemainLain(player);

    io.to(player.id).emit("winnerDetermined", { youWon: true, winningLetter: player.letter });
    io.to(pemainLain.id).emit("winnerDetermined", { youWon: false, winningLetter: player.letter });
  });
  socket.on("namapush", (nama) => {
    namaArr.push(nama);
    io.emit("tambah", namaArr);
  });
  socket.on("tie", function (roomId) {
    // seri
    io.to(papan[roomId][0].id).emit("tie");
    io.to(papan[roomId][1].id).emit("tie");
  });

  socket.on("playedMove", function (movePlayed) {
    // saat player mulai bergerak
    var pemainLain = cariPemainLain(movePlayed.player);

    var playerRoom = movePlayed.player.roomId;

    info = {
      boxPlayed: movePlayed.box,
      letter: movePlayed.player.letter,
    };
    io.to(pemainLain.id).emit("yourTurn", info);
    io.to(movePlayed.player.id).emit("otherTurn");
  });

  playersRematch = 0;

  socket.on("restartGame", function (roomId) {
    // restart game
    playersRematch++;
    if (playersRematch == 2) {
      newPlayerData = acakGiliran(papan[roomId]);
      io.to(papan[roomId][0].id).emit("gameRestarted", newPlayerData[0]);
      io.to(papan[roomId][1].id).emit("gameRestarted", newPlayerData[1]);
      playersRematch = 0;
    }
  });

  socket.on("disconnect", function () {
    buangPlayer(socket.id);
    // jika player meninggalkan permainan
    if (!cariRoom(socket.id)) {
      randomGame = initStartValues();
    } else if (!(papan[cariRoom(socket.id)] == undefined)) {
      if (!(papan[cariRoom(socket.id)].length == 1)) {
        var otherPlayerInfo = cariPemain(socket.id);

        if (otherPlayerInfo != null) {
          var pemainLain = cariPemainLain(otherPlayerInfo);
          if (pemainLain) {
            io.to(pemainLain.id).emit("playerDisconnect");
          }
        }
      }
    }
    namaArr = [];
  });
});
// konfigurasi server
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";

var port = process.env.OPENSHIFT_NODEJS_PORT || 4000;

http.listen(4000);
