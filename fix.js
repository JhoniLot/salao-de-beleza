const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Rename supabase to supabaseClient in our own code
html = html.replace(/const supabase = window\.supabase\.createClient/g, 'const supabaseClient = window.supabase.createClient');
html = html.replace(/await supabase\.from/g, 'await supabaseClient.from');

// 2. Fix confirmSelfBooking
html = html.replace(/function confirmSelfBooking\(cliId\) \{/g, 'async function confirmSelfBooking(cliId) {');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Fix script done!');
