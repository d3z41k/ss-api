async function amoQuery(pool, tableName, params) {
  return new Promise(async(resolve, reject) => {

    let values = [];

    try {

      for (let t = 0; t < params[3].length; t++) {
        values.push([]);
        for (let i = 0; i < params[0].length; i++) {
          values[t].push([]);

          await pool.execute('SELECT SUM(`Сумма итого руб`), `Дата` FROM '+ tableName +' WHERE ' +
              '`Проекты AMO` = ? ' +
              'AND `Контрагент AMO` = ? ' +
              'AND `Направление деятельноcти` = ? ' +
              'AND `Статья движения денег` = ?', [
                params[0][i].trim(),
                params[1][i],
                params[2][i],
                params[3][t]
              ])
            .then(([col, feilds]) => {
              for (let key in col[0]) {
                values[t][i].push(col[0][key] ? col[0][key] : '');
              }

            })
            .catch(console.log);
        }
      }

    } catch (e) {
      reject(e.stack)
    } finally {
      resolve(values);
    }

  });
}

module.exports = amoQuery;
