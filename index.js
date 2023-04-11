const express = require('express');
const app = express();
const fs = require('fs');

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
    "Empty Net",
    "Delayed Penalty",
    "",
    "",
    "",
    "",
    "",
    ""
];

let gameData;
let prevGameData;

fs.readFile('./config.json', 'utf8', (error, data) => {
    try{
        if(error) throw error;

        gameData = JSON.parse(data);
        prevGameData = {...gameData};

    }catch(err){
        console.error(error);
        gameData = getGameData();
    } 
})

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

    socket.on("stopTimer", (arg) => {
        console.log(arg);
        updateGameTime(arg);
        //saveGameData(gameData)
        io.to("client").emit("stopTimer", arg);
    });

    socket.on("startTimer", (arg) => {
        console.log(arg);
        updateGameTime(arg);
        //saveGameData(gameData)
        io.to("client").emit("startTimer", arg);
    });

    socket.on("displayMessage", (arg) => {
        console.log(arg);
        io.to("client").emit("displayMessage", arg);
    });

    socket.on("clientJoin", (arg) => {
        console.log("Client Joined");

        socket.join("client");

        let gameData = getGameData();

        io.to("client").emit("clientUpdate", gameData);

    });

    socket.on("adminJoin", (arg) => {
        console.log("Admin Joined", arg);

        socket.join("admin");
        let gameData = getGameData();

        io.to("admin").emit("adminUpdate", gameData);
    });

    socket.on("adminUpdate", (updatedData) => {

        gameData = parseUpdate(updatedData);
        io.to("client").emit("clientUpdate", gameData);
    });

    socket.on("adminScoreUpdate", (scoreData) => {
        console.log("adminScoreUpdate");
        Object.assign(gameData, scoreData);
        io.to("client").emit("clientScoreUpdate", scoreData);
    });

    socket.on("adminShotsUpdate", (shotsData) => {
        console.log("adminShotsUpdate")
        Object.assign(gameData, shotsData);
        io.to("client").emit("clientShotsUpdate", shotsData);
    });

});

function parseUpdate(updatedData){
    
    const {homeTeam="T1", homeScore=0, homeShots=0, homeExtra="", guestTeam="T2", guestScore=0, guestShots=0, guestExtra="", homeColour, guestColour, period, time} = updatedData;

    let newGameData = {homeTeam, homeScore, homeShots, homeExtra, guestTeam, guestScore, guestShots, guestExtra, homeColour, guestColour, period, time};

    return newGameData;
}

function saveGameData(gameData){
    let fd = 0;
    try {
        console.log("saveGameData")
        // Simple comparison to see if the data has changed
        let gameDataJSON = JSON.stringify(gameData);
        let prevGameDataJSON = JSON.stringify(prevGameData);

        console.log(gameDataJSON);
        console.log(prevGameDataJSON);
        console.log(gameDataJSON === prevGameDataJSON);

        if(gameDataJSON === prevGameDataJSON) return;

        console.log("saveGameData", "Data Changed");

        fd = fs.writeFileSync(
            __dirname + '/config.json', 
            gameDataJSON, 
            {}, 
            (err)=>{
                throw("Cannot write to config");
            });
        //file written successfully, update prevGameData
        prevGameData = {...gameData};
    } catch (err) {
        logger.error(`UpdateConfig ${err}`)
    } finally {
        if ( fd )
          fs.closeSync(fd);
     }
}

function getGameData(){
    if(gameData && typeof gameData === 'object'){
        return gameData;
    } else{
        return {
            period:"1",
            time:"0",
            homeTeam: "T1",
            homeScore: 0,
            homeShots: 0,
            homeExtra: "",
            guestTeam: "T2",
            guestScore: 0,
            guestShots: 0,
            guestExtra: "",
            guestColour: "",
            homeColour: ""
        };
    } 
}

function updateGameTime(time){
    //let timeStr = convertTimeToString(time);
    gameData.time = time;
}

setInterval(()=>{
    saveGameData(gameData);
},30000);

let port = 3006;

server.listen(port, ()=>{
    console.log(`Server is running at port ${port}...`);
    //socketServer = io.startSocketServer(server);
});