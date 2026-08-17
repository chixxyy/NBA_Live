import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
  process.exit(1)
}

import ws from 'ws'
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: ws }
})

const DEFAULT_PLAYERS = [
  {
    "id": "1",
    "name": "Tyrese Haliburton",
    "team": "IND",
    "position": "PG",
    "price": 25000000,
    "score": 90,
    "tier": "A",
    "pts": 20.1,
    "reb": 3.9,
    "ast": 10.9,
    "stl": 1.2,
    "blk": 0.7,
    "tov": 2.3
  },
  {
    "id": "2",
    "name": "Anthony Edwards",
    "team": "MIN",
    "position": "SG/SF",
    "price": 26000000,
    "score": 91,
    "tier": "A",
    "pts": 25.9,
    "reb": 5.4,
    "ast": 5.1,
    "stl": 1.3,
    "blk": 0.5,
    "tov": 3.1
  },
  {
    "id": "3",
    "name": "Kawhi Leonard",
    "team": "LAC",
    "position": "SF/PF",
    "price": 28000000,
    "score": 92,
    "tier": "A",
    "pts": 23.7,
    "reb": 6.1,
    "ast": 3.6,
    "stl": 1.6,
    "blk": 0.9,
    "tov": 1.8
  },
  {
    "id": "4",
    "name": "Zion Williamson",
    "team": "NOP",
    "position": "PF/C",
    "price": 24000000,
    "score": 90,
    "tier": "A",
    "pts": 22.9,
    "reb": 5.8,
    "ast": 5,
    "stl": 1.1,
    "blk": 0.7,
    "tov": 2.8
  },
  {
    "id": "5",
    "name": "Bam Adebayo",
    "team": "MIA",
    "position": "C/PF",
    "price": 27000000,
    "score": 90,
    "tier": "A",
    "pts": 19.3,
    "reb": 10.4,
    "ast": 3.9,
    "stl": 1.1,
    "blk": 0.9,
    "tov": 2.3
  },
  {
    "id": "6",
    "name": "Nikola Jokic",
    "team": "DEN",
    "position": "C",
    "price": 35000000,
    "score": 99,
    "tier": "S",
    "pts": 26.4,
    "reb": 12.4,
    "ast": 9,
    "stl": 1.4,
    "blk": 0.9,
    "tov": 3
  },
  {
    "id": "7",
    "name": "Luka Doncic",
    "team": "DAL",
    "position": "PG/SG",
    "price": 35000000,
    "score": 98,
    "tier": "S",
    "pts": 33.9,
    "reb": 9.2,
    "ast": 9.8,
    "stl": 1.4,
    "blk": 0.5,
    "tov": 4
  },
  {
    "id": "8",
    "name": "Giannis Antetokounmpo",
    "team": "MIL",
    "position": "PF/C",
    "price": 35000000,
    "score": 97,
    "tier": "S",
    "pts": 30.4,
    "reb": 11.5,
    "ast": 6.5,
    "stl": 1.2,
    "blk": 1.1,
    "tov": 3.4
  },
  {
    "id": "9",
    "name": "Shai Gilgeous-Alexander",
    "team": "OKC",
    "position": "PG/SG",
    "price": 35000000,
    "score": 96,
    "tier": "S",
    "pts": 30.1,
    "reb": 5.5,
    "ast": 6.2,
    "stl": 2,
    "blk": 0.9,
    "tov": 2.2
  },
  {
    "id": "10",
    "name": "Joel Embiid",
    "team": "PHI",
    "position": "C",
    "price": 35000000,
    "score": 96,
    "tier": "S",
    "pts": 34.7,
    "reb": 11,
    "ast": 5.6,
    "stl": 1.2,
    "blk": 1.7,
    "tov": 3.8
  },
  {
    "id": "11",
    "name": "Jayson Tatum",
    "team": "BOS",
    "position": "SF/PF",
    "price": 28000000,
    "score": 94,
    "tier": "A",
    "pts": 26.9,
    "reb": 8.1,
    "ast": 4.9,
    "stl": 1,
    "blk": 0.6,
    "tov": 2.5
  },
  {
    "id": "12",
    "name": "Stephen Curry",
    "team": "GSW",
    "position": "PG",
    "price": 28000000,
    "score": 93,
    "tier": "A",
    "pts": 26.4,
    "reb": 4.5,
    "ast": 5.1,
    "stl": 0.7,
    "blk": 0.4,
    "tov": 2.8
  },
  {
    "id": "13",
    "name": "Kevin Durant",
    "team": "PHX",
    "position": "PF/SF",
    "price": 28000000,
    "score": 93,
    "tier": "A",
    "pts": 27.1,
    "reb": 6.6,
    "ast": 5,
    "stl": 0.9,
    "blk": 1.2,
    "tov": 3.3
  },
  {
    "id": "14",
    "name": "LeBron James",
    "team": "LAL",
    "position": "SF/PF",
    "price": 27000000,
    "score": 92,
    "tier": "A",
    "pts": 25.7,
    "reb": 7.3,
    "ast": 8.3,
    "stl": 1.3,
    "blk": 0.5,
    "tov": 3.5
  },
  {
    "id": "15",
    "name": "Anthony Davis",
    "team": "LAL",
    "position": "C/PF",
    "price": 27000000,
    "score": 92,
    "tier": "A",
    "pts": 24.7,
    "reb": 12.6,
    "ast": 3.5,
    "stl": 1.2,
    "blk": 2.3,
    "tov": 2.1
  },
  {
    "id": "16",
    "name": "Devin Booker",
    "team": "PHX",
    "position": "SG/PG",
    "price": 26000000,
    "score": 90,
    "tier": "A",
    "pts": 27.1,
    "reb": 4.5,
    "ast": 6.9,
    "stl": 0.9,
    "blk": 0.4,
    "tov": 2.6
  },
  {
    "id": "17",
    "name": "Jalen Brunson",
    "team": "NYK",
    "position": "PG",
    "price": 21000000,
    "score": 89,
    "tier": "B",
    "pts": 28.7,
    "reb": 3.6,
    "ast": 6.7,
    "stl": 0.9,
    "blk": 0.2,
    "tov": 2.4
  },
  {
    "id": "18",
    "name": "Donovan Mitchell",
    "team": "CLE",
    "position": "SG",
    "price": 21000000,
    "score": 89,
    "tier": "B",
    "pts": 26.6,
    "reb": 5.1,
    "ast": 6.1,
    "stl": 1.8,
    "blk": 0.5,
    "tov": 2.8
  },
  {
    "id": "19",
    "name": "Jimmy Butler",
    "team": "MIA",
    "position": "SF",
    "price": 20000000,
    "score": 89,
    "tier": "B",
    "pts": 20.8,
    "reb": 5.3,
    "ast": 5,
    "stl": 1.3,
    "blk": 0.3,
    "tov": 1.7
  },
  {
    "id": "20",
    "name": "Victor Wembanyama",
    "team": "SAS",
    "position": "C",
    "price": 19000000,
    "score": 88,
    "tier": "B",
    "pts": 21.4,
    "reb": 10.6,
    "ast": 3.9,
    "stl": 1.2,
    "blk": 3.6,
    "tov": 3.7
  },
  {
    "id": "21",
    "name": "Jaylen Brown",
    "team": "BOS",
    "position": "SG/SF",
    "price": 19000000,
    "score": 88,
    "tier": "B",
    "pts": 23,
    "reb": 5.5,
    "ast": 3.6,
    "stl": 1.2,
    "blk": 0.5,
    "tov": 2.4
  },
  {
    "id": "22",
    "name": "Karl-Anthony Towns",
    "team": "MIN",
    "position": "C/PF",
    "price": 18000000,
    "score": 88,
    "tier": "B",
    "pts": 21.8,
    "reb": 8.3,
    "ast": 3,
    "stl": 0.7,
    "blk": 0.7,
    "tov": 2.2
  },
  {
    "id": "23",
    "name": "Trae Young",
    "team": "ATL",
    "position": "PG",
    "price": 18000000,
    "score": 88,
    "tier": "B",
    "pts": 25.7,
    "reb": 2.8,
    "ast": 10.8,
    "stl": 1.3,
    "blk": 0.2,
    "tov": 4.4
  },
  {
    "id": "24",
    "name": "DeMar DeRozan",
    "team": "CHI",
    "position": "SF/SG",
    "price": 17000000,
    "score": 87,
    "tier": "B",
    "pts": 24,
    "reb": 4.3,
    "ast": 5.3,
    "stl": 1.1,
    "blk": 0.6,
    "tov": 1.7
  },
  {
    "id": "25",
    "name": "De'Aaron Fox",
    "team": "SAC",
    "position": "PG/SG",
    "price": 17000000,
    "score": 87,
    "tier": "B",
    "pts": 26.6,
    "reb": 4.6,
    "ast": 5.6,
    "stl": 2,
    "blk": 0.2,
    "tov": 2.6
  },
  {
    "id": "26",
    "name": "Lauri Markkanen",
    "team": "UTA",
    "position": "PF/SF",
    "price": 16000000,
    "score": 86,
    "tier": "B",
    "pts": 23.2,
    "reb": 8.2,
    "ast": 2,
    "stl": 0.9,
    "blk": 0.5,
    "tov": 1.4
  },
  {
    "id": "27",
    "name": "Tyrese Maxey",
    "team": "PHI",
    "position": "PG/SG",
    "price": 16000000,
    "score": 86,
    "tier": "B",
    "pts": 25.9,
    "reb": 3.7,
    "ast": 6.2,
    "stl": 1,
    "blk": 0.5,
    "tov": 1.7
  },
  {
    "id": "28",
    "name": "Domantas Sabonis",
    "team": "SAC",
    "position": "C/PF",
    "price": 16000000,
    "score": 86,
    "tier": "B",
    "pts": 19.4,
    "reb": 13.7,
    "ast": 8.2,
    "stl": 0.9,
    "blk": 0.6,
    "tov": 3.3
  },
  {
    "id": "29",
    "name": "Mikal Bridges",
    "team": "BKN",
    "position": "SF/SG",
    "price": 15000000,
    "score": 85,
    "tier": "B",
    "pts": 19.6,
    "reb": 4.5,
    "ast": 3.6,
    "stl": 1,
    "blk": 0.4,
    "tov": 2
  },
  {
    "id": "30",
    "name": "Jamal Murray",
    "team": "DEN",
    "position": "PG/SG",
    "price": 15000000,
    "score": 85,
    "tier": "B",
    "pts": 21.2,
    "reb": 4.1,
    "ast": 6.5,
    "stl": 1,
    "blk": 0.7,
    "tov": 2.1
  },
  {
    "id": "31",
    "name": "Paolo Banchero",
    "team": "ORL",
    "position": "PF",
    "price": 8000000,
    "score": 84,
    "tier": "C",
    "pts": 22.6,
    "reb": 6.9,
    "ast": 5.4,
    "stl": 0.9,
    "blk": 0.6,
    "tov": 3.1
  },
  {
    "id": "32",
    "name": "Alperen Sengun",
    "team": "HOU",
    "position": "C",
    "price": 8000000,
    "score": 84,
    "tier": "C",
    "pts": 21.1,
    "reb": 9.3,
    "ast": 5,
    "stl": 1.2,
    "blk": 0.7,
    "tov": 2.6
  },
  {
    "id": "33",
    "name": "Scottie Barnes",
    "team": "TOR",
    "position": "SF/PF",
    "price": 7000000,
    "score": 84,
    "tier": "C",
    "pts": 19.9,
    "reb": 8.2,
    "ast": 6.1,
    "stl": 1.3,
    "blk": 1.5,
    "tov": 2.8
  },
  {
    "id": "34",
    "name": "Chet Holmgren",
    "team": "OKC",
    "position": "C",
    "price": 7000000,
    "score": 83,
    "tier": "C",
    "pts": 16.5,
    "reb": 7.9,
    "ast": 2.4,
    "stl": 0.6,
    "blk": 2.3,
    "tov": 1.5
  },
  {
    "id": "35",
    "name": "Jalen Williams",
    "team": "OKC",
    "position": "SF",
    "price": 7000000,
    "score": 83,
    "tier": "C",
    "pts": 19.1,
    "reb": 4,
    "ast": 4.5,
    "stl": 1.1,
    "blk": 0.6,
    "tov": 1.7
  },
  {
    "id": "36",
    "name": "Franz Wagner",
    "team": "ORL",
    "position": "SF",
    "price": 6000000,
    "score": 82,
    "tier": "C",
    "pts": 19.7,
    "reb": 5.3,
    "ast": 3.7,
    "stl": 1.1,
    "blk": 0.4,
    "tov": 1.8
  },
  {
    "id": "37",
    "name": "Derrick White",
    "team": "BOS",
    "position": "SG",
    "price": 6000000,
    "score": 82,
    "tier": "C",
    "pts": 15.2,
    "reb": 4.2,
    "ast": 5.2,
    "stl": 1,
    "blk": 1.2,
    "tov": 1.5
  },
  {
    "id": "38",
    "name": "Jrue Holiday",
    "team": "BOS",
    "position": "PG/SG",
    "price": 6000000,
    "score": 82,
    "tier": "C",
    "pts": 12.5,
    "reb": 5.4,
    "ast": 4.8,
    "stl": 0.9,
    "blk": 0.8,
    "tov": 1.6
  },
  {
    "id": "39",
    "name": "Austin Reaves",
    "team": "LAL",
    "position": "SG/PG",
    "price": 5000000,
    "score": 81,
    "tier": "C",
    "pts": 15.9,
    "reb": 4.3,
    "ast": 5.5,
    "stl": 0.8,
    "blk": 0.3,
    "tov": 2.1
  },
  {
    "id": "40",
    "name": "D'Angelo Russell",
    "team": "LAL",
    "position": "PG",
    "price": 5000000,
    "score": 80,
    "tier": "C",
    "pts": 18,
    "reb": 3.1,
    "ast": 6.3,
    "stl": 0.9,
    "blk": 0.5,
    "tov": 2.1
  },
  {
    "id": "41",
    "name": "Naz Reid",
    "team": "MIN",
    "position": "C/PF",
    "price": 3000000,
    "score": 79,
    "tier": "D",
    "pts": 13.5,
    "reb": 5.2,
    "ast": 1.3,
    "stl": 0.8,
    "blk": 0.9,
    "tov": 1.4
  },
  {
    "id": "42",
    "name": "Malik Monk",
    "team": "SAC",
    "position": "SG/PG",
    "price": 3000000,
    "score": 79,
    "tier": "D",
    "pts": 15.4,
    "reb": 2.9,
    "ast": 5.1,
    "stl": 0.6,
    "blk": 0.5,
    "tov": 2.1
  },
  {
    "id": "43",
    "name": "Rui Hachimura",
    "team": "LAL",
    "position": "PF/SF",
    "price": 2000000,
    "score": 78,
    "tier": "D",
    "pts": 13.6,
    "reb": 4.3,
    "ast": 1.2,
    "stl": 0.6,
    "blk": 0.4,
    "tov": 0.8
  },
  {
    "id": "44",
    "name": "Herbert Jones",
    "team": "NOP",
    "position": "SF/PF",
    "price": 2000000,
    "score": 78,
    "tier": "D",
    "pts": 11,
    "reb": 3.6,
    "ast": 2.6,
    "stl": 1.4,
    "blk": 0.8,
    "tov": 1.1
  },
  {
    "id": "45",
    "name": "Gary Payton II",
    "team": "GSW",
    "position": "SG",
    "price": 2000000,
    "score": 77,
    "tier": "D",
    "pts": 5.5,
    "reb": 2.6,
    "ast": 1.1,
    "stl": 0.9,
    "blk": 0.4,
    "tov": 0.5
  },
  {
    "id": "46",
    "name": "Jose Alvarado",
    "team": "NOP",
    "position": "PG",
    "price": 1000000,
    "score": 76,
    "tier": "D",
    "pts": 7.1,
    "reb": 2.3,
    "ast": 2.1,
    "stl": 1.1,
    "blk": 0.2,
    "tov": 0.9
  },
  {
    "id": "47",
    "name": "Sam Hauser",
    "team": "BOS",
    "position": "SF",
    "price": 1000000,
    "score": 75,
    "tier": "D",
    "pts": 9,
    "reb": 3.5,
    "ast": 1,
    "stl": 0.5,
    "blk": 0.3,
    "tov": 0.4
  },
  {
    "id": "48",
    "name": "Peyton Watson",
    "team": "DEN",
    "position": "PF",
    "price": 1000000,
    "score": 74,
    "tier": "D",
    "pts": 6.7,
    "reb": 3.2,
    "ast": 1.1,
    "stl": 0.5,
    "blk": 1.1,
    "tov": 0.8
  },
  {
    "id": "49",
    "name": "Luke Kornet",
    "team": "BOS",
    "position": "C",
    "price": 1000000,
    "score": 74,
    "tier": "D",
    "pts": 5.3,
    "reb": 4.1,
    "ast": 1.1,
    "stl": 0.4,
    "blk": 1,
    "tov": 0.4
  },
  {
    "id": "50",
    "name": "Christian Braun",
    "team": "DEN",
    "position": "SG",
    "price": 1000000,
    "score": 74,
    "tier": "D",
    "pts": 7.3,
    "reb": 3.7,
    "ast": 1.6,
    "stl": 0.5,
    "blk": 0.4,
    "tov": 0.5
  },
  {
    "id": "51",
    "name": "Zion Williamson",
    "team": "NOP",
    "position": "PF",
    "price": 21000000,
    "score": 89,
    "tier": "B",
    "pts": 22.9,
    "reb": 5.8,
    "ast": 5,
    "stl": 1.1,
    "blk": 0.7,
    "tov": 2.8
  },
  {
    "id": "52",
    "name": "De'Aaron Fox",
    "team": "SAC",
    "position": "PG",
    "price": 20000000,
    "score": 89,
    "tier": "B",
    "pts": 26.6,
    "reb": 4.6,
    "ast": 5.6,
    "stl": 2,
    "blk": 0.2,
    "tov": 2.6
  },
  {
    "id": "53",
    "name": "Bam Adebayo",
    "team": "MIA",
    "position": "C",
    "price": 20000000,
    "score": 89,
    "tier": "B",
    "pts": 19.3,
    "reb": 10.4,
    "ast": 3.9,
    "stl": 1.1,
    "blk": 0.9,
    "tov": 2.3
  },
  {
    "id": "54",
    "name": "Tyrese Maxey",
    "team": "PHI",
    "position": "PG/SG",
    "price": 19000000,
    "score": 88,
    "tier": "B",
    "pts": 25.9,
    "reb": 3.7,
    "ast": 6.2,
    "stl": 1,
    "blk": 0.5,
    "tov": 1.7
  },
  {
    "id": "55",
    "name": "Lauri Markkanen",
    "team": "UTA",
    "position": "PF",
    "price": 19000000,
    "score": 88,
    "tier": "B",
    "pts": 23.2,
    "reb": 8.2,
    "ast": 2,
    "stl": 0.9,
    "blk": 0.5,
    "tov": 1.4
  },
  {
    "id": "56",
    "name": "Julius Randle",
    "team": "NYK",
    "position": "PF",
    "price": 18000000,
    "score": 87,
    "tier": "B",
    "pts": 24,
    "reb": 9.2,
    "ast": 5,
    "stl": 0.5,
    "blk": 0.3,
    "tov": 3.5
  },
  {
    "id": "57",
    "name": "Jaren Jackson Jr.",
    "team": "MEM",
    "position": "C/PF",
    "price": 18000000,
    "score": 87,
    "tier": "B",
    "pts": 22.5,
    "reb": 5.5,
    "ast": 2.3,
    "stl": 1.2,
    "blk": 1.6,
    "tov": 2.4
  },
  {
    "id": "58",
    "name": "Evan Mobley",
    "team": "CLE",
    "position": "C/PF",
    "price": 17000000,
    "score": 86,
    "tier": "B",
    "pts": 15.7,
    "reb": 9.4,
    "ast": 3.2,
    "stl": 0.9,
    "blk": 1.4,
    "tov": 1.8
  },
  {
    "id": "59",
    "name": "Pascal Siakam",
    "team": "IND",
    "position": "PF",
    "price": 17000000,
    "score": 86,
    "tier": "B",
    "pts": 21.7,
    "reb": 7.1,
    "ast": 4.3,
    "stl": 0.8,
    "blk": 0.3,
    "tov": 2.2
  },
  {
    "id": "60",
    "name": "Desmond Bane",
    "team": "MEM",
    "position": "SG",
    "price": 16000000,
    "score": 85,
    "tier": "B",
    "pts": 23.7,
    "reb": 4.4,
    "ast": 5.5,
    "stl": 1,
    "blk": 0.5,
    "tov": 2.6
  },
  {
    "id": "61",
    "name": "Cade Cunningham",
    "team": "DET",
    "position": "PG",
    "price": 8000000,
    "score": 84,
    "tier": "C",
    "pts": 22.7,
    "reb": 4.3,
    "ast": 7.5,
    "stl": 0.9,
    "blk": 0.4,
    "tov": 3.4
  },
  {
    "id": "62",
    "name": "Anfernee Simons",
    "team": "POR",
    "position": "SG",
    "price": 8000000,
    "score": 84,
    "tier": "C",
    "pts": 22.6,
    "reb": 3.6,
    "ast": 5.5,
    "stl": 0.5,
    "blk": 0.1,
    "tov": 2.7
  },
  {
    "id": "63",
    "name": "Tyler Herro",
    "team": "MIA",
    "position": "SG",
    "price": 8000000,
    "score": 84,
    "tier": "C",
    "pts": 20.8,
    "reb": 5.3,
    "ast": 4.5,
    "stl": 0.7,
    "blk": 0.1,
    "tov": 2.2
  },
  {
    "id": "64",
    "name": "CJ McCollum",
    "team": "NOP",
    "position": "SG/PG",
    "price": 7000000,
    "score": 84,
    "tier": "C",
    "pts": 20,
    "reb": 4.3,
    "ast": 4.6,
    "stl": 0.9,
    "blk": 0.6,
    "tov": 1.7
  },
  {
    "id": "65",
    "name": "Myles Turner",
    "team": "IND",
    "position": "C",
    "price": 7000000,
    "score": 84,
    "tier": "C",
    "pts": 17.1,
    "reb": 6.9,
    "ast": 1.3,
    "stl": 0.5,
    "blk": 1.9,
    "tov": 1.7
  },
  {
    "id": "66",
    "name": "Dejounte Murray",
    "team": "ATL",
    "position": "PG",
    "price": 7000000,
    "score": 83,
    "tier": "C",
    "pts": 22.5,
    "reb": 5.3,
    "ast": 6.4,
    "stl": 1.4,
    "blk": 0.3,
    "tov": 2.6
  },
  {
    "id": "67",
    "name": "Aaron Gordon",
    "team": "DEN",
    "position": "PF",
    "price": 7000000,
    "score": 83,
    "tier": "C",
    "pts": 13.9,
    "reb": 6.5,
    "ast": 3.5,
    "stl": 0.8,
    "blk": 0.6,
    "tov": 1.4
  },
  {
    "id": "68",
    "name": "Kristaps Porzingis",
    "team": "BOS",
    "position": "C",
    "price": 7000000,
    "score": 83,
    "tier": "C",
    "pts": 20.1,
    "reb": 7.2,
    "ast": 2,
    "stl": 0.7,
    "blk": 1.9,
    "tov": 1.6
  },
  {
    "id": "69",
    "name": "Darius Garland",
    "team": "CLE",
    "position": "PG",
    "price": 6000000,
    "score": 83,
    "tier": "C",
    "pts": 18,
    "reb": 2.7,
    "ast": 6.5,
    "stl": 1.3,
    "blk": 0.1,
    "tov": 3.1
  },
  {
    "id": "70",
    "name": "Josh Giddey",
    "team": "OKC",
    "position": "SG/PG",
    "price": 6000000,
    "score": 82,
    "tier": "C",
    "pts": 12.3,
    "reb": 6.4,
    "ast": 4.8,
    "stl": 0.6,
    "blk": 0.6,
    "tov": 2.1
  },
  {
    "id": "71",
    "name": "Zach LaVine",
    "team": "CHI",
    "position": "SG",
    "price": 6000000,
    "score": 82,
    "tier": "C",
    "pts": 19.5,
    "reb": 5.2,
    "ast": 3.9,
    "stl": 0.8,
    "blk": 0.3,
    "tov": 2.1
  },
  {
    "id": "72",
    "name": "RJ Barrett",
    "team": "TOR",
    "position": "SF",
    "price": 6000000,
    "score": 82,
    "tier": "C",
    "pts": 20.2,
    "reb": 5.4,
    "ast": 3.3,
    "stl": 0.5,
    "blk": 0.4,
    "tov": 2.3
  },
  {
    "id": "73",
    "name": "Keldon Johnson",
    "team": "SAS",
    "position": "SF",
    "price": 6000000,
    "score": 82,
    "tier": "C",
    "pts": 15.7,
    "reb": 5.5,
    "ast": 2.8,
    "stl": 0.7,
    "blk": 0.3,
    "tov": 1.8
  },
  {
    "id": "74",
    "name": "Kyle Kuzma",
    "team": "WAS",
    "position": "PF",
    "price": 5000000,
    "score": 81,
    "tier": "C",
    "pts": 22.2,
    "reb": 6.6,
    "ast": 4.2,
    "stl": 0.5,
    "blk": 0.7,
    "tov": 2.7
  },
  {
    "id": "75",
    "name": "Terry Rozier",
    "team": "MIA",
    "position": "PG/SG",
    "price": 5000000,
    "score": 81,
    "tier": "C",
    "pts": 19.8,
    "reb": 4,
    "ast": 5.6,
    "stl": 1,
    "blk": 0.3,
    "tov": 2.1
  },
  {
    "id": "76",
    "name": "Bogdan Bogdanovic",
    "team": "ATL",
    "position": "SG",
    "price": 5000000,
    "score": 81,
    "tier": "C",
    "pts": 16.9,
    "reb": 3.4,
    "ast": 3.1,
    "stl": 1.2,
    "blk": 0.3,
    "tov": 1.4
  },
  {
    "id": "77",
    "name": "Jalen Green",
    "team": "HOU",
    "position": "SG",
    "price": 5000000,
    "score": 80,
    "tier": "C",
    "pts": 19.6,
    "reb": 5.2,
    "ast": 3.5,
    "stl": 0.8,
    "blk": 0.3,
    "tov": 2.3
  },
  {
    "id": "78",
    "name": "Jerami Grant",
    "team": "POR",
    "position": "PF",
    "price": 5000000,
    "score": 80,
    "tier": "C",
    "pts": 21,
    "reb": 3.5,
    "ast": 2.8,
    "stl": 0.8,
    "blk": 0.6,
    "tov": 2.1
  },
  {
    "id": "79",
    "name": "Dillon Brooks",
    "team": "HOU",
    "position": "SF",
    "price": 5000000,
    "score": 80,
    "tier": "C",
    "pts": 12.7,
    "reb": 3.4,
    "ast": 1.7,
    "stl": 0.9,
    "blk": 0.1,
    "tov": 1.5
  },
  {
    "id": "80",
    "name": "Immanuel Quickley",
    "team": "TOR",
    "position": "PG",
    "price": 5000000,
    "score": 80,
    "tier": "C",
    "pts": 17,
    "reb": 3.8,
    "ast": 4.9,
    "stl": 0.7,
    "blk": 0.1,
    "tov": 1.6
  },
  {
    "id": "81",
    "name": "Collin Sexton",
    "team": "UTA",
    "position": "SG/PG",
    "price": 3000000,
    "score": 79,
    "tier": "D",
    "pts": 18.7,
    "reb": 2.6,
    "ast": 4.9,
    "stl": 0.8,
    "blk": 0.2,
    "tov": 2.1
  },
  {
    "id": "82",
    "name": "Jordan Poole",
    "team": "WAS",
    "position": "SG",
    "price": 3000000,
    "score": 79,
    "tier": "D",
    "pts": 17.4,
    "reb": 2.7,
    "ast": 4.4,
    "stl": 1.1,
    "blk": 0.3,
    "tov": 2.4
  },
  {
    "id": "83",
    "name": "Coby White",
    "team": "CHI",
    "position": "PG",
    "price": 3000000,
    "score": 79,
    "tier": "D",
    "pts": 19.1,
    "reb": 4.5,
    "ast": 5.1,
    "stl": 0.7,
    "blk": 0.2,
    "tov": 2.1
  },
  {
    "id": "84",
    "name": "Cam Thomas",
    "team": "BKN",
    "position": "SG",
    "price": 3000000,
    "score": 79,
    "tier": "D",
    "pts": 22.5,
    "reb": 3.2,
    "ast": 2.9,
    "stl": 0.7,
    "blk": 0.2,
    "tov": 1.9
  },
  {
    "id": "85",
    "name": "Bennedict Mathurin",
    "team": "IND",
    "position": "SG",
    "price": 2000000,
    "score": 78,
    "tier": "D",
    "pts": 14.5,
    "reb": 4,
    "ast": 2,
    "stl": 0.6,
    "blk": 0.2,
    "tov": 1.4
  },
  {
    "id": "86",
    "name": "Deni Avdija",
    "team": "WAS",
    "position": "SF",
    "price": 2000000,
    "score": 78,
    "tier": "D",
    "pts": 14.7,
    "reb": 7.2,
    "ast": 3.8,
    "stl": 0.8,
    "blk": 0.5,
    "tov": 2.1
  },
  {
    "id": "87",
    "name": "Keyonte George",
    "team": "UTA",
    "position": "PG",
    "price": 2000000,
    "score": 78,
    "tier": "D",
    "pts": 13,
    "reb": 2.8,
    "ast": 4.4,
    "stl": 0.5,
    "blk": 0.1,
    "tov": 2.5
  },
  {
    "id": "88",
    "name": "Grayson Allen",
    "team": "PHX",
    "position": "SG",
    "price": 2000000,
    "score": 77,
    "tier": "D",
    "pts": 13.5,
    "reb": 3.9,
    "ast": 3,
    "stl": 0.9,
    "blk": 0.6,
    "tov": 1.3
  },
  {
    "id": "89",
    "name": "Jalen Suggs",
    "team": "ORL",
    "position": "PG",
    "price": 2000000,
    "score": 77,
    "tier": "D",
    "pts": 12.6,
    "reb": 3.1,
    "ast": 2.7,
    "stl": 1.4,
    "blk": 0.6,
    "tov": 1.8
  },
  {
    "id": "90",
    "name": "Luguentz Dort",
    "team": "OKC",
    "position": "SF",
    "price": 2000000,
    "score": 77,
    "tier": "D",
    "pts": 10.9,
    "reb": 3.6,
    "ast": 1.4,
    "stl": 0.9,
    "blk": 0.6,
    "tov": 0.8
  },
  {
    "id": "91",
    "name": "Alex Caruso",
    "team": "CHI",
    "position": "SG",
    "price": 1000000,
    "score": 76,
    "tier": "D",
    "pts": 10.1,
    "reb": 3.8,
    "ast": 3.5,
    "stl": 1.7,
    "blk": 1,
    "tov": 1.3
  },
  {
    "id": "92",
    "name": "Kentavious Caldwell-Pope",
    "team": "DEN",
    "position": "SG",
    "price": 1000000,
    "score": 76,
    "tier": "D",
    "pts": 10.1,
    "reb": 2.4,
    "ast": 2.4,
    "stl": 1.3,
    "blk": 0.6,
    "tov": 1
  },
  {
    "id": "93",
    "name": "Jonathan Kuminga",
    "team": "GSW",
    "position": "PF",
    "price": 1000000,
    "score": 76,
    "tier": "D",
    "pts": 16.1,
    "reb": 4.8,
    "ast": 2.2,
    "stl": 0.7,
    "blk": 0.5,
    "tov": 1.8
  },
  {
    "id": "94",
    "name": "Jalen Duren",
    "team": "DET",
    "position": "C",
    "price": 1000000,
    "score": 75,
    "tier": "D",
    "pts": 13.8,
    "reb": 11.6,
    "ast": 2.4,
    "stl": 0.5,
    "blk": 0.8,
    "tov": 2.1
  },
  {
    "id": "95",
    "name": "Jaden McDaniels",
    "team": "MIN",
    "position": "SF",
    "price": 1000000,
    "score": 75,
    "tier": "D",
    "pts": 10.5,
    "reb": 3.1,
    "ast": 1.4,
    "stl": 0.9,
    "blk": 0.6,
    "tov": 1.1
  },
  {
    "id": "96",
    "name": "Max Strus",
    "team": "CLE",
    "position": "SG/SF",
    "price": 1000000,
    "score": 75,
    "tier": "D",
    "pts": 12.2,
    "reb": 4.8,
    "ast": 4,
    "stl": 0.9,
    "blk": 0.4,
    "tov": 1.5
  },
  {
    "id": "97",
    "name": "Garrison Mathews",
    "team": "ATL",
    "position": "SG",
    "price": 1000000,
    "score": 74,
    "tier": "D",
    "pts": 4.9,
    "reb": 1.4,
    "ast": 0.6,
    "stl": 0.3,
    "blk": 0.1,
    "tov": 0.3
  },
  {
    "id": "98",
    "name": "Vasilije Micic",
    "team": "CHA",
    "position": "PG",
    "price": 1000000,
    "score": 74,
    "tier": "D",
    "pts": 7,
    "reb": 1.5,
    "ast": 4.4,
    "stl": 0.5,
    "blk": 0.1,
    "tov": 1.7
  },
  {
    "id": "99",
    "name": "Miles McBride",
    "team": "NYK",
    "position": "PG",
    "price": 1000000,
    "score": 74,
    "tier": "D",
    "pts": 8.3,
    "reb": 1.5,
    "ast": 1.7,
    "stl": 0.9,
    "blk": 0.1,
    "tov": 0.6
  },
  {
    "id": "100",
    "name": "Nick Richards",
    "team": "CHA",
    "position": "C",
    "price": 1000000,
    "score": 74,
    "tier": "D",
    "pts": 9.7,
    "reb": 8,
    "ast": 0.8,
    "stl": 0.4,
    "blk": 1.1,
    "tov": 1.1
  }
]

