const { response } = require("express");
const express = require("express");
const { Pool, Client } = require("pg");

const config = {
  host: "localhost",
  user: "nl",
  password: "1213",
  database: "azure",
  port: 5432,
};

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool(config);

app.get("/", (req, res) => {
  res.send("Please go to https://www.twitch.tv/never_loses");
});

app.get("/hist_log", (req, res) => {
  pool
    .query(
      `SELECT * FROM azure_table \
        ORDER BY timestamp DESC \
        LIMIT 5
        `
    )
    .then((queryResult) => {
      let responseString = queryResult["rows"]
        .map((row) => `${row.num1} + ${row.num2} = ${row.sum}`)
        .join("\n");
      console.log(responseString);
      res.end(responseString);
    })
    .catch((err) => console.error(err));
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
  } catch (e) {
    res.sendStatus(400);
  }
});

app.listen(port, async () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
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
});
