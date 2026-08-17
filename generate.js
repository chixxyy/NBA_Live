import fs from 'fs';

const franchise = [
  { id: '1', name: 'De\'Aaron Fox', team: 'SAC', position: 'PG/SG', price: 25000000, score: 90, tier: 'A', pts: 26.6, reb: 4.6, ast: 5.6, stl: 2.0, blk: 0.2, tov: 2.6 },
  { id: '2', name: 'Anthony Edwards', team: 'MIN', position: 'SG/SF', price: 26000000, score: 91, tier: 'A', pts: 25.9, reb: 5.4, ast: 5.1, stl: 1.3, blk: 0.5, tov: 3.1 },
  { id: '3', name: 'Kawhi Leonard', team: 'LAC', position: 'SF/PF', price: 28000000, score: 92, tier: 'A', pts: 23.7, reb: 6.1, ast: 3.6, stl: 1.6, blk: 0.9, tov: 1.8 },
  { id: '4', name: 'Zion Williamson', team: 'NOP', position: 'PF/C', price: 24000000, score: 90, tier: 'A', pts: 22.9, reb: 5.8, ast: 5.0, stl: 1.1, blk: 0.7, tov: 2.8 },
  { id: '5', name: 'Bam Adebayo', team: 'MIA', position: 'C/PF', price: 27000000, score: 90, tier: 'A', pts: 19.3, reb: 10.4, ast: 3.9, stl: 1.1, blk: 0.9, tov: 2.3 },
];

let newPlayers = [];
newPlayers.push(...franchise);

newPlayers.push(
  { id: '6', name: 'Nikola Jokic', team: 'DEN', position: 'C', price: 35000000, score: 99, tier: 'S', pts: 26.4, reb: 12.4, ast: 9.0, stl: 1.4, blk: 0.9, tov: 3.0 },
  { id: '7', name: 'Luka Doncic', team: 'DAL', position: 'PG/SG', price: 35000000, score: 98, tier: 'S', pts: 33.9, reb: 9.2, ast: 9.8, stl: 1.4, blk: 0.5, tov: 4.0 },
  { id: '8', name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF/C', price: 35000000, score: 97, tier: 'S', pts: 30.4, reb: 11.5, ast: 6.5, stl: 1.2, blk: 1.1, tov: 3.4 },
  { id: '9', name: 'Shai Gilgeous-Alexander', team: 'OKC', position: 'PG/SG', price: 35000000, score: 96, tier: 'S', pts: 30.1, reb: 5.5, ast: 6.2, stl: 2.0, blk: 0.9, tov: 2.2 },
  { id: '10', name: 'Joel Embiid', team: 'PHI', position: 'C', price: 35000000, score: 96, tier: 'S', pts: 34.7, reb: 11.0, ast: 5.6, stl: 1.2, blk: 1.7, tov: 3.8 }
);

newPlayers.push(
  { id: '11', name: 'Jayson Tatum', team: 'BOS', position: 'SF/PF', price: 28000000, score: 94, tier: 'A', pts: 26.9, reb: 8.1, ast: 4.9, stl: 1.0, blk: 0.6, tov: 2.5 },
  { id: '12', name: 'Stephen Curry', team: 'GSW', position: 'PG', price: 28000000, score: 93, tier: 'A', pts: 26.4, reb: 4.5, ast: 5.1, stl: 0.7, blk: 0.4, tov: 2.8 },
  { id: '13', name: 'Kevin Durant', team: 'PHX', position: 'PF/SF', price: 28000000, score: 93, tier: 'A', pts: 27.1, reb: 6.6, ast: 5.0, stl: 0.9, blk: 1.2, tov: 3.3 },
  { id: '14', name: 'LeBron James', team: 'LAL', position: 'SF/PF', price: 27000000, score: 92, tier: 'A', pts: 25.7, reb: 7.3, ast: 8.3, stl: 1.3, blk: 0.5, tov: 3.5 },
  { id: '15', name: 'Anthony Davis', team: 'LAL', position: 'C/PF', price: 27000000, score: 92, tier: 'A', pts: 24.7, reb: 12.6, ast: 3.5, stl: 1.2, blk: 2.3, tov: 2.1 },
  { id: '16', name: 'Devin Booker', team: 'PHX', position: 'SG/PG', price: 26000000, score: 90, tier: 'A', pts: 27.1, reb: 4.5, ast: 6.9, stl: 0.9, blk: 0.4, tov: 2.6 }
);

const mockNames = ["Tyrese Haliburton", "Domantas Sabonis", "Mikal Bridges", "Jamal Murray", "Austin Reaves", "D'Angelo Russell", "Naz Reid", "Malik Monk", "Rui Hachimura", "Herbert Jones", "Gary Payton II", "Jose Alvarado", "Sam Hauser", "Peyton Watson", "Luke Kornet", "Christian Braun"];
const mockPos = ["PG", "SG", "SF", "PF", "C"];
let idCounter = 17;

for (let name of mockNames) {
  newPlayers.push({ id: String(idCounter++), name, team: 'FA', position: mockPos[idCounter%5], price: 15000000, score: 85, tier: 'B', pts: 15, reb: 5, ast: 5, stl: 1, blk: 1, tov: 2 });
}

while (newPlayers.length < 50) {
  newPlayers.push({ id: String(idCounter++), name: `Player ${idCounter}`, team: 'FA', position: mockPos[idCounter%5], price: 5000000, score: 75, tier: 'D', pts: 10, reb: 3, ast: 2, stl: 0.5, blk: 0.5, tov: 1 });
}

const playersStr = JSON.stringify(newPlayers, null, 2);

let worker = fs.readFileSync('server/worker.js', 'utf8');
worker = worker.replace(/const DEFAULT_PLAYERS = \[[\s\S]*?\]/, `const DEFAULT_PLAYERS = ${playersStr}`);
fs.writeFileSync('server/worker.js', worker);

let dash = fs.readFileSync('src/components/Dashboard.vue', 'utf8');
const regex = /players\.value = \[\s*props\.player,[\s\S]*?\]\n    \}/;
dash = dash.replace(regex, `players.value = ${playersStr}.map(p => p.id === props.player.id ? props.player : p)\n    }`);
fs.writeFileSync('src/components/Dashboard.vue', dash);
