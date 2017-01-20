async function servQuery(pool, tableName, params) {
  return new Promise(async(resolve, reject) => {

    let values = [];

    try {

      for (let a = 0; a < params[4].length; a++) {
        values.push([]);
        for (let i = 0; i < params[0].length; i++) {
          values[a].push([]);

          await pool.execute('SELECT SUM(`Сумма итого руб`) FROM '+ tableName +' WHERE ' +
              '`Проекты обслуживание` = ? ' +
              'AND `Контрагент Обслуживание` = ? ' +
              'AND `Месяц` = ? ' +
              'AND `Направление деятельноcти` = ? ' +
              'AND `Статья движения денег` = ? ',
              [
                params[0][i],
                params[1][i],
                params[2],
                params[3],
                params[4][a]
              ])
            .then(([col, feilds]) => {
              for (let key in col[0]) {
                values[a][i].push(col[0][key] ? col[0][key] : 0);
              }
            })
            .catch(console.log);
          }
        }


      } catch (e) {
        reject(e.stack);
      } finally {
        resolve(values);
      }

  });
}

module.exports = servQuery;
