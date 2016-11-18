function abc() {
  let abc = [];
  for (var i = 64; i <= 90; i++) {
    for (var j = 65; j <= 90; j++) {
      if (i == 64) {
        abc.push(String.fromCharCode(j));
      } else {
        abc.push(String.fromCharCode(i) + String.fromCharCode(j));
      }
    }
  }
  return abc;
}
module.exports = abc;
