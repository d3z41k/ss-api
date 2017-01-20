async function domainQuery(pool, tableName, params) {
  return new Promise(async(resolve, reject) => {

  let values = [];

  try {

    for (let d = 0; d < params[2].length; d++) {
      values.push([]);
      for (let a = 0; a < params[3].length; a++) {
        values[d].push([]);
        for (let i = 0; i < params[0].length; i++) {
          values[d][a].push([]);

          await pool.execute('SELECT SUM(`Сумма итого руб`) FROM '+ tableName +' WHERE ' +
              '`Проекты домены и хостинги` = ? ' +
              'AND `Контрагент Домены и Хостинги` = ? ' +
              'AND `Направление деятельноcти` = ? ' +
              'AND `Статья движения денег` = ? ' +
              'AND `Месяц` = ?', [
                params[0][i],
                params[1][i],
                params[2][d],
                params[3][a],
                params[4]
              ])
            .then(([col, feilds]) => {
              for (let key in col[0]) {
                values[d][a][i].push(col[0][key] ? col[0][key] : 0);
              }
            })
            .catch(console.log);
          }
        }
      }

  } catch (e) {
    reject(e.stack)
  } finally {
    resolve(values);
  }

  });
}

module.exports = domainQuery;
