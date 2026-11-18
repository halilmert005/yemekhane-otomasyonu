const mysql = require('mysql2/promise');
const env = require('./env');

const ortakAyarlar = {
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  charset: 'utf8mb4',
  timezone: '+03:00',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
};

// Yazma işlemleri ve stored procedure çağrıları kaynak sunucuya gider
const yazmaHavuzu = mysql.createPool({
  ...ortakAyarlar,
  host: env.db.yazmaHost,
});

// Listeleme ve okuma sorguları replikaya gider
const okumaHavuzu = mysql.createPool({
  ...ortakAyarlar,
  host: env.db.okumaHost,
});

async function baglantiKontrol() {
  await yazmaHavuzu.query('SELECT 1');
  await okumaHavuzu.query('SELECT 1');
}

module.exports = {
  yazmaHavuzu,
  okumaHavuzu,
  baglantiKontrol,
};
