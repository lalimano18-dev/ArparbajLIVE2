const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');

const requiredIds = [
  // Game controls
  'start', 'pause', 'resume', 'next', 'stop',
  'countdown', 'between', 'maxQuestions', 'autoMode',
  // Product form
  'image', 'mentes', 'tbody', 'status',
  // Test admin
  'testName', 'testPlayer', 'testAnswers', 'createTestPlayer',
  // TikTok
  'tiktokUsername', 'connectTikTokBtn', 'disconnectTikTokBtn', 'tiktokStatus',
  // Podium
  'showPodium', 'hidePodium',
  // Rankings
  'rankingTabs', 'persistentRankingList', 'adminRoundRanking', 'adminTournamentRanking'
];

let allFound = true;
requiredIds.forEach(id => {
  const regex = new RegExp(`id=["']${id}["']`, 'i');
  const found = html.match(regex);
  console.log(`${found ? '✅' : '❌'} id="${id}"${found ? ' (found)' : ' (MISSING)'}`);
  if (!found) allFound = false;
});

console.log('\n' + (allFound ? '✅ All required DOM elements found!' : '❌ Some elements are missing!'));
process.exit(allFound ? 0 : 1);