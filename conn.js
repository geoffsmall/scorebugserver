//import { MongoClient } from "mongodb";

var MongoClient = require('mongodb').MongoClient
/*
const connectionString = process.env.ATLAS_URI || "mongodb://localhost:27017";
const client = new MongoClient(connectionString);
let conn;
let db;
try {
  conn = client.connect();
  const db = conn.db("scorebug");
} catch(e) {
  console.error(e);
}


module.exports = db;
*/
const connectionString = process.env.ATLAS_URI || "mongodb://localhost:27017";

const mongoClient = new MongoClient(connectionString);

let client;

async function connect() {
    if (!client) {
        client = await mongoClient.connect()
        .catch(err => { console.log(err); });

        //client.on('commandStarted', started => console.log(started));

        const db = client.db("scorebug");

        return {client, db};
    }
    
}

const getConectedClient = () => client;  

const testConnection = connect()
    .then((connection) => console.log(connection)); // call the function like this

module.exports = { connect, getConectedClient };