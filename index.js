const express = require('express');
const app = express();
const fs = require('fs');

const http = require('http');
const server = http.createServer(app);

let players = [];
let teams = [];

app.use(function(req,res,next){
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');

    next();
});

//const { Server } = require("socket.io");
const io = require("socket.io")(server, {
    cors: {
        origins: ['http://localhost:4200']
    }
});

const MongoClient = require("./conn");
let mongoClient;
MongoClient.connect().then(({client,db})=>{
    mongoClient = client;

    getTeamAndPlayerData();
});

async function getTeamAndPlayerData(){
    const db = mongoClient.db("scorebug");
        
    const pCollection = await db.collection("players");
    players = await pCollection.find({}).toArray() || [];

    const tCollection = await db.collection("teams");
    teams = await tCollection.find({}).toArray() || [];
}

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

app.get('/getPlayers', async (req, res) => {
    try{
        const db = mongoClient.db("scorebug");
        
        const collection = await db.collection("players");
        const results = await collection.find({}).toArray() || [];

        res.send(results).status(200);
    }catch(err){
        console.error(err);       
        res.send(results).status(400);
    }
});

app.get('/getTeams', async (req, res) => {
    try{
        const db = mongoClient.db("scorebug");
        
        const collection = await db.collection("teams");
        const results = await collection.find({}).toArray() || [];

        res.send(results).status(200);
    }catch(err){
        console.error(err);       
        res.send(results).status(400);
    }
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

        console.log("adminUpdate");

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
    
    const {gameTitle="", homeTeam="T1", homeScore=0, homeShots=0, homeExtra="", guestTeam="T2", guestScore=0, guestShots=0, guestExtra="", homeColour, guestColour, period, time, 
    guestTeamAbvCustom,
    guestTeamNameCustom,
    guestTeamCityCustom,
    homeTeamAbvCustom,
    homeTeamNameCustom,
    homeTeamCityCustom
    } = updatedData;

    let newGameData = {gameTitle, homeTeam, homeScore, homeShots, homeExtra, guestTeam, guestScore, guestShots, guestExtra, homeColour, guestColour, period, time, guestTeamNameCustom, guestTeamCityCustom, homeTeamNameCustom, homeTeamCityCustom};

    if(homeTeam === "Custom"){
        newGameData.homeTeam = homeTeamAbvCustom || "N/A";
    }else{
        if(!homeTeam) newGameData.homeTeam = "N/A";

        let selTeam = teams.find((team)=>{
            return team.teamname === homeTeam;
        });
        if(selTeam){
            newGameData.homeTeam = selTeam.teamname;
        }
    }

    if(guestTeam === "Custom"){
        newGameData.guestTeam = guestTeamAbvCustom || "N/A";
    }else{
        if(!guestTeam) newGameData.guestTeam = "N/A";

        let selTeam = teams.find((team)=>{
            return team.teamname === guestTeam;
        });
        if(selTeam){
            newGameData.guestTeam = selTeam.teamname;
        }
    }

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
            gameTitle:"",
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