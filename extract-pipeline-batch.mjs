import fs from 'fs';

const pipeline = fs.readFileSync('data/pipeline.md', 'utf8');
const lines = pipeline.split('\n');

let inPending = false;
let batchInput = '';
let idCounter = 1;

for (const line of lines) {
    if (line.trim() === '## Pending') {
        inPending = true;
        continue;
    }
    if (line.startsWith('## ')) {
        inPending = false;
        continue;
    }
    if (inPending && line.startsWith('- [ ] ')) {
        // extract URL
        const parts = line.substring(6).split(' | ');
        const url = parts[0].trim();
        const company = parts.length > 1 ? parts[1].trim() : '';
        const title = parts.length > 2 ? parts[2].trim() : '';
        batchInput += `${idCounter}\t${url}\tmanual\t${company} - ${title}\n`;
        idCounter++;
    }
}

fs.writeFileSync('batch/batch-input.tsv', batchInput, 'utf8');
console.log(`Extracted ${idCounter - 1} URLs to batch/batch-input.tsv`);
