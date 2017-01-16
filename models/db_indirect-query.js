async function indirectQuery(pool, tableName, params, mode) {
  return new Promise(async(resolve, reject) => {

    let sum = [];

    try {
      switch (mode) {

        case '1.1':

          for (let i = 0; i < params[mode][1].length; i++) {
            await pool.execute('SELECT SUM(`Сумма итого руб`) FROM ' + tableName + ' WHERE ' +
              '`Месяц` = ? ' +
              'AND `Статья движения денег` = ? ',
              [
                params[mode][0],
                params[mode][1][i]
              ])
            .then(([col, feilds]) => {
              for (let key in col[0]) {
                sum.push([col[0][key] ? col[0][key] : 0]);
              }
            })
            .catch(err => {
              console.log(err);
            });
          }

          return;

        case '1.2':

          for (let i = 0; i < params[mode][1].length; i++) {
            await pool.execute('SELECT SUM(`Сумма итого руб`) FROM ' + tableName + ' WHERE ' +
              '`Месяц` = ? ' +
              'AND `Статья движения денег` = ? ' +
              'AND `Прочие выплата расшифровка` = ? ',
              [
                params[mode][0],
                params[mode][1][i],
                params[mode][2][i]
              ])
            .then(([col, feilds]) => {
              for (let key in col[0]) {
                sum.push([col[0][key] ? col[0][key] : 0]);
              }
            })
            .catch(err => {
              console.log(err);
            });
          }

          return;

          case '1.3':

            for (let i = 0; i < params[mode][1].length; i++) {
              await pool.execute('SELECT SUM(`Сумма итого руб`) FROM ' + tableName + ' WHERE ' +
                '`Месяц` = ? ' +
                'AND `Статья движения денег` = ? ' +
                'AND `Компания` = ? ',
                [
                  params[mode][0],
                  params[mode][1][i],
                  params[mode][2][i]
                ])
              .then(([col, feilds]) => {
                for (let key in col[0]) {
                  sum.push([col[0][key] ? col[0][key] : 0]);
                }
              })
              .catch(err => {
                console.log(err);
              });
            }

            return;

          case '2.1':

          //console.log(params[mode]);

            for (let d = 0; d < params[mode][3].length; d++) {
              sum.push([]);
              for (let i = 0; i < params[mode][1].length; i++) {
                await pool.execute('SELECT SUM(`Сумма итого руб`) FROM ' + tableName + ' WHERE ' +
                  '`Месяц` = ? ' +
                  'AND `Статья движения денег` = ? ' +
                  'AND `Направление группа` = ? ',
                  [
                    params[mode][0],
                    params[mode][1][i],
                    params[mode][3][d]

                  ])
                .then(([col, feilds]) => {
                  for (let key in col[0]) {
                    sum[d].push([col[0][key] ? col[0][key] : 0]);
                  }
                })
                .catch(err => {
                  console.log(err);
                });
              }
            }

            return;

          case '2.2':

            for (let d = 0; d < params[mode][3].length; d++) {
              sum.push([]);
              for (let i = 0; i < params[mode][1].length; i++) {
                await pool.execute('SELECT SUM(`Сумма итого руб`) FROM ' + tableName + ' WHERE ' +
                  '`Месяц` = ? ' +
                  'AND `Статья движения денег` = ? ' +
                  'AND `Прочие выплата расшифровка` = ? ' +
                  'AND `Направление группа` = ? ',
                  [
                    params[mode][0],
                    params[mode][1][i],
                    params[mode][2][i],
                    params[mode][3][d]
                  ])
                .then(([col, feilds]) => {
                  for (let key in col[0]) {
                    sum[d].push([col[0][key] ? col[0][key] : 0]);
                  }
                })
                .catch(err => {
                  console.log(err);
                });
              }
            }

            return;

          case '2.3':

            for (let d = 0; d < params[mode][3].length; d++) {
              sum.push([]);
              for (let i = 0; i < params[mode][1].length; i++) {
                await pool.execute('SELECT SUM(`Сумма итого руб`) FROM ' + tableName + ' WHERE ' +
                  '`Месяц` = ? ' +
                  'AND `Статья движения денег` = ? ' +
                  'AND `Компания` = ? ' +
                  'AND `Направление группа` = ? ',
                  [
                    params[mode][0],
                    params[mode][1][i],
                    params[mode][2][i],
                    params[mode][3][d]
                  ])
                .then(([col, feilds]) => {
                  for (let key in col[0]) {
                    sum[d].push([col[0][key] ? col[0][key] : 0]);
                  }
                })
                .catch(err => {
                  console.log(err);
                });
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

module.exports = indirectQuery;
