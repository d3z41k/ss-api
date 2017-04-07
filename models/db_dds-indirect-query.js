async function dds_indirectQuery(pool, tableName, params, mode, taxes) {
  return new Promise(async (resolve, reject) => {

    let sum = [];

    try {
      switch (mode) {

        case '2.1':

          for (let dec = 0; dec < params[mode][4].length; dec++) {
            sum.push([]);
            for (let d = 0; d < params[mode][3].length; d++) {
              sum[dec].push([]);
              for (let i = 0; i < params[mode][1].length; i++) {
                await pool.execute('SELECT SUM(`Сумма итого руб`) FROM ' + tableName + ' WHERE ' +
                  '`Месяц` = ? ' +
                  'AND `Статья движения денег` = ? ' +
                  'AND `Направление группа` = ? ' +
                  'AND `Декада` = ? ',
                  [
                    params[mode][0],
                    params[mode][1][i],
                    params[mode][3][d],
                    params[mode][4][dec]

                  ])
                .then(([col, feilds]) => {
                  for (let key in col[0]) {
                    sum[dec][d].push(col[0][key] ? col[0][key] : 0);
                  }
                })
                .catch(err => {
                  console.log(err);
                });
              }
            }
          }

          return;

        case '2.2':

          for (let dec = 0; dec < params[mode][4].length; dec++) {
            sum.push([]);
            for (let d = 0; d < params[mode][3].length; d++) {
              sum[dec].push([]);
              for (let i = 0; i < params[mode][1].length; i++) {
                if (!taxes.includes(params[mode][1][i])) {
                  await pool.execute('SELECT SUM(`Сумма итого руб`) FROM ' + tableName + ' WHERE ' +
                    '`Месяц` = ? ' +
                    'AND `Статья движения денег` = ? ' +
                    'AND `Прочие выплата расшифровка` = ? ' +
                    'AND `Направление группа` = ? ' +
                    'AND `Декада` = ? ',
                    [
                      params[mode][0],
                      params[mode][1][i],
                      params[mode][2][i],
                      params[mode][3][d],
                      params[mode][4][dec]
                    ])
                  .then(([col, feilds]) => {
                    for (let key in col[0]) {
                      sum[dec][d].push(col[0][key] ? col[0][key] : 0);
                    }
                  })
                  .catch(err => {
                    console.log(err);
                  });
                } else {
                  sum[dec][d].push(0);
                }

              }
            }
          }

          return;

        case '2.3':

          for (let dec = 0; dec < params[mode][4].length; dec++) {
            sum.push([]);
            for (let d = 0; d < params[mode][3].length; d++) {
              sum[dec].push([]);
              for (let i = 0; i < params[mode][1].length; i++) {
                await pool.execute('SELECT SUM(`Сумма итого руб`) FROM ' + tableName + ' WHERE ' +
                  '`Месяц` = ? ' +
                  'AND `Статья движения денег` = ? ' +
                  'AND `Компания` = ? ' +
                  'AND `Направление группа` = ? ' +
                  'AND `Декада` = ? ',
                  [
                    params[mode][0],
                    params[mode][1][i],
                    params[mode][2][i],
                    params[mode][3][d],
                    params[mode][4][dec]
                  ])
                .then(([col, feilds]) => {
                  for (let key in col[0]) {
                    sum[dec][d].push(col[0][key] ? col[0][key] : 0);
                  }
                })
                .catch(err => {
                  console.log(err);
                });
              }
            }
          }

          return;

      } //switch

    } catch (e) {
      reject(e.stack);
    } finally {
      resolve(sum);
    }
  });
}

module.exports = dds_indirectQuery;
