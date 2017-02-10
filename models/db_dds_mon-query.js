async function dds_monQuery(pool, tableName, params, mode) {
  return new Promise(async (resolve, reject) => {

    let values = [];

    if (mode) {
      try {

        for (var d = 0; d < params[3].length; d++) {
          values.push([]);
          for (let i = 0; i < params[2].length; i++) {
            values[d].push([]);
            await pool.execute('SELECT SUM(`Сумма итого руб`) FROM '+ tableName +' WHERE ' +
                '`Направление группа` = ? ' +
                'AND `Месяц` = ? ' +
                'AND `Статья движения денег` = ? ' +
                'AND `Декада` = ?', [
                  params[0][0],
                  params[1][0],
                  params[2][i],
                  params[3][d],
                ])
              .then(([col, feilds]) => {
                for (let key in col[0]) {
                  values[d][i].push(col[0][key] ? col[0][key] : '');
                }

              })
              .catch(console.log);
          }
        }

      } catch (e) {
        reject(e.stack)
      }

    } else {

      try {

        for (let i = 0; i < params[2].length; i++) {
          values.push([]);
          await pool.execute('SELECT SUM(`Сумма итого руб`) FROM '+ tableName +' WHERE ' +
              '`Направление группа` = ? ' +
              'AND `Месяц` = ? ' +
              'AND `Статья движения денег` = ?', [
                params[0][0],
                params[1][0],
                params[2][i],
              ])
            .then(([col, feilds]) => {
              for (let key in col[0]) {
                values[i].push(col[0][key] ? col[0][key] : '');
              }

            })
            .catch(console.log);
        }

      } catch (e) {
        reject(e.stack)
      }

    }

    resolve(values);

  });
}

module.exports = dds_monQuery;
