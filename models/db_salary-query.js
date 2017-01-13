async function salaryQuery(pool, tableName, params, mode) {
  return new Promise(async(resolve, reject) => {

    let sum = [];

    try {
      if (mode) {

        for (let i = 0; i < params[0].length; i++) {
          await pool.execute('SELECT SUM(`Сумма итого руб`) FROM ' + tableName + ' WHERE ' +
            '`Сотрудник` = ? ' +
            'AND `Статья движения денег` = ? ' +
            'AND `Месяц` = ? ',
            [
              params[0][i],
              params[1][i],
              params[2]
            ])
          .then(([col, feilds]) => {
            for (let key in col[0]) {
              sum.push([col[0][key] ? col[0][key] : 0]);
            }
          })
          .catch(err => {
            console.log(err)
          });
        }

      } else {

        for (let d = 0; d < params[3].length; d++) {
          sum.push([]);
          for (let i = 0; i < params[0].length; i++) {
            await pool.execute('SELECT SUM(`Сумма итого руб`) FROM ' + tableName + ' WHERE ' +
              '`Сотрудник` = ? ' +
              'AND `Статья движения денег` = ? ' +
              'AND `Месяц` = ? ' +
              'AND `Направление группа` = ? ',
              [
                params[0][i],
                params[1][i],
                params[2],
                params[3][d]
              ])
            .then(([col, feilds]) => {
              for (let key in col[0]) {
                sum[d].push([col[0][key] ? col[0][key] : 0]);
              }
            })
            .catch(err => {
              console.log(err)
            });
          }
        }

      }
    } catch (e) {
      reject(e.stack);
    } finally {
      resolve(sum);
    }
  });
}

module.exports = salaryQuery;
