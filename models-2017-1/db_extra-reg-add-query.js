async function extraRegAddQuery(pool, tableName, params, CREW) {
  return new Promise(async (resolve, reject) => {

  let values = [];

  try {

    for (let m = 0; m < params[0].length; m++) {
      values.push([]);
      for (let a = 0; a < params[1].length; a++) {
        values[m].push([]);
        for (let i = 0; i < params[2].length; i++) {
          await pool.execute('SELECT SUM(`Сумма итого руб`) FROM ' + tableName + ' WHERE ' +
              '`Месяц` = ? ' +
              'AND `Статья движения денег` = ? ' +
              'AND `Проекты Доп работы` = ? ' +
              'AND `Контрагент Доп работы` = ?', [
                params[0][m],
                params[1][a],
                params[2][i],
                params[3][i]
              ])
            .then(([col, feilds]) => {
              for (let key in col[0]) {
                values[m][a].push(col[0][key] ? col[0][key] : 0);
                for (let i = 0; i < CREW; i++) {
                  values[m][a].push(null);
                }
              }
            })
            .catch(console.log);
        }
      }
    }

  } catch (e) {
    reject(e.stack);
  }

  resolve(values);

  });
}

module.exports = extraRegAddQuery;
