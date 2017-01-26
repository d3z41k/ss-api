async function profiQuery(pool, params) {
  return new Promise(async (resolve, reject) => {

    let sum = [];

    try {

      for (let i = 0; i < params[3].length; i++) {

        await pool.execute('SELECT SUM(`Сумма итого руб`) FROM `dds_lera` WHERE ' +
            '`Направление деятельноcти` = ? ' +
            'AND `Статья движения денег` = ? ' +
            'AND `Месяц` = ? ' +
            'AND `Тематика Профи` = ? ' +
            'AND `Город Профи и КЗ` = ? ' +
            'AND `Контрагент Профи и КЗ` = ?',
          [
            params[0][0],
            params[1][0],
            params[2][0],
            params[3][i] ? params[3][i] : params[3][i] = 0,
            params[4][i] ? params[4][i] : params[4][i] = 0,
            params[5][i] ? params[5][i] : params[5][i] = 0

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

    } catch (e) {
      reject(e.stack);
    } finally {
      resolve(sum);
    }

  });

}

module.exports = profiQuery;
