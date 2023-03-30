const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);

//const { Server } = require("socket.io");
const io = require("socket.io")(server, {
    cors: {
        origins: ['http://localhost:4200']
    }
});

const extras = [
    "Power Play",
    "2 Man Advantage",
    "Goalie Pulled",
    "Delayed Penalty",
    "",
    "",
    "",
    "",
    "",
    ""
];

let gameData = {
    homeTeam: "New T1",
    homeScore: 0,
    homeShots: 0,
    homeExtra: "",
    guestTeam: "New T2",
    guestScore: 0,
    guestShots: 0,
    guestExtra: "",
};

        /*
        let min = 0;
        let max = 10;
        setInterval(()=>{
            // console.log("Send Client Update")

            // let gameData = {
            //     homeTeam: "KIN",
            //     homeScore: Math.floor((Math.random() * (max-min + 1)) + min),
            //     homeShots:Math.floor((Math.random() * (max-min + 1)) + min),
            //     homeExtra: extras[Math.floor((Math.random() * (max-min + 1)) + min)],
            //     guestTeam: "WLC",
            //     guestScore: Math.floor((Math.random() * (max-min + 1)) + min),
            //     guestShots:Math.floor((Math.random() * (max-min + 1)) + min),
            //     guestExtra: extras[Math.floor((Math.random() * (max-min + 1)) + min)],
            // }
            
        },5000);
        */

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', socket => {

    console.log("Socket User Connected");
    console.log(socket.id);

    //socket.to(socket.id).emit("New User Connected","Yes!");
    socket.on('disconnect', () => {
        console.log("Client disconnected");
    });

    socket.on("updateGameData", (arg) => {

    });

    socket.on("pauseTimer", (arg) => {

    });

    socket.on("resumeTimer", (arg) => {

    });

    socket.on("clientJoin", (arg) => {
        console.log("Client Joined");

        socket.join("client");

        io.to("client").emit("clientUpdate", gameData);

    });

    socket.on("adminJoin", (arg) => {
        console.log("Admin Joined", arg);

        socket.join("admin");

        io.to("admin").emit("testing", "testing");
        io.to("admin").emit("adminUpdate", gameData);
    });

    socket.on("adminUpdate", (updatedData) => {

        gameData = parseUpdate(updatedData);

        io.to("client").emit("clientUpdate", gameData);
    });

});

function parseUpdate(updatedData){
    const {homeTeam="T1", homeScore=0, homeShots=0, homeExtra="", guestTeam="T2", guestScore=0, guestShots=0, guestExtra=""} = updatedData;

    let newGameData = {homeTeam, homeScore, homeShots, homeExtra, guestTeam, guestScore, guestShots, guestExtra};

    return newGameData;
}


let port = 3006;

server.listen(port, ()=>{
    console.log(`Server is running at port ${port}...`);
    //socketServer = io.startSocketServer(server);
});