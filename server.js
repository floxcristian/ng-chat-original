var http = require("http");
var path = require("path");
var express = require("express");
var bodyParser = require("body-parser");
var formidable = require("formidable");
var fs = require("fs");

var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// Express CORS setup
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

var server = app.listen(3000);

var io = require("socket.io").listen(server);

//var path = __dirname + '/views/';

allConnectedParticipants = []; // [ { participant, metadata } ]
disconnectedParticipants = []; // [ { participant, metadata } ]
allGroupParticipants = []; // chattingTo
participantsConnectionLock = {}; //

app.set("view engine", "vash");

app.use("/Uploads", express.static(path.join(__dirname, "Uploads")));

app.get("*", function (req, res) {
  res.render("index");
});

app.post("/listFriends", (req, res) => {
  const clonedArray = allConnectedParticipants.slice();

  const i = allConnectedParticipants.findIndex(
    (x) => x.participant.id == req.body.userId
  );

  clonedArray.splice(i, 1);
  clonedArray.map((item) => {
    item.participant.participantType = 0;
    return item;
  });
  res.json(clonedArray);
});

app.post("/uploadFile", (req, res) => {
  let form = new formidable.IncomingForm();
  let ngChatDestinataryUserId;

  if (!fs.existsSync("/Uploads")) {
    fs.mkdirSync("/Uploads");
  }

  form
    .parse(req)
    .on("field", function (name, field) {
      // You must always validate this with your backend logic
      if (name === "ng-chat-participant-id") ngChatDestinataryUserId = field;
    })
    .on("fileBegin", function (name, file) {
      file.path = `${__dirname}/Uploads/${file.name}`;
    })
    .on("file", function (name, file) {
      console.log("Uploaded " + file.name);

      // Push socket IO status
      let message = {
        type: 2, // MessageType.File = 2
        //fromId: ngChatSenderUserId, fromId will be set by the angular component after receiving the http response
        toId: ngChatDestinataryUserId,
        message: file.name,
        mimeType: file.type,
        fileSizeInBytes: file.size,
        downloadUrl: `http://localhost:3000/Uploads/${file.name}`,
      };

      console.log("Returning file message:");
      console.log(message);

      res.status(200);
      res.json(message);
    });
});

io.on("connection", (socket) => {
  console.log("[+] A user has connected to the server.");

  socket.on("join", (username) => {
    const newParticipant = {
      participant: {
        displayName: username,
        id: socket.id,
        status: 0,
        participantType: 0,
      },
      metadata: {
        totalUnreadMessages: 0,
      },
    };
    allConnectedParticipants.push(newParticipant);
    console.table(allConnectedParticipants);

    socket.broadcast.emit("friendsListChanged", allConnectedParticipants);
    socket.emit("generatedUserId", socket.id);
    console.log(`[+] '${username}' has joined the chat room.`);

    socket.on("disconnect", () => {
      console.log("[+] User disconnected.");

      const i = allConnectedParticipants.findIndex(
        (x) => x.participant.id == socket.id
      );
      allConnectedParticipants.splice(i, 1);
      socket.broadcast.emit("friendsListChanged", allConnectedParticipants);
    });
  });

  socket.on("sendMessage", (message) => {
    console.log("[+] Send message: ");
    console.table(message);

    const sender = allConnectedParticipants.find(
      (x) => x.participant.id == message.fromId
    );

    if (sender != null) {
      const groupDestinatary = allGroupParticipants.find(
        (x) => x.id == message.toId
      );

      if (groupDestinatary != null) {
        console.log("groupDestinatary: ", groupDestinatary);
        // Notificar a todos los usuarios excepto al emisor
        const usersInGroupToNotify = allConnectedParticipants
          .filter(
            (p) =>
              p.participant.id != sender.participant.id &&
              groupDestinatary.chattingTo.some((g) => g.id == p.participant.id)
          )
          .map((g) => {
            console.log("participante a notificar: ", g);
            return g.participant.id;
          });

        console.log("usersInGroupToNotify: ", usersInGroupToNotify);
        socket.broadcast.emit("messageReceived", {
          user: groupDestinatary,
          message: message,
        });
      } else {
        io.to(message.ToId).emit("messageReceived", {
          user: sender.participant,
          message: message,
        });
      }
    }
  });

  socket.on("groupCreated", (group) => {
    console.log("[+] Group created.");
    console.log(group);
    allGroupParticipants.push(group);
    const newChatParticipant = { id: socket.id };
    group.chattingTo.push(newChatParticipant);

    const newParticipant = {
      participant: group,
      metadata: { TotalUnreadMessages: 0 },
    };
    allConnectedParticipants.push(newParticipant);
    console.log("[-] allConnectedParticipants:");
    console.table(allConnectedParticipants);
    socket.broadcast.emit("friendsListChanged", allConnectedParticipants);
  });
});
