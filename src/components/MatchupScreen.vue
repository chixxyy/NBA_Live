<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import type { Player } from '../types'

const props = defineProps<{
  myTeam: Player[]
  opponentTeam: Player[]
  salaryCap: number
}>()

const emit = defineEmits<{
  (e: 'back', updatedTeam?: Player[], updatedSalaryCap?: number, isDefeat?: boolean): void
}>()

interface BoxScore {
  pts: number
  reb: number
  ast: number
  stl: number
  blk: number
  pf: number
}

// Game State
const quarter = ref(1)
const clockTicks = ref(36) // 36 ticks per quarter (e.g., 20 sec per tick = 12 mins)
const isSimulating = ref(false)
const gameFinished = ref(false)
let simInterval: number | null = null

const boxScores = ref<Record<string, BoxScore>>({})
const stamina = ref<Record<string, number>>({})
const fouledOut = ref<Record<string, boolean>>({})

// Track who is on court
const myRotation = ref<Record<string, { current: Player, starter: Player, bench: Player | null }>>({})
const oppRotation = ref<Record<string, { current: Player, starter: Player, bench: Player | null }>>({})

const myScore = computed(() => props.myTeam.reduce((sum, p) => sum + (boxScores.value[p.id]?.pts || 0), 0))
const oppScore = computed(() => props.opponentTeam.reduce((sum, p) => sum + (boxScores.value[p.id]?.pts || 0), 0))

