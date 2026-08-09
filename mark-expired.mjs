import fs from 'fs';

const path = 'data/pipeline.md';
let content = fs.readFileSync(path, 'utf8');

// Find the line for Perplexity
const regex = /(- \[ \] (https:\/\/jobs\.ashbyhq\.com\/perplexity\/886f4ab3-e691-45ed-b2db-069edf6f5413.*))\n/;
const match = content.match(regex);
if (match) {
    const originalLine = match[1];
    // Remove it from Pending
    content = content.replace(match[0], '');
    
    // Add to Processed
    const processedLine = `- [x] ~~${originalLine.replace('- [ ] ', '')}~~ — posting expired (liveness sweep)\n`;
    content = content.replace('## Processed\n', `## Processed\n${processedLine}`);
    
    fs.writeFileSync(path, content, 'utf8');
    console.log('Moved Perplexity to Processed as expired.');
} else {
    console.log('Perplexity URL not found in Pending.');
}
