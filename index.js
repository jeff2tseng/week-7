const express = require("express");
const { Pool } = require("pg");
const { createClient } = require("redis");
require("dotenv").config();

const config = {
  host: process.env.PSQL_HOSTNAME,
  user: process.env.PSQL_USERNAME,
  password: process.env.PSQL_PASSWD,
  database: process.env.PSQL_DB,
  port: 5432,
  ssl: true,
};

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool(config);

let redisConnected = false;
const cacheHostName = process.env.REDISCACHEHOSTNAME;
const cachePassword = process.env.REDISCACHEKEY;
const cacheConnection = createClient({
  url: "rediss://" + cacheHostName + ":6380",
  password: cachePassword,
});
const setupRedis = async () => {
  if (!redisConnected) {
    await cacheConnection.connect();
    redisConnected = true;
  }
  return cacheConnection;
};

let isDirty = true;

app.get("/", (req, res) => {
  res
    .writeHead(301, {
      Location: "https://www.twitch.tv/never_loses",
    })
    .end();
});

const getHistory = async () => {
  try {
    const queryResult = await pool.query(
      `SELECT * FROM azure_table \
        ORDER BY timestamp DESC \
        LIMIT 5
        `
    );

    let responseString = queryResult["rows"]
      .map((row) => `${row.num1} + ${row.num2} = ${row.sum}`)
      .join("\n");
    console.log(responseString);
    return responseString;
  } catch (err) {
    console.error(err);
  }
};

app.get("/hist_log", async (req, res) => {
  const client = await setupRedis();
  const cachedValue = await client.get("cache");
  if (isDirty || !cachedValue) {
    const responseString = await getHistory();
    if (responseString === undefined) res.sendStatus(400);
    await client.set("cache", responseString);
    console.log("from source data");
    res.send(responseString);
    isDirty = false;
  } else {
    console.log("from cached data");
    res.send(cachedValue);
  }
});

app.post("/calculator", (req, res) => {
  try {
    if (req.query.num1 === undefined || req.query.num2 === undefined)
      throw "invalid input";
    let num1 = parseInt(req.query.num1);
    let num2 = parseInt(req.query.num2);
    res.end(`${num1 + num2}`);
    pool
      .query(
        `INSERT INTO azure_table \
        ( num1, num2, sum, timestamp ) VALUES \
        ( ${num1}, ${num2}, ${num1 + num2}, NOW() )`
      )
      .then((res) => console.log(res))
      .catch((err) => console.error(err));
    isDirty = true;
  } catch (e) {
    console.error(e);
  }
});

app.listen(port, async () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);

  setupRedis().then(() => console.log("Redis connection set!"));
  pool
    .query(
      "CREATE TABLE IF NOT EXISTS azure_table \
        ( id BIGSERIAL NOT NULL PRIMARY KEY, \
            num1 BIGINT, \
            num2 BIGINT, \
            sum BIGINT, \
            timestamp TIMESTAMP \
        )"
    )
    .then(() => console.log("Table created!"));

  pool
    .query(`SELECT * FROM azure_table`)
    .then((queryResult) => {
      let responseString = queryResult["rows"]
        .map((row) => `${row.num1} + ${row.num2} = ${row.sum}`)
        .join("\n");
      console.log(responseString);
    })
    .catch((err) => console.error(err));
});