async function initDatabase() {
  const { data, error } = await supabase.from('players').select('id').limit(1)
  
  if (error) {
    console.error("Error checking database. Check if 'players' table exists.", error.message)
    return
  }

  if (data.length === 0) {
    console.log("Database is empty. Seeding 10 default players...")
    const { error: insertError } = await supabase.from('players').insert(DEFAULT_PLAYERS)
    if (insertError) {
      console.error("Failed to seed players:", insertError.message)
    } else {
      console.log("Seeding complete.")
    }
  } else {
    console.log("Database already initialized. Starting game loop...")
  }
}

// Keep a memory of the original stats to anchor the simulation so players don't drift infinitely
const baseStatsMap = new Map()

function updateScoreAndTier(base, newStats) {
  // Instead of recalculating OVR from scratch (which ruins real NBA rankings),
  // we anchor it to their base OVR and adjust it based on their PTS performance.
  // "PTS越高的 ovr越高": if they score more than their average, OVR goes up!
  const ptsDiff = newStats.pts - base.pts
  
  // Every 1 point above average = +0.5 OVR. Every 1 point below = -0.5 OVR.
  let rawScore = base.score + (ptsDiff * 0.5)
  
  // Cap between 60 and 99
  let score = Math.max(60, Math.min(99, Math.round(rawScore)))
  
  return score
}

