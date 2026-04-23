const fs = require('fs');

const DB_FILE = () => process.env.DB_PATH || './uat_data.json';

function readDB() {
  try {
    const f = DB_FILE();
    if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch (e) {}
  return { responses: {}, submissions: {} };
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE(), JSON.stringify(data, null, 2));
}

function makeKey(tester, section, q_ref, q_num) {
  return [tester, section, q_ref || '', q_num || ''].join('|');
}

module.exports = { readDB, writeDB, makeKey };
