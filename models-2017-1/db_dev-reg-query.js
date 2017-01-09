async function devRegQuery(pool, tableName, params) {
  return new Promise(async(resolve, reject) => {

  let values = [];

    for (let m = 0; m < params[2].length; m++) {
      for (let i = 0; i < params[1].length; i++) {

        await pool.execute('SELECT SUM(`Сумма итого руб`) FROM '+ tableName +' WHERE ' +
            '`Направление деятельноcти` = ? ' +
            'AND `Статья движения денег` = ? ' +
            'AND `Месяц` = ? ' +
            'AND `Проекты разработка` = ? ' +
            'AND `Контрагент Разработка` = ?', [
              params[0],
              params[1][i],
              params[2][m],
              params[3][0],
              params[4][0]
            ])
          .then(([col, feilds]) => {
            for (let key in col[0]) {
              values.push(col[0][key] ? col[0][key] : 0);
            }
          })
          .catch(console.log);
      }
    }

    resolve(values);
  });
}

module.exports = devRegQuery;
