const pool = require("../config/db");

async function getCashByDate(date) {

    const { rows } = await pool.query(
        `SELECT cash
         FROM trade_guardian_history
         WHERE recorded_on <= $1
         ORDER BY recorded_on DESC
         LIMIT 1`,
        [date]
    );

    return rows.length
        ? Number(rows[0].cash)
        : null;
}

async function updateCash(date, cash) {

    await pool.query(
        `INSERT INTO trade_guardian_history
            (recorded_on, cash)
         VALUES ($1, $2)
         ON CONFLICT (recorded_on)
         DO UPDATE SET cash = EXCLUDED.cash`,
        [date, cash]
    );
}

module.exports = {
    getCashByDate,
    updateCash
};
