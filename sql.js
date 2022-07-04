const { Pool, Client } = require("pg");

const config = {
    host: 'localhost',
    user: 'nl',
    password: '1213',
    database: 'azure',
    port: 5432,
};

// Connect with a connection pool.

const poolDemo = async () => {
    const pool = new Pool(config);
    const create = await query(pool,
        "CREATE TABLE IF NOT EXISTS azure_table \
        ( id BIGSERIAL NOT NULL PRIMARY KEY, \
            num1 BIGINT, \
            num2 BIGINT, \
            sum BIGINT \
        )");
    console.log(create);

    const now = await query(pool,
        "SELECT * FROM azure_table \
        ");
    await pool.end();

    return now;
}

const query = async (pool, query) => {
    return await pool.query(query);
}

// Use a self-calling function so we can use async / await.

(async () => {
    const poolResult = await poolDemo();
    console.log("Time with pool: " + poolResult.rows[0]["now"]);
})();