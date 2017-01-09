const config = require('config');
const mysql = require('mysql2/promise');

let pool = mysql.createPool(config.db_config);

module.exports = pool;
