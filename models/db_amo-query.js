async function amoQuery(pool, tableName, params) {
  return new Promise(async(resolve, reject) => {

  let values = [];

    //for (let t = 0; t < params[3].length; t++) {
      for (let i = 0; i < params[0].length; i++) {

        await pool.execute('SELECT SUM(`Сумма итого руб`) FROM '+ tableName +' WHERE ' +
            '`Проекты AMO` = ? ' +
            'AND `Контрагент AMO` = ? ' +
            'AND `Направление деятельноcти` = ? ' +
            'AND `Статья движения денег` = ?', [
              params[0][i].trim(),
              params[1][i].trim(),
              params[2][i].trim(),
              params[3][0].trim()
            ])
          .then(([col, feilds]) => {
            for (let key in col[0]) {
              values.push(col[0][key] ? col[0][key] : 0);
            }
          })
          .catch(console.log);
      }
    //}

    //console.log(values);

    resolve(values);
  });
}

module.exports = amoQuery;
