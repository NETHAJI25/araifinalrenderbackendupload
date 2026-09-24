const fs = require('fs');
const content = fs.readFileSync('src/data/problemStatements.ts', 'utf-8');

// Use a regular expression to match each object in the raw array
const matchRegex = /\{ sourcePsId:\s*['"]([^'"]+)['"],\s*title:\s*['"]([^'"]+)['"],\s*category:\s*['"]([^'"]+)['"],\s*theme:\s*['"]([^'"]+)['"]\s*\}/g;

let matches;
const json = [];
let i = 1;

while ((matches = matchRegex.exec(content)) !== null) {
  json.push({
    id: `IA26${String(i).padStart(3, '0')}`,
    localPsNumber: `IA26${String(i).padStart(3, '0')}`,
    sourcePsId: matches[1],
    serialNo: i,
    title: matches[2],
    category: matches[3],
    theme: matches[4]
  });
  i++;
}

fs.writeFileSync('src/data/problemStatements.json', JSON.stringify(json, null, 2));
console.log(`Generated ${json.length} records.`);