async function runGameLoop() {
  try {
    console.log("Fetching players for simulation...")
    const { data: players, error } = await supabase.from('players').select('*')
    
    if (error) {
      console.error("Failed to fetch players:", error.message)
      return
    }

    if (baseStatsMap.size === 0) {
      // First run: save base stats for anchoring
      players.forEach(p => baseStatsMap.set(p.id, { pts: p.pts, reb: p.reb, ast: p.ast, stl: p.stl, blk: p.blk, tov: p.tov, score: p.score }))
    }

    console.log(`Simulating stats for ${players.length} players...`)

    let updatedPlayers = players.map(player => {
      const base = baseStatsMap.get(player.id) || player
      
      // 模擬真實球賽的單場表現：有時手感火熱（大波動），有時正常（小波動）
      const isHot = Math.random() > 0.8
      const volatility = isHot ? 3.0 : 1.0
      
      const simulateGameStat = (baseStat, variance) => {
        const gameStat = Math.max(0, baseStat + (Math.random() * variance * 2 - variance) * volatility)
        return gameStat
      }
      
      // Simulate a single game based on their true base average
      const gamePts = simulateGameStat(base.pts, 8) // Can swing +/- 8 pts normally, up to 24 if hot
      const gameReb = simulateGameStat(base.reb, 4)
      const gameAst = simulateGameStat(base.ast, 4)
      const gameStl = simulateGameStat(base.stl, 1)
      const gameBlk = simulateGameStat(base.blk, 1)
      const gameTov = simulateGameStat(base.tov, 2)
      
      // Update the running average: 98% current average, 2% this game's performance
      // This prevents infinite drift, naturally regresses to the mean, and makes it much harder to dramatically increase stats quickly
      const EMA_KEEP = 0.98
      const EMA_NEW = 0.02
      
      const pts = Math.min(40, +(player.pts * EMA_KEEP + gamePts * EMA_NEW).toFixed(1))
      const reb = +(player.reb * EMA_KEEP + gameReb * EMA_NEW).toFixed(1)
      const ast = +(player.ast * EMA_KEEP + gameAst * EMA_NEW).toFixed(1)
      const stl = +(player.stl * EMA_KEEP + gameStl * EMA_NEW).toFixed(1)
      const blk = +(player.blk * EMA_KEEP + gameBlk * EMA_NEW).toFixed(1)
      const tov = +(player.tov * EMA_KEEP + gameTov * EMA_NEW).toFixed(1)
      
      const score = updateScoreAndTier(base, { pts, reb, ast, stl, blk, tov })
      return { ...player, pts, reb, ast, stl, blk, tov, score }
    })

    // Sort by score descending to assign tiers based on strict ranking
    updatedPlayers.sort((a, b) => b.score - a.score)

    // Assign tiers based on Rank (Total 100 players)
    // Rank 1-10: S (10 players)
    // Rank 11-30: A (20 players)
    // Rank 31-60: B (30 players)
    // Rank 61-80: C (20 players)
    // Rank 81-100: D (20 players)
    for (let i = 0; i < updatedPlayers.length; i++) {
      let newTier = 'D'
      if (i < 10) newTier = 'S'
      else if (i < 30) newTier = 'A'
      else if (i < 60) newTier = 'B'
      else if (i < 80) newTier = 'C'
      
      updatedPlayers[i].tier = newTier
    }

    // Save back to DB
    for (const player of updatedPlayers) {
      const { id, pts, reb, ast, stl, blk, tov, score, tier } = player
      const { error: updateError } = await supabase.from('players').update({ pts, reb, ast, stl, blk, tov, score, tier }).eq('id', id)
      if (updateError) {
        console.error(`Failed to update player ${id}:`, updateError.message)
      }
    }
    
    console.log("Simulation tick complete. Frontend should shuffle now!")
  } catch (err) {
    console.error("Simulation error:", err)
  }
}

async function main() {
  console.log("Starting Advanced Local Simulation Engine...")
  await initDatabase()
  
  // Run loop every 5 seconds for fast, satisfying UI updates
  setInterval(runGameLoop, 5000)
  runGameLoop()
}

main()
