import dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import http from 'http';
import { Client, Configuration } from 'ts-postgres';
// const { Client, Configuration } = require('pg');

dotenv.config();

const app: Express = express();
const httpServer = http.createServer(app);
const port = parseInt(process.env.PORT ?? "3000");

app.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server');
});

app.post('/calculator', (req, res) => {
    try {
        if (req.query.num1 === undefined || req.query.num2 === undefined)
            throw 'invalid input';
        let num1: number = parseInt(req.query.num1 as string);
        let num2: number = parseInt(req.query.num2 as string);
        res.end(`${num1 + num2}`)
    } catch (e) {
        res.sendStatus(400);
    }
});

const queryDatabase = (client: Client, query: string) => {
    client
        .query(query)
        .then((result: any) => {
            console.log('Update completed');
            console.log(result);
            // console.log(`Rows affected: ${result.rowCount}`);
        })
        .catch((err: any) => {
            console.log(err);
        });
}

httpServer.listen(port, async () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
    const config = {
        host: 'localhost',
        user: 'nl',
        password: '1213',
        database: 'azure',
        port: 5432,
        ssl: false
    } as Configuration;
    const SQLClient = new Client(config);
    try {
        SQLClient.connect();
        console.log("connected to PostgreSQL");
        queryDatabase(SQLClient, 'SELECT NOW()');
        await SQLClient.end();
    } catch (e) {
        console.log(e);
    }

});