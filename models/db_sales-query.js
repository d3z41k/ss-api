async function devQuery(pool, tableName, params) {
  return new Promise(async(resolve, reject) => {

    let values = [];

    try {

      for (let i = 0; i < params[0].length; i++) {
        values.push([]);
        await pool.execute('SELECT SUM(`Сумма итого руб`), `Дата` FROM '+ tableName +' WHERE ' +
            '`Проект Отдел продаж` = ? ' +
            'AND `Контрагент Отдел продаж` = ? ' +
            'AND `Направление деятельноcти` = ? ' +
            'AND `Статья движения денег` = ?', [
              params[0][i],
              params[1][i],
              params[2][i],
              params[3]
            ])
          .then(([col, feilds]) => {
            for (let key in col[0]) {
              values[i].push(col[0][key] ? col[0][key] : '');
            }

          })
          .catch(console.log);
        }

      } catch (e) {
        reject(e.stack);
      } finally {
        resolve(values);
      }

  });
}

module.exports = devQuery;
