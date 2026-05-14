const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('请输入要加密的密码: ', async (password) => {
  const hash = await bcrypt.hash(password, 10);
  console.log('\n加密后的密码哈希：');
  console.log(hash);
  rl.close();
});
