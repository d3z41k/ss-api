async function salaryQuery(pool, tableName, params) {
  return new Promise(async (resolve, reject) => {

    let sum = [];

    try {

        for (let dec = 0; dec < params[4].length; dec++) {
          sum.push([]);
          for (let d = 0; d < params[3].length; d++) {
            sum[dec].push([]);
            for (let i = 0; i < params[0].length; i++) {
              await pool.execute('SELECT SUM(`Сумма итого руб`) FROM ' + tableName + ' WHERE ' +
                '`Сотрудник` = ? ' +
                'AND `Статья движения денег` = ? ' +
                'AND `Месяц` = ? ' +
                'AND `Направление группа` = ? ' +
                'AND `Декада` = ? ',
                [
                  params[0][i],
                  params[1][i],
                  params[2],
                  params[3][d],
                  params[4][dec]
                ])
              .then(([col, feilds]) => {
                for (let key in col[0]) {
                  sum[dec][d].push(col[0][key] ? col[0][key] : 0);
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
