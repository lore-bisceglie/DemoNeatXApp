const fs = require('fs');
const content = fs.readFileSync('C:/Users/Lxxmtq/Documents/Korsakoff/NeatX/DemoNeatXApp/app/t/[slug]/sede/[locationSlug]/SedeBookingClient.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, i) => {
  // Check for regex patterns
  const regexMatches = line.match(/\/[^\/]*\/[gimuys]*/g);
  if (regexMatches) {
    regexMatches.forEach(m => {
      console.log('Regex at line ' + (i+1) + ': ' + m);
    });
  }

  // Check for template literals that might be unclosed
  if (line.includes('`')) {
    const backticks = (line.match(/`/g) || []).length;
    if (backticks % 2 !== 0) {
      console.log('Odd number of backticks at line ' + (i+1) + ': ' + line.substring(0, 100));
    }
  }
  
  // Check for potential unclosed template literals with ${}
  if (line.includes('${') && !line.includes('}')) {
    console.log('Potential unclosed template at line ' + (i+1) + ': ' + line.substring(0, 100));
  }
});