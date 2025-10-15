// scripts/generateImagesList.js
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '../public/Images');
const outputFile = path.join(__dirname, '../src/generated/images.json');

const files = fs.readdirSync(imagesDir).filter(f => /\.(png|jpg|jpeg|gif|svg)$/.test(f));

fs.writeFileSync(outputFile, JSON.stringify(files, null, 2));

console.log(`Generated ${files.length} images at ${outputFile}`);