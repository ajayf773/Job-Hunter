import fs from 'fs';

const content = fs.readFileSync('cv.md', 'utf8');

const skillsRegex = /\n---\n\n## Technical Skills\n\n[\s\S]*?(?=\n---\n\n## Professional Experience)/;

const match = content.match(skillsRegex);
if (match) {
    const skillsBlock = match[0];
    let newContent = content.replace(skillsBlock, '');
    newContent += skillsBlock;
    fs.writeFileSync('cv.md', newContent, 'utf8');
    console.log('Fixed cv.md order.');
} else {
    console.log('Could not match skills block.');
}