const formatClock = computed(() => {
  const totalSeconds = clockTicks.value * 20
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

const getDisplayQuarter = computed(() => {
  if (gameFinished.value) return 'FINAL'
  return `Q${quarter.value}`
})

onMounted(() => {
  initGame()
})

onUnmounted(() => {
  if (simInterval) clearInterval(simInterval)
})

const initGame = () => {
  const initTeam = (team: Player[]) => {
    const rot: Record<string, { current: Player, starter: Player }> = {}
    const positions = ['PG', 'SG', 'SF', 'PF', 'C']
    
    positions.forEach(pos => {
      const starter = team.find(p => !p.isBench && p.lineupPosition === pos) || team.find(p => !p.isBench) as Player
      
      rot[pos] = { current: starter, starter }
    })
    
    // Initialize stats for ALL players
    team.forEach(p => {
      boxScores.value[p.id] = { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, pf: 0 }
      stamina.value[p.id] = 100
      fouledOut.value[p.id] = false
    })
    
    return rot
  }
  
  myRotation.value = initTeam(props.myTeam)
  oppRotation.value = initTeam(props.opponentTeam)
}

const startSimulation = () => {
  if (isSimulating.value || gameFinished.value) return
  isSimulating.value = true
  
  simInterval = setInterval(() => {
    tick()
  }, 300) // 300ms per tick (10 seconds per quarter real-time)
}

const tick = () => {
  if (clockTicks.value <= 0) {
    if (quarter.value >= 4) {
      endGame()
      return
    } else {
      quarter.value++
      clockTicks.value = 36
      // Quarter break stamina regen
      Object.keys(stamina.value).forEach(id => {
        stamina.value[id] = Math.min(100, stamina.value[id] + 20)
      })
    }
  }

  clockTicks.value--
  
  simulatePossession(myRotation.value, props.myTeam, oppRotation.value, props.opponentTeam)
  simulatePossession(oppRotation.value, props.opponentTeam, myRotation.value, props.myTeam)
  
  handleStaminaAndRotation(myRotation.value, props.myTeam)
  handleStaminaAndRotation(oppRotation.value, props.opponentTeam)
}

const simulatePossession = (
  offRot: Record<string, { current: Player }>, 
  offTeamFull: Player[],
  defRot: Record<string, { current: Player }>,
  defTeamFull: Player[]
) => {
  // Randomly pick an offensive player on the court
  const positions = ['PG', 'SG', 'SF', 'PF', 'C']
  const scorerPos = positions[Math.floor(Math.random() * positions.length)]
  const scorer = offRot[scorerPos].current
  
  if (fouledOut.value[scorer.id]) return // Edge case

  const bs = boxScores.value[scorer.id]
  const stam = stamina.value[scorer.id]
  
  // Scoring logic based on real stats, stamina, and OVR (score)
  const stamMod = stam / 100
  // OVR effect: normalize OVR to a 0.5 ~ 1.2 multiplier (assuming OVR ranges roughly 70 ~ 100+)
  const ovrMod = Math.max(0.5, scorer.score / 85) 
  
  if (Math.random() < 0.35 * stamMod * (scorer.pts / 20) * ovrMod) {
    // Made shot
    const pts = Math.random() < 0.3 ? 3 : 2
    bs.pts += pts
    
    // Assist
    if (Math.random() < 0.6) {
      const astPos = positions.filter(p => p !== scorerPos)[Math.floor(Math.random() * 4)]
      const passer = offRot[astPos].current
      const passerOvr = Math.max(0.5, passer.score / 85)
      // Higher passer OVR = higher chance they actually get the assist
      if (Math.random() < 0.8 * passerOvr) {
        boxScores.value[passer.id].ast += 1
      }
    }
  } else {
    // Missed shot
    // Block chance
    if (Math.random() < 0.15) {
      const blkPos = positions[Math.floor(Math.random() * positions.length)]
      const blocker = defRot[blkPos].current
      const blockerOvr = Math.max(0.5, blocker.score / 85)
      if (Math.random() < 0.5 * blockerOvr) {
        boxScores.value[blocker.id].blk += 1
      }
    }
    
    // Rebound
    const isOffReb = Math.random() < 0.25
    if (isOffReb) {
      const rebPos = ['PF', 'C'][Math.floor(Math.random() * 2)]
      const rebber = offRot[rebPos].current
      const rebberOvr = Math.max(0.5, rebber.score / 85)
      if (Math.random() < 0.8 * rebberOvr) {
        boxScores.value[rebber.id].reb += 1
      }
    } else {
      const rebPos = ['SF', 'PF', 'C'][Math.floor(Math.random() * 3)]
      const rebber = defRot[rebPos].current
      const rebberOvr = Math.max(0.5, rebber.score / 85)
      if (Math.random() < 0.9 * rebberOvr) {
        boxScores.value[rebber.id].reb += 1
      }
    }
  }
  
  // Steal chance
  if (Math.random() < 0.08) {
    const stlPos = positions[Math.floor(Math.random() * positions.length)]
    const stealer = defRot[stlPos].current
    const stealerOvr = Math.max(0.5, stealer.score / 85)
    if (Math.random() < 0.5 * stealerOvr) {
      boxScores.value[stealer.id].stl += 1
    }
  }

  // Foul chance
  if (Math.random() < 0.08) {
    const foulPos = positions[Math.floor(Math.random() * positions.length)]
    const fouler = defRot[foulPos].current
    const fbs = boxScores.value[fouler.id]
    if (fbs.pf < 6) {
      fbs.pf += 1
      if (fbs.pf >= 6) {
        fouledOut.value[fouler.id] = true
        // Force sub
        forceSub(defRot, defTeamFull, foulPos)
      }
    }
  }
}

const findBestSub = (team: Player[], rot: Record<string, { current: Player }>, requiredPos: string) => {
  // Benched players who are not fouled out
  let available = team.filter(p => !isOnCourt(rot, p.id) && !fouledOut.value[p.id])
  
  // Try to find someone who can play this position
  let posMatches = available.filter(p => p.position.includes(requiredPos))
  
  // If no one can play the position, just take ANY available player (fallback)
  let candidates = posMatches.length > 0 ? posMatches : available
  
  if (candidates.length === 0) return null
  
  // Pick the one with the most stamina, tie-break with OVR (score)
  candidates.sort((a, b) => {
    if (stamina.value[b.id] !== stamina.value[a.id]) return stamina.value[b.id] - stamina.value[a.id]
    return b.score - a.score
  })
  
  return candidates[0]
}

const forceSub = (rot: Record<string, { current: Player, starter: Player }>, team: Player[], pos: string) => {
  const slot = rot[pos]
  const sub = findBestSub(team, rot, pos)
  
  if (sub) {
    slot.current = sub
  } else if (!fouledOut.value[slot.starter.id]) {
    slot.current = slot.starter
  }
}

const handleStaminaAndRotation = (rot: Record<string, { current: Player, starter: Player }>, team: Player[]) => {
  // First, regen stamina for ALL benched players
  team.forEach(p => {
    if (!isOnCourt(rot, p.id) && stamina.value[p.id] < 100) {
      stamina.value[p.id] = Math.min(100, stamina.value[p.id] + 3)
    }
  })

  const positions = ['PG', 'SG', 'SF', 'PF', 'C']
  positions.forEach(pos => {
    const slot = rot[pos]
    
    // Drain stamina of current player
    if (stamina.value[slot.current.id] > 0) {
      stamina.value[slot.current.id] = Math.max(0, stamina.value[slot.current.id] - 2)
    }

    // Auto sub logic (sub out if stamina < 40%)
    if (stamina.value[slot.current.id] < 40) {
      const sub = findBestSub(team, rot, pos)
      // Only sub if the sub has decent stamina (>60)
      if (sub && stamina.value[sub.id] > 60) {
        slot.current = sub
      }
    } else if (slot.current.id !== slot.starter.id && stamina.value[slot.starter.id] > 80 && !fouledOut.value[slot.starter.id]) {
      // Put starter back in if they are well rested (>80)
      slot.current = slot.starter
    }
  })
}

const showRewardOverlay = ref(false)
const selectedOpponentForReward = ref<Player | null>(null)
const selectedTeammateToDrop = ref<Player | null>(null)
const rewardError = ref('')

const endGame = () => {
  isSimulating.value = false
  gameFinished.value = true
  if (simInterval) {
    clearInterval(simInterval)
    simInterval = null
  }
  
  if (myTotalScore.value > oppTotalScore.value) {
    showRewardOverlay.value = true
  }
}

const getTrend = (player: Player) => {
  if (!player.originalTier) return null
  const tiers = ['D', 'C', 'B', 'A', 'S']
  const origIdx = tiers.indexOf(player.originalTier)
  const currIdx = tiers.indexOf(player.tier)
  
  if (currIdx > origIdx) return 'up'
  if (currIdx < origIdx) return 'down'
  return null
}

const getDynamicPrice = (player: Player) => {
  if (!player.originalPrice) return player.price
  if (!player.originalTier) return player.price
  
  const trend = getTrend(player)
  if (!trend) return player.price

  let priceDiff = 0
  if (trend === 'up') {
    if (player.tier === 'S') priceDiff = 10000000
    if (player.tier === 'A') priceDiff = 5000000
    if (player.tier === 'B') priceDiff = 3000000
    if (player.tier === 'C') priceDiff = 2000000
    if (player.tier === 'D') priceDiff = 1000000
  } else if (trend === 'down') {
    if (player.tier === 'A') priceDiff = -5000000
    if (player.tier === 'B') priceDiff = -7000000
    if (player.tier === 'C') priceDiff = -10000000
    if (player.tier === 'D') priceDiff = -15000000
  }
  
  return player.originalPrice + priceDiff
}

const confirmRewardSwap = () => {
  if (!selectedOpponentForReward.value || !selectedTeammateToDrop.value) return
  
  if (!selectedTeammateToDrop.value.isBench) {
    const requiredPos = selectedTeammateToDrop.value.lineupPosition || ''
    if (requiredPos && !selectedOpponentForReward.value.position.includes(requiredPos)) {
      rewardError.value = `為了保持先發陣容完整度，你必須選擇能打 ${requiredPos} 位置的球員來替換先發！`
      return
    }
  }
  
  const currentTeamSalary = props.myTeam.reduce((sum, p) => sum + getDynamicPrice(p), 0)
  const dropValue = getDynamicPrice(selectedTeammateToDrop.value)
  const addValue = getDynamicPrice(selectedOpponentForReward.value)
  
  if (currentTeamSalary - dropValue + addValue > props.salaryCap) {
    rewardError.value = `薪資空間不足！這筆交易會超過 ${(props.salaryCap / 1000000).toFixed(1)}M 上限。`
    return
  }

  // Clone team, replace player
  const newTeam = [...props.myTeam]
  const idx = newTeam.findIndex(p => p.id === selectedTeammateToDrop.value!.id)
  if (idx !== -1) {
    // Keep the dropped player's lineupPosition and isBench so the new player fits in seamlessly
    const lineupPos = newTeam[idx].lineupPosition
    const isBench = newTeam[idx].isBench
    newTeam[idx] = { ...selectedOpponentForReward.value, lineupPosition: lineupPos, isBench }
  }
  
  emit('back', newTeam, props.salaryCap) // pass back updated team
}

const getTierClass = (tier: string) => {
  const map: Record<string, string> = {
    'S': 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-950 shadow-yellow-500/50',
    'A': 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-red-500/50',
    'B': 'bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-purple-500/50',
    'C': 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-blue-500/50',
    'D': 'bg-gradient-to-br from-gray-400 to-gray-600 text-white shadow-gray-500/50'
  }
  return map[tier] || map['D']
}

const isOnCourt = (teamRot: Record<string, { current: Player }>, playerId: string) => {
  return Object.values(teamRot).some(slot => slot.current.id === playerId)
}

const posOrder: Record<string, number> = { 'PG': 1, 'SG': 2, 'SF': 3, 'PF': 4, 'C': 5 }

const sortedMyTeam = computed(() => {
  return [...props.myTeam].sort((a, b) => {
    const aOnCourt = isOnCourt(myRotation.value, a.id) ? 0 : 1
    const bOnCourt = isOnCourt(myRotation.value, b.id) ? 0 : 1
    if (aOnCourt !== bOnCourt) return aOnCourt - bOnCourt
    
    const aPos = aOnCourt === 0 ? Object.keys(myRotation.value).find(k => myRotation.value[k].current.id === a.id) : (a.lineupPosition || a.position)
    const bPos = bOnCourt === 0 ? Object.keys(myRotation.value).find(k => myRotation.value[k].current.id === b.id) : (b.lineupPosition || b.position)
    
    return (posOrder[aPos || ''] || 9) - (posOrder[bPos || ''] || 9)
  })
})

const sortedOppTeam = computed(() => {
  return [...props.opponentTeam].sort((a, b) => {
    const aOnCourt = isOnCourt(oppRotation.value, a.id) ? 0 : 1
    const bOnCourt = isOnCourt(oppRotation.value, b.id) ? 0 : 1
    if (aOnCourt !== bOnCourt) return aOnCourt - bOnCourt
    
    const aPos = aOnCourt === 0 ? Object.keys(oppRotation.value).find(k => oppRotation.value[k].current.id === a.id) : (a.lineupPosition || a.position)
    const bPos = bOnCourt === 0 ? Object.keys(oppRotation.value).find(k => oppRotation.value[k].current.id === b.id) : (b.lineupPosition || b.position)
    
    return (posOrder[aPos || ''] || 9) - (posOrder[bPos || ''] || 9)
  })
})
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-6rem)] relative overflow-hidden">
    <!-- Header / Scoreboard -->
    <div class="bg-gray-900/90 backdrop-blur-md rounded-2xl p-6 mb-6 shadow-2xl border border-gray-700 flex justify-between items-center relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent"></div>
      
      <button @click="emit('back')" class="relative z-10 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-bold transition-colors">
        ← 返回陣容
      </button>
      
      <div class="relative z-10 flex items-center gap-12">
        <!-- My Team Score -->
        <div class="flex flex-col items-center">
          <span class="text-gray-400 font-bold uppercase tracking-widest text-sm mb-1">My Team</span>
          <span class="text-6xl font-black tabular-nums tracking-tighter transition-all duration-300" :class="myScore > oppScore ? 'text-white' : 'text-gray-500'">
            {{ myScore }}
          </span>
        </div>
        
        <div class="flex flex-col items-center">
          <span class="text-lg font-black text-white bg-red-600 px-4 py-1 rounded-md uppercase tracking-widest shadow-lg shadow-red-600/50 mb-2">
            {{ getDisplayQuarter }}
          </span>
          <span v-if="!gameFinished" class="text-3xl font-mono font-black text-gray-300 tabular-nums">{{ formatClock }}</span>
          
          <button v-if="!isSimulating && !gameFinished" @click="startSimulation" class="mt-4 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-full font-bold text-white shadow-lg animate-pulse hover:animate-none transition-all">
            ▶ 開始跳動模擬
          </button>
        </div>
        
        <!-- Opponent Score -->
        <div class="flex flex-col items-center">
          <span class="text-gray-400 font-bold uppercase tracking-widest text-sm mb-1">Opponent</span>
          <span class="text-6xl font-black tabular-nums tracking-tighter transition-all duration-300" :class="oppScore > myScore ? 'text-white' : 'text-gray-500'">
            {{ oppScore }}
          </span>
        </div>
      </div>
      
      <div class="w-[100px]"></div> <!-- Spacer -->
    </div>

    <!-- Matchup Area -->
    <div class="flex-1 flex gap-8 overflow-hidden">
      <!-- My Team -->
      <div class="flex-1 flex flex-col bg-gray-900/50 rounded-2xl border border-gray-800 p-6 overflow-y-auto custom-scrollbar relative">
        <h2 class="text-2xl font-black mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 sticky top-0 bg-gray-900/80 backdrop-blur z-10 py-2">YOUR TEAM</h2>
        
        <!-- Roster with Transition -->
        <TransitionGroup name="list" tag="div" class="space-y-4 pb-10">
          <div v-for="p in sortedMyTeam" :key="p.id" 
               :class="['rounded-xl border flex items-center gap-4 relative overflow-hidden transition-all duration-500', 
                        isOnCourt(myRotation, p.id) ? 'p-4 bg-gray-800 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)] scale-100 opacity-100' : 'p-3 bg-gray-900/50 border-gray-800 scale-90 opacity-80',
                        fouledOut[p.id] ? 'grayscale opacity-50 border-red-900/50' : '']">
            <div :class="['rounded-xl flex items-center justify-center font-black shadow-lg shrink-0 transition-all duration-500', 
                          isOnCourt(myRotation, p.id) ? 'w-12 h-12 text-xl' : 'w-10 h-10 text-lg',
                          getTierClass(p.tier)]">
              {{ p.tier }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-bold mb-0.5 flex gap-2 transition-all duration-500" :class="isOnCourt(myRotation, p.id) ? 'text-xs' : 'text-[10px]'">
                <span class="text-gray-400">{{ isOnCourt(myRotation, p.id) ? Object.keys(myRotation).find(k => myRotation[k].current.id === p.id) : (p.isBench ? p.position : p.lineupPosition) }}</span>
                <span v-if="fouledOut[p.id]" class="text-red-500 bg-red-500/10 px-1.5 rounded">FOUL OUT</span>
                <span v-else-if="isOnCourt(myRotation, p.id)" class="text-green-400">ON COURT</span>
                <span v-else class="text-gray-500">BENCHED</span>
              </div>
              <div class="font-black truncate leading-none transition-all duration-500" 
                   :class="[fouledOut[p.id] ? 'text-gray-500 line-through' : (isOnCourt(myRotation, p.id) ? 'text-white text-lg' : 'text-gray-200 text-base')]">
                {{ p.name }}
              </div>
              
              <!-- Stamina Bar -->
              <div class="bg-gray-800 rounded-full overflow-hidden transition-all duration-500" :class="isOnCourt(myRotation, p.id) ? 'mt-2 h-1.5 w-full' : 'mt-1.5 h-1 w-full'">
                <div class="h-full transition-all duration-300" 
                     :class="stamina[p.id] > 60 ? 'bg-green-500' : stamina[p.id] > 30 ? 'bg-yellow-500' : 'bg-red-500'"
                     :style="`width: ${stamina[p.id]}%`"></div>
              </div>
            </div>
            
            <!-- Box Score -->
            <div v-if="boxScores[p.id]" class="flex shrink-0 bg-gray-950/80 rounded-lg border border-gray-800/50 tabular-nums transition-all duration-500"
                 :class="isOnCourt(myRotation, p.id) ? 'gap-3 p-2' : 'gap-2 p-1.5'">
              <div class="flex flex-col items-center"><span class="text-gray-500 font-bold transition-all duration-500" :class="isOnCourt(myRotation, p.id) ? 'text-[9px]' : 'text-[8px]'">PTS</span><span class="font-bold text-white transition-all duration-500" :class="isOnCourt(myRotation, p.id) ? 'text-lg' : 'text-sm'">{{ boxScores[p.id].pts }}</span></div>
              <div class="flex flex-col items-center"><span class="text-gray-500 font-bold transition-all duration-500" :class="isOnCourt(myRotation, p.id) ? 'text-[9px]' : 'text-[8px]'">REB</span><span class="font-bold text-gray-300 transition-all duration-500" :class="isOnCourt(myRotation, p.id) ? 'text-base' : 'text-sm'">{{ boxScores[p.id].reb }}</span></div>
              <div class="flex flex-col items-center"><span class="text-gray-500 font-bold transition-all duration-500" :class="isOnCourt(myRotation, p.id) ? 'text-[9px]' : 'text-[8px]'">AST</span><span class="font-bold text-gray-300 transition-all duration-500" :class="isOnCourt(myRotation, p.id) ? 'text-base' : 'text-sm'">{{ boxScores[p.id].ast }}</span></div>
              <div class="flex flex-col items-center"><span class="text-red-900 font-bold transition-all duration-500" :class="isOnCourt(myRotation, p.id) ? 'text-[9px]' : 'text-[8px]'">PF</span><span class="font-bold transition-all duration-500" :class="[boxScores[p.id].pf >= 6 ? 'text-red-500' : (isOnCourt(myRotation, p.id) ? 'text-gray-500' : 'text-gray-600'), isOnCourt(myRotation, p.id) ? 'text-base' : 'text-sm']">{{ boxScores[p.id].pf }}</span></div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Opponent Team -->
      <div class="flex-1 flex flex-col bg-gray-900/50 rounded-2xl border border-gray-800 p-6 overflow-y-auto custom-scrollbar relative">
        <h2 class="text-2xl font-black mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 sticky top-0 bg-gray-900/80 backdrop-blur z-10 py-2">OPPONENT</h2>
        
        <!-- Roster with Transition -->
        <TransitionGroup name="list" tag="div" class="space-y-4 pb-10">
          <div v-for="p in sortedOppTeam" :key="p.id" 
               :class="['rounded-xl border flex items-center gap-4 relative overflow-hidden transition-all duration-500 flex-row-reverse', 
                        isOnCourt(oppRotation, p.id) ? 'p-4 bg-gray-800 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)] scale-100 opacity-100' : 'p-3 bg-gray-900/50 border-gray-800 scale-90 opacity-80',
                        fouledOut[p.id] ? 'grayscale opacity-50 border-red-900/50' : '']">
            <div :class="['rounded-xl flex items-center justify-center font-black shadow-lg shrink-0 transition-all duration-500', 
                          isOnCourt(oppRotation, p.id) ? 'w-12 h-12 text-xl' : 'w-10 h-10 text-lg',
                          getTierClass(p.tier)]">
              {{ p.tier }}
            </div>
            <div class="flex-1 min-w-0 text-right">
              <div class="font-bold mb-0.5 flex gap-2 justify-end transition-all duration-500" :class="isOnCourt(oppRotation, p.id) ? 'text-xs' : 'text-[10px]'">
                <span v-if="fouledOut[p.id]" class="text-red-500 bg-red-500/10 px-1.5 rounded">FOUL OUT</span>
                <span v-else-if="isOnCourt(oppRotation, p.id)" class="text-green-400">ON COURT</span>
                <span v-else class="text-gray-500">BENCHED</span>
                <span class="text-gray-400">{{ isOnCourt(oppRotation, p.id) ? Object.keys(oppRotation).find(k => oppRotation[k].current.id === p.id) : (p.isBench ? p.position : p.lineupPosition) }}</span>
              </div>
              <div class="font-black truncate leading-none transition-all duration-500" 
                   :class="[fouledOut[p.id] ? 'text-gray-500 line-through' : (isOnCourt(oppRotation, p.id) ? 'text-white text-lg' : 'text-gray-200 text-base')]">
                {{ p.name }}
              </div>
              
              <!-- Stamina Bar -->
              <div class="bg-gray-800 rounded-full overflow-hidden flex justify-end transition-all duration-500" :class="isOnCourt(oppRotation, p.id) ? 'mt-2 h-1.5 w-full' : 'mt-1.5 h-1 w-full'">
                <div class="h-full transition-all duration-300" 
                     :class="stamina[p.id] > 60 ? 'bg-green-500' : stamina[p.id] > 30 ? 'bg-yellow-500' : 'bg-red-500'"
                     :style="`width: ${stamina[p.id]}%`"></div>
              </div>
            </div>
            
            <!-- Box Score -->
            <div v-if="boxScores[p.id]" class="flex shrink-0 bg-gray-950/80 rounded-lg border border-gray-800/50 flex-row-reverse tabular-nums transition-all duration-500"
                 :class="isOnCourt(oppRotation, p.id) ? 'gap-3 p-2' : 'gap-2 p-1.5'">
              <div class="flex flex-col items-center"><span class="text-gray-500 font-bold transition-all duration-500" :class="isOnCourt(oppRotation, p.id) ? 'text-[9px]' : 'text-[8px]'">PTS</span><span class="font-bold text-white transition-all duration-500" :class="isOnCourt(oppRotation, p.id) ? 'text-lg' : 'text-sm'">{{ boxScores[p.id].pts }}</span></div>
              <div class="flex flex-col items-center"><span class="text-gray-500 font-bold transition-all duration-500" :class="isOnCourt(oppRotation, p.id) ? 'text-[9px]' : 'text-[8px]'">REB</span><span class="font-bold text-gray-300 transition-all duration-500" :class="isOnCourt(oppRotation, p.id) ? 'text-base' : 'text-sm'">{{ boxScores[p.id].reb }}</span></div>
              <div class="flex flex-col items-center"><span class="text-gray-500 font-bold transition-all duration-500" :class="isOnCourt(oppRotation, p.id) ? 'text-[9px]' : 'text-[8px]'">AST</span><span class="font-bold text-gray-300 transition-all duration-500" :class="isOnCourt(oppRotation, p.id) ? 'text-base' : 'text-sm'">{{ boxScores[p.id].ast }}</span></div>
              <div class="flex flex-col items-center"><span class="text-red-900 font-bold transition-all duration-500" :class="isOnCourt(oppRotation, p.id) ? 'text-[9px]' : 'text-[8px]'">PF</span><span class="font-bold transition-all duration-500" :class="[boxScores[p.id].pf >= 6 ? 'text-red-500' : (isOnCourt(oppRotation, p.id) ? 'text-gray-500' : 'text-gray-600'), isOnCourt(oppRotation, p.id) ? 'text-base' : 'text-sm']">{{ boxScores[p.id].pf }}</span></div>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- Victory Reward Overlay -->
    <div v-if="gameFinished && showRewardOverlay" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div class="bg-gray-900 border border-yellow-500/50 rounded-3xl p-8 max-w-5xl w-full shadow-2xl relative my-8">
        <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>
        <h2 class="text-4xl md:text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-2 text-center drop-shadow-lg uppercase transform -skew-x-6">Victory!</h2>
        <p class="text-center text-gray-300 mb-8 font-bold">你擊敗了對手！作為獎勵，你可以從對手陣容中挑選一名球星進行一換一交易。</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Step 1: Select Opponent to Steal -->
          <div class="bg-black/50 rounded-2xl p-6 border border-gray-800">
            <h3 class="text-xl font-black text-red-400 mb-4 text-center">1. 選擇要挖角的對手</h3>
            <div class="grid grid-cols-5 gap-2">
              <button 
                v-for="p in props.opponentTeam" :key="'opp_'+p.id"
                @click="selectedOpponentForReward = p; rewardError = ''"
                :class="[
                  'p-2 rounded-xl border text-center transition-all',
                  selectedOpponentForReward?.id === p.id ? 'bg-red-900/50 border-red-500 scale-105 shadow-lg shadow-red-500/30' : 'bg-gray-800 border-gray-700 hover:border-gray-500 opacity-80 hover:opacity-100',
                  getTierClass(p.tier)
                ]"
              >
                <div class="text-[10px] text-gray-400 font-bold">{{ p.position }}</div>
                <div class="font-black text-xs truncate">{{ p.name }}</div>
                <div class="text-lg font-black text-white/90">{{ p.score }}</div>
              </button>
            </div>
          </div>
          
          <!-- Step 2: Select Teammate to Drop -->
          <div class="bg-black/50 rounded-2xl p-6 border border-gray-800">
            <h3 class="text-xl font-black text-blue-400 mb-4 text-center">2. 選擇要放棄的球員</h3>
            <div class="grid grid-cols-5 gap-2">
              <button 
                v-for="p in props.myTeam" :key="'my_'+p.id"
                @click="selectedTeammateToDrop = p; rewardError = ''"
                :class="[
                  'p-2 rounded-xl border text-center transition-all',
                  selectedTeammateToDrop?.id === p.id ? 'bg-blue-900/50 border-blue-500 scale-105 shadow-lg shadow-blue-500/30' : 'bg-gray-800 border-gray-700 hover:border-gray-500 opacity-80 hover:opacity-100',
                  getTierClass(p.tier)
                ]"
              >
                <div class="text-[10px] text-gray-400 font-bold">{{ p.isBench ? '替補' : p.lineupPosition }}</div>
                <div class="font-black text-xs truncate">{{ p.name }}</div>
                <div class="text-lg font-black text-white/90">{{ p.score }}</div>
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="rewardError" class="mt-6 text-center text-red-500 font-bold p-3 bg-red-500/10 rounded-xl border border-red-500/20">
          {{ rewardError }}
        </div>

        <div class="mt-8 flex gap-4 justify-center">
          <button @click="emit('back')" class="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold uppercase tracking-widest rounded-full transition-colors border border-gray-600">
            放棄獎勵並返回
          </button>
          <button 
            @click="confirmRewardSwap"
            :disabled="!selectedOpponentForReward || !selectedTeammateToDrop"
            class="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-black italic uppercase tracking-widest rounded-full shadow-lg shadow-yellow-500/20 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            確認替換球員
          </button>
        </div>
      </div>
    </div>
    
    <!-- Defeat Overlay -->
    <div v-if="gameFinished && !showRewardOverlay" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div class="bg-gray-900 border border-gray-700 rounded-3xl p-12 max-w-md w-full shadow-2xl relative text-center">
        <h2 class="text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600 mb-4 uppercase transform -skew-x-6">Defeat</h2>
        <p class="text-gray-400 mb-8 font-bold">很遺憾，你輸掉了比賽。</p>
        <button @click="emit('back', undefined, undefined, true)" class="w-full px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-black italic uppercase tracking-widest rounded-full shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0 border border-gray-600">
          返回陣容 (重新尋找隊友)
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-move, /* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.list-leave-active {
  position: absolute;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.2);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.2);
}
</style>
