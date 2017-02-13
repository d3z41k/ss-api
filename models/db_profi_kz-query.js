async function dds_monQuery(pool, tableName, params) {
  return new Promise(async (resolve, reject) => {

    let values = [];

      try {

      for (var a = 0; a < params[2].length; a++) {
        values.push([]);
        for (let m = 0; m < params[0].length; m++) {
          values[a].push([]);
          await pool.execute('SELECT SUM(`Сумма итого руб`) FROM '+ tableName +' WHERE ' +
              '`Месяц` = ? ' +
              'AND `Направление деятельноcти` = ? ' +
              'AND `Статья движения денег` = ?', [
                params[0][m],
                params[1][0],
                params[2][a],
              ])
            .then(([col, feilds]) => {
              for (let key in col[0]) {
                values[a][m].push(col[0][key] ? col[0][key] : '');
              }

            })
            .catch(console.log);
        }
      }

    } catch (e) {
      reject(e.stack)
    }

    resolve(values);

  });
}

module.exports = dds_monQuery;
