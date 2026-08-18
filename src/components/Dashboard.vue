<script setup lang="ts">
import { fallbackPlayers } from "../data/fallbackPlayers";
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { createClient } from '@supabase/supabase-js'
import type { Player } from '../types'

const props = defineProps<{
  player: Player
  initialTeam?: Player[]
  initialSalaryCap?: number
}>()

const emit = defineEmits<{
  (e: 'start-matchup', myTeam: Player[], opponentTeam: Player[], currentSalaryCap: number): void
}>()

const players = ref<Player[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
let realtimeChannel: any = null

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const myTeam = ref<Player[]>([])
const opponentTeam = ref<Player[]>([])
const isGameStarted = ref(false)

const lockTeam = () => {
  isGameStarted.value = true
}

const showDifficultyModal = ref(false)
const difficulty = ref('Pro')

const openDifficultyModal = () => {
  if (myTeam.value.length !== 10) return
  showDifficultyModal.value = true
}

const startMatchup = (level: string) => {
  difficulty.value = level
  showDifficultyModal.value = false
  
  const available = players.value.filter(p => !myTeam.value.some(m => m.id === p.id))
  
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]]
  }

  const opp: Player[] = []

  const pickSpecific = (tier: string, posStr: string, isBench: boolean) => {
    let p = available.find(p => p.tier === tier && p.position.includes(posStr) && !opp.some(o => o.id === p.id))
    if (!p) p = available.find(p => p.position.includes(posStr) && !opp.some(o => o.id === p.id)) // Relax tier first
    if (!p) p = available.find(p => p.tier === tier && !opp.some(o => o.id === p.id))
    if (!p) p = available.find(p => !opp.some(o => o.id === p.id))
    if (p) opp.push({ ...p, lineupPosition: posStr, isBench })
  }
  
  const pickRandomRest = (posStr: string, isBench: boolean, excludeTiers: string[]) => {
    let p = available.find(p => !excludeTiers.includes(p.tier) && p.position.includes(posStr) && !opp.some(o => o.id === p.id))
    if (!p) p = available.find(p => p.position.includes(posStr) && !opp.some(o => o.id === p.id)) // Relax tier first
    if (!p) p = available.find(p => !excludeTiers.includes(p.tier) && !opp.some(o => o.id === p.id))
    if (!p) p = available.find(p => !opp.some(o => o.id === p.id))
    if (p) opp.push({ ...p, lineupPosition: posStr, isBench })
  }

  if (level === 'Pro') {
    pickSpecific('A', 'PG', false)
    pickRandomRest('SG', false, ['S', 'A'])
    pickRandomRest('SF', false, ['S', 'A'])
    pickRandomRest('PF', false, ['S', 'A'])
    pickRandomRest('C', false, ['S', 'A'])
    for (let i=0; i<5; i++) pickRandomRest('', true, ['S', 'A'])
  } else if (level === 'All-Star') {
    pickSpecific('S', 'PG', false)
    pickSpecific('A', 'SG', false)
    pickSpecific('A', 'SF', false)
    pickRandomRest('PF', false, ['S', 'A'])
    pickRandomRest('C', false, ['S', 'A'])
    for (let i=0; i<5; i++) pickRandomRest('', true, ['S', 'A'])
  } else if (level === 'HallOfFame') {
    pickSpecific('S', 'PG', false)
    pickSpecific('S', 'SG', false)
    pickSpecific('A', 'SF', false)
    pickSpecific('A', 'PF', false)
    pickSpecific('A', 'C', false)
    for (let i=0; i<5; i++) pickRandomRest('', true, ['S', 'A'])
  }

  // Fallback if not enough players found
  const positions = ['PG', 'SG', 'SF', 'PF', 'C']
  let currentStarters = opp.filter(p => !p.isBench).length
  while (currentStarters < 5) {
    const pos = positions[currentStarters]
    let p = available.find(p => p.position.includes(pos) && !opp.some(o => o.id === p.id))
    if (!p) p = available.find(p => !opp.some(o => o.id === p.id))
    if (p) opp.push({ ...p, lineupPosition: pos, isBench: false })
    currentStarters++
  }
  let currentBench = opp.filter(p => p.isBench).length
  while (currentBench < 5) {
    let p = available.find(p => !opp.some(o => o.id === p.id))
    if (p) opp.push({ ...p, lineupPosition: '', isBench: true })
    currentBench++
  }

  opponentTeam.value = opp
  emit('start-matchup', myTeam.value, opponentTeam.value, salaryCap.value)
}

const generateTeammates = () => {
  const allPositions = ['PG', 'SG', 'SF', 'PF', 'C']
  // Assign hero to their primary position (first part before /)
  const heroPrimary = props.player.position.split('/')[0].trim()
  const finalHeroPos = allPositions.includes(heroPrimary) ? heroPrimary : 'SF'
  
  const missing = allPositions.filter(p => p !== finalHeroPos)
  
  // Shuffle missing positions
  for (let i = missing.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [missing[i], missing[j]] = [missing[j], missing[i]]
  }

  const bPos = missing[0]
  const cPos = missing[1]
  const dPos1 = missing[2]
  const dPos2 = missing[3]
  
  const newTeammates: Player[] = []
  
  const pickForPosition = (tier: string, posStr: string, isBench: boolean = false) => {
    let pool = players.value.filter(p => p.tier === tier && p.position.includes(posStr) && p.id !== props.player.id && !newTeammates.some(t => t.id === p.id))
    if (pool.length === 0) {
      pool = players.value.filter(p => p.position.includes(posStr) && p.id !== props.player.id && !newTeammates.some(t => t.id === p.id)) // Relax tier, keep pos
    }
    if (pool.length === 0) {
      pool = players.value.filter(p => p.tier === tier && p.id !== props.player.id && !newTeammates.some(t => t.id === p.id))
    }
    if (pool.length === 0) {
      pool = players.value.filter(p => p.id !== props.player.id && !newTeammates.some(t => t.id === p.id))
    }
    const picked = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null
    if (picked) {
      newTeammates.push({ ...picked, lineupPosition: posStr, isBench })
    }
  }

  // Starters
  pickForPosition('B', bPos, false)
  pickForPosition('C', cPos, false)
  pickForPosition('D', dPos1, false)
  pickForPosition('D', dPos2, false)

  // Bench (5 players, no specific lineupPosition required)
  const pickBench = (tier: string) => {
    let pool = players.value.filter(p => p.tier === tier && p.id !== props.player.id && !newTeammates.some(t => t.id === p.id))
    if (pool.length === 0) pool = players.value.filter(p => p.id !== props.player.id && !newTeammates.some(t => t.id === p.id))
    const picked = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null
    if (picked) newTeammates.push({ ...picked, lineupPosition: '', isBench: true })
  }
  pickBench('B')
  pickBench('C')
  pickBench('C')
  pickBench('D')
  pickBench('D')

  const clonedTeammates = newTeammates
  
  const targetSum = 100000000 - props.player.price
  const minMax: Record<string, [number, number]> = {
    'S': [35000000, 35000000], 'A': [24000000, 29000000],
    'B': [14000000, 21000000], 'C': [5000000, 8000000], 'D': [1000000, 3000000]
  }

  // Start everyone at their tier minimum
  clonedTeammates.forEach(p => { p.price = minMax[p.tier]?.[0] || 1000000 })

  let currentSum = clonedTeammates.reduce((s, p) => s + p.price, 0)

  if (currentSum > targetSum) {
    // Over budget. Force reduce prices below tier mins if necessary
    let toRemove = currentSum - targetSum
    while (toRemove >= 1000000) {
      const valid = clonedTeammates.filter(p => p.price > 1000000)
      if (valid.length === 0) break
      const pick = valid[Math.floor(Math.random() * valid.length)]
      pick.price -= 1000000
      toRemove -= 1000000
    }
  } else {
    // Under budget. Distribute remaining sum randomly within valid tier max bounds
    let toAdd = targetSum - currentSum
    while (toAdd >= 1000000) {
      const valid = clonedTeammates.filter(p => p.price < (minMax[p.tier]?.[1] || p.price))
      if (valid.length === 0) break
      const pick = valid[Math.floor(Math.random() * valid.length)]
      pick.price += 1000000
      toAdd -= 1000000
    }
  }

  // Set original tier and price for tracking trades
  clonedTeammates.forEach(p => { p.originalTier = p.tier; p.originalPrice = p.price })

  const clonedHero = { ...props.player, lineupPosition: finalHeroPos, isBench: false, originalTier: props.player.tier, originalPrice: props.player.price }
  
  // Sort myTeam strictly by PG SG SF PF C, starters first
  const posOrder: Record<string, number> = { 'PG': 1, 'SG': 2, 'SF': 3, 'PF': 4, 'C': 5 }
  myTeam.value = [clonedHero, ...clonedTeammates].sort((a, b) => {
    const aWeight = (a.isBench ? 10 : 0) + (posOrder[a.lineupPosition || ''] || 9)
    const bWeight = (b.isBench ? 10 : 0) + (posOrder[b.lineupPosition || ''] || 9)
    return aWeight - bWeight
  })
}

const selectedTierFilter = ref<string>('All')
const isTrading = ref(false)
const selectedTradePlayer = ref<Player | null>(null)
const pendingTrade = ref<{ source: Player, target: Player } | null>(null)
const salaryCap = ref(props.initialSalaryCap || 100000000)

const startTrade = (member: Player) => {
  isTrading.value = true
  selectedTradePlayer.value = member
  setTimeout(() => {
    document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' })
  }, 100)
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

  // S (+10M), A (+5M/-5M), B (+3M/-7M), C (+2M/-10M), D (+1M/-15M)
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

const getTradeCapModifier = (player: Player) => {
  const trend = getTrend(player)
  let capModifier = 0
  if (trend === 'up') {
    if (player.tier === 'S') capModifier = 10000000
    if (player.tier === 'A') capModifier = 5000000
    if (player.tier === 'B') capModifier = 3000000
    if (player.tier === 'C') capModifier = 2000000
    if (player.tier === 'D') capModifier = 1000000
  } else if (trend === 'down') {
    if (player.tier === 'A') capModifier = -5000000
    if (player.tier === 'B') capModifier = -7000000
    if (player.tier === 'C') capModifier = -10000000
    if (player.tier === 'D') capModifier = -15000000
  }
  return capModifier
}

const teamSalary = computed(() => myTeam.value.reduce((sum, p) => sum + getDynamicPrice(p), 0))

const filteredPlayers = computed(() => {
  let list = players.value
  if (selectedTierFilter.value !== 'All') {
    list = list.filter(p => p.tier === selectedTierFilter.value)
  }
  if (isTrading.value && selectedTradePlayer.value) {
    // Only filter by position if trading a STARTER
    if (!selectedTradePlayer.value.isBench && selectedTradePlayer.value.lineupPosition) {
      const requiredPos = selectedTradePlayer.value.lineupPosition
      list = list.filter(p => p.position.includes(requiredPos))
    }
    // If trading a bench player, we do NOT filter the list by position!
  }
  return list
})

const currentPage = ref(1)
const paginatedPlayers = computed(() => {
  const start = (currentPage.value - 1) * 50
  const end = start + 50
  return filteredPlayers.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredPlayers.value.length / 50))

const draggedPlayer = ref<Player | null>(null)

const onDragStart = (e: DragEvent, player: Player) => {
  draggedPlayer.value = player
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.dropEffect = 'move'
  }
}

const onDrop = (targetPlayer: Player) => {
  if (!draggedPlayer.value || draggedPlayer.value.id === targetPlayer.id) return

  const source = myTeam.value.find(p => p.id === draggedPlayer.value!.id)
  const target = myTeam.value.find(p => p.id === targetPlayer.id)

  if (!source || !target || source.id === target.id) return

  // Check compatibility
  const targetNeeds = target.isBench ? '' : target.lineupPosition
  const sourceNeeds = source.isBench ? '' : source.lineupPosition
  
  const sourceCanPlayTarget = targetNeeds ? source.position.includes(targetNeeds) : true
  const targetCanPlaySource = sourceNeeds ? target.position.includes(sourceNeeds) : true

  if (sourceCanPlayTarget && targetCanPlaySource) {
    if (source.isBench && target.isBench) {
      // Both are bench players. Swap their indices in the array to visually reorder them
      const sourceIdx = myTeam.value.findIndex(p => p.id === source.id)
      const targetIdx = myTeam.value.findIndex(p => p.id === target.id)
      
      const temp = myTeam.value[sourceIdx]
      myTeam.value[sourceIdx] = myTeam.value[targetIdx]
      myTeam.value[targetIdx] = temp
    } else {
      // Swap lineupPosition and isBench
      const tempLineupPos = source.lineupPosition
      const tempIsBench = source.isBench

      source.lineupPosition = target.lineupPosition
      source.isBench = target.isBench

      target.lineupPosition = tempLineupPos
      target.isBench = tempIsBench

      // Resort myTeam
      const posOrder: Record<string, number> = { 'PG': 1, 'SG': 2, 'SF': 3, 'PF': 4, 'C': 5 }
      myTeam.value.sort((a, b) => {
        const aWeight = (a.isBench ? 10 : 0) + (posOrder[a.lineupPosition || ''] || 9)
        const bWeight = (b.isBench ? 10 : 0) + (posOrder[b.lineupPosition || ''] || 9)
        return aWeight - bWeight
      })
    }
  }

  draggedPlayer.value = null
}

const onDragEnd = () => {
  draggedPlayer.value = null
}

const canTradeFor = (initiator: Player | null, target: Player) => {
  if (!initiator) return false;
  const tierWeight: Record<string, number> = { 'S': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
  return (tierWeight[target.tier] || 0) <= (tierWeight[initiator.tier] || 0);
}

const executeTrade = (targetPlayer: Player) => {
  if (!selectedTradePlayer.value) return
  if (targetPlayer.id === props.player.id) return
  if (myTeam.value.some(p => p.id === targetPlayer.id)) {
    alert('這名球員已經在你的陣容中了！')
    return
  }
  
  pendingTrade.value = {
    source: selectedTradePlayer.value,
    target: targetPlayer
  }
}

const confirmTradeExecute = () => {
  if (!pendingTrade.value) return
  const { source, target: targetPlayer } = pendingTrade.value
  
  const currentTotal = teamSalary.value
  const tradeOutValue = getDynamicPrice(source)
  const tradeInValue = getDynamicPrice(targetPlayer)
  
  const projectedSalary = currentTotal - tradeOutValue + tradeInValue
  const newSalaryCap = salaryCap.value + getTradeCapModifier(source)
  
  if (projectedSalary > newSalaryCap) {
    alert(`薪資空間不足！這筆交易會讓團隊總薪資達到 ${(projectedSalary / 1000000).toFixed(1)}M，超過 ${(newSalaryCap / 1000000).toFixed(1)}M 上限。`)
    pendingTrade.value = null
    return
  }
  
  const playerIndex = myTeam.value.findIndex(p => p.id === source.id)
  if (playerIndex > -1) {
    salaryCap.value = newSalaryCap

    const newLineupPos = source.lineupPosition
    const newIsBench = source.isBench
    
    const newPlayerObj = { 
      ...targetPlayer, 
      lineupPosition: newLineupPos, 
      isBench: newIsBench
      // Keep targetPlayer's existing originalTier and originalPrice to maintain trend arrows
    }
    myTeam.value.splice(playerIndex, 1, newPlayerObj)
    
    // Auto re-sort team
    const posOrder: Record<string, number> = { 'PG': 1, 'SG': 2, 'SF': 3, 'PF': 4, 'C': 5 }
    myTeam.value.sort((a, b) => {
      const aWeight = (a.isBench ? 10 : 0) + (posOrder[a.lineupPosition || ''] || 9)
      const bWeight = (b.isBench ? 10 : 0) + (posOrder[b.lineupPosition || ''] || 9)
      return aWeight - bWeight
    })
  }

  isTrading.value = false
  selectedTradePlayer.value = null
  pendingTrade.value = null
}

const cancelTrade = () => {
  selectedTradePlayer.value = null
  isTrading.value = false
}

const fetchPlayers = async () => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase credentials missing')
    }
    const { data, error: sbError } = await supabase.from('players').select('*').order('score', { ascending: false })
    if (sbError) throw sbError
    players.value = data || []
    error.value = null
  } catch (e: any) {
    console.error('Fetch error:', e)
    if (players.value.length === 0) {
      error.value = '無法連接即時伺服器'
      players.value = fallbackPlayers.map((p: any) => p.id === props.player.id ? props.player : p)
    }
  } finally {
    loading.value = false
    const tierWeight: Record<string, number> = { 'S': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1 }
    players.value.sort((a, b) => {
      const aW = tierWeight[a.tier] || 0
      const bW = tierWeight[b.tier] || 0
      if (aW !== bW) return bW - aW
      return b.score - a.score
    })
    if (myTeam.value.length === 0) {
      if (props.initialTeam && props.initialTeam.length === 10) {
        myTeam.value = props.initialTeam
      } else {
        generateTeammates()
      }
    }
  }
}

const setupRealtime = () => {
  if (!supabaseUrl || !supabaseAnonKey) return

  realtimeChannel = supabase
    .channel('public:players')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players' }, payload => {
      const updatedPlayer = payload.new as Player
      const index = players.value.findIndex(p => p.id === updatedPlayer.id)
      if (index !== -1) {
        players.value[index] = { ...players.value[index], ...updatedPlayer }
        // Re-sort immediately to trigger TransitionGroup animations
        const tierWeight: Record<string, number> = { 'S': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1 }
        players.value.sort((a, b) => {
          const aW = tierWeight[a.tier] || 0
          const bW = tierWeight[b.tier] || 0
          if (aW !== bW) return bW - aW
          return b.score - a.score
        })
        
        // Also update the player in myTeam if they exist
        const teamIndex = myTeam.value.findIndex(p => p.id === updatedPlayer.id)
        if (teamIndex !== -1) {
          myTeam.value[teamIndex] = { ...myTeam.value[teamIndex], ...updatedPlayer }
        }
      }
    })
    .subscribe()
}

onMounted(() => {
  fetchPlayers()
  setupRealtime()
  
  // Fallback fake polling ONLY if we have an error (e.g. no supabase)
  if (error.value) {
    realtimeChannel = window.setInterval(() => {
      players.value = players.value.map(p => {
        // 首發球星(建隊基石)保底 90 分，不會掉到 B 級
        const minBound = p.id === props.player.id ? 90 : 60
        const newScore = Math.max(minBound, Math.min(100, p.score + Math.floor(Math.random() * 3) - 1))
        let newTier = p.tier
        if (newScore >= 95) newTier = 'S'
        else if (newScore >= 90) newTier = 'A'
        else if (newScore >= 85) newTier = 'B'
        else if (newScore >= 77) newTier = 'C'
        else newTier = 'D'
        return {
          ...p,
          score: newScore,
          tier: newTier,
          pts: +(p.pts + (Math.random() * 0.4 - 0.2)).toFixed(1)
        }
      })
      const tierWeight: Record<string, number> = { 'S': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1 }
      players.value.sort((a, b) => {
        const aW = tierWeight[a.tier] || 0
        const bW = tierWeight[b.tier] || 0
        if (aW !== bW) return bW - aW
        return b.score - a.score
      })
      
      // Update myTeam scores and tiers dynamically in fallback mode
      myTeam.value = myTeam.value.map(member => {
        const updated = players.value.find(p => p.id === member.id)
        return updated ? { ...member, score: updated.score, tier: updated.tier, pts: updated.pts } : member
      })
    }, 30000)
  }
})

onUnmounted(() => {
  if (typeof realtimeChannel === 'number') clearInterval(realtimeChannel)
  else if (realtimeChannel) supabase.removeChannel(realtimeChannel)
})

const getTierClass = (tier: string) => `tier-bg-${tier}`
const getTierBorder = (tier: string) => {
  const map: Record<string, string> = { 'S': 'border-yellow-500/50', 'A': 'border-purple-500/50', 'B': 'border-blue-500/50', 'C': 'border-green-500/50', 'D': 'border-gray-400/50' }
  return map[tier] || 'border-gray-700'
}
</script>

<template>
  <div class="space-y-12">
    <!-- My Team Section (Basketball Style) -->
    <section class="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-b from-orange-900 to-gray-950 border border-orange-500/30 p-8 md:p-12">
      <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      
      <div class="relative z-10 flex flex-col items-center gap-8">
        <div class="flex items-center justify-between w-full">
          <div class="flex flex-col md:flex-row md:items-center gap-4">
            <h2 class="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500 uppercase transform -skew-x-6 drop-shadow-lg">
              球隊陣容
            </h2>
            <div class="px-4 py-1.5 rounded-full bg-black/50 border border-orange-500/30 text-sm font-black italic tracking-widest text-orange-200 shadow-inner">
              總薪資: <span :class="['font-mono', teamSalary > salaryCap ? 'text-red-400' : 'text-green-400']">${{ (teamSalary / 1000000).toFixed(1) }}M</span> / ${{ (salaryCap / 1000000).toFixed(1) }}M
            </div>
          </div>
          <div class="flex gap-3">
            <button 
              v-if="!isGameStarted"
              @click="generateTeammates" 
              class="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold italic tracking-wider rounded-full border border-gray-600 transition-colors"
            >
              重新尋找隊友
            </button>
            <button 
              v-if="!isGameStarted"
              :disabled="myTeam.length !== 10"
              @click="lockTeam" 
              class="px-8 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-black italic uppercase tracking-widest rounded-full shadow-lg hover:shadow-orange-500/50 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              :title="myTeam.length !== 10 ? '必須湊齊 10 名球員' : ''"
            >
              進入遊戲
            </button>
            <div v-else class="flex gap-3">
              <button 
                @click="openDifficultyModal" 
                :disabled="myTeam.length !== 10"
                :class="['px-6 py-2 font-bold italic uppercase tracking-widest rounded-full shadow-lg transition-all transform active:scale-95', myTeam.length === 10 ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white hover:shadow-green-500/50 hover:scale-105' : 'bg-gray-800 text-gray-500 cursor-not-allowed']"
                :title="myTeam.length !== 10 ? '必須湊齊 10 名球員' : ''"
              >
                進行例行賽
              </button>
              <button v-if="!isTrading" @click="isTrading = true" class="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold italic uppercase tracking-widest rounded-full shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105 active:scale-95">
                啟動交易模式
              </button>
              <button v-else @click="cancelTrade" class="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 text-white font-bold italic uppercase tracking-widest rounded-full shadow-lg hover:shadow-red-500/50 transition-all transform hover:scale-105 active:scale-95">
                取消交易
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
          <div 
            v-for="member in myTeam" 
            :key="member.id" 
            draggable="true"
            @dragstart="onDragStart($event, member)"
            @dragover.prevent
            @drop="onDrop(member)"
            @dragend="onDragEnd"
            @click="isTrading && member.id !== props.player.id ? selectedTradePlayer = member : null"
            :class="[
              'relative rounded-xl overflow-hidden p-4 flex flex-col justify-between aspect-[3/4] transform transition-transform border shadow-xl', 
              !draggedPlayer && !isTrading ? 'hover:-translate-y-2 cursor-grab active:cursor-grabbing' : '',
              isTrading && member.id !== props.player.id ? 'cursor-pointer hover:-translate-y-2' : '',
              isTrading && member.id === props.player.id ? 'opacity-50 grayscale cursor-not-allowed' : '',
              getTierClass(member.tier), 
              member.id === props.player.id && !isTrading ? 'ring-4 ring-orange-400 scale-105 z-10' : '',
              isTrading && selectedTradePlayer?.id === member.id ? 'ring-4 ring-blue-400 scale-105 z-20 shadow-blue-500/50' : '',
              draggedPlayer && draggedPlayer.id !== member.id && draggedPlayer.position.includes(member.lineupPosition || '') && member.position.includes(draggedPlayer.lineupPosition || '') ? 'ring-4 ring-green-400 scale-105 opacity-100 z-20 shadow-green-500/50 cursor-pointer' : '',
              draggedPlayer && draggedPlayer.id !== member.id && !(draggedPlayer.position.includes(member.lineupPosition || '') && member.position.includes(draggedPlayer.lineupPosition || '')) ? 'opacity-30 grayscale blur-[1px]' : ''
            ]"
          >
            <div class="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-0"></div>
            
            <div class="relative z-10 flex justify-between items-start">
              <span class="px-2 py-1 rounded bg-black/50 backdrop-blur-sm text-xs font-black shadow-lg uppercase border border-white/20">
                {{ member.isBench ? '替補 ' : '' }}{{ member.lineupPosition || member.position }}
              </span>
              <span class="text-2xl font-black opacity-80">{{ member.score }}</span>
            </div>

            <div class="relative z-10 mt-auto text-center flex flex-col items-center w-full">
              <div v-if="member.id === props.player.id" class="text-orange-400 text-xs font-black uppercase mb-1 tracking-widest drop-shadow-md">建隊基石</div>
              <h3 class="text-lg font-black text-white leading-tight mb-1 break-words text-balance">{{ member.name }}</h3>
              <p class="text-green-400 font-mono font-bold text-xs mb-2">
                ${{ (getDynamicPrice(member) / 1000000).toFixed(1) }}M
                <span v-if="getTrend(member) === 'up'" class="text-green-400 ml-1 drop-shadow-md">↑</span>
                <span v-if="getTrend(member) === 'down'" class="text-red-400 ml-1 drop-shadow-md">↓</span>
              </p>
              
              <button 
                v-if="isGameStarted && member.id !== props.player.id"
                @click.stop="startTrade(member)"
                :class="['px-3 py-1.5 rounded text-xs font-bold uppercase transition-all w-full', (isTrading && selectedTradePlayer?.id === member.id) ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/50' : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-gray-600 hover:border-gray-400']"
              >
                {{ (isTrading && selectedTradePlayer?.id === member.id) ? '選取中' : '賣出換人' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Leaderboard Section -->
    <section id="leaderboard">
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h3 class="text-2xl font-black tracking-tight flex items-center gap-3">
          全聯盟即時排行榜
          <span v-if="!error" class="flex h-3 w-3 relative">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </h3>
        
        <div class="flex flex-wrap gap-2">
          <button 
            v-for="tier in ['All', 'S', 'A', 'B', 'C', 'D']" 
            :key="tier"
            @click="selectedTierFilter = tier; currentPage = 1"
            :class="[
              'px-3 py-1 rounded-full text-xs font-bold transition-all border',
              selectedTierFilter === tier ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
            ]"
          >
            {{ tier === 'All' ? '全部' : tier + ' 級' }}
          </button>
        </div>
      </div>

      <div class="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
        <!-- Table Header -->
        <div class="grid grid-cols-[auto_1fr_auto_1fr] md:grid-cols-[auto_3fr_1fr_2fr_auto] gap-4 p-4 border-b border-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-950/50">
          <div class="w-8 text-center">#</div>
          <div>球員</div>
          <div class="text-center">綜合分數</div>
          <div class="hidden md:grid grid-cols-6 gap-2 text-center">
            <span>PTS</span><span>REB</span><span>AST</span><span>STL</span><span>BLK</span><span>TOV</span>
          </div>
          <div v-if="isTrading" class="text-right pr-2">交易</div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="p-12 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
        </div>

        <!-- Table Body -->
        <div 
          v-else
          class="relative"
        >
          <div 
            v-for="(p, index) in paginatedPlayers" 
            :key="p.id"
            :class="['grid grid-cols-[auto_1fr_auto_1fr] md:grid-cols-[auto_3fr_1fr_2fr_auto] gap-4 p-4 items-center border-b border-gray-800/50 transition-colors hover:bg-gray-800/50', {'bg-indigo-900/10': p.id === props.player.id}]"
          >
            <div class="w-8 text-center font-bold text-gray-600">{{ (currentPage - 1) * 50 + index + 1 }}</div>
            
            <div class="flex items-center gap-3">
              <span :class="['w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border shadow-sm', getTierClass(p.tier), getTierBorder(p.tier)]">
                {{ p.tier }}
              </span>
              <div>
                <div class="font-bold text-white">{{ p.name }}</div>
                <div class="text-xs text-gray-500">{{ p.team }} • {{ p.position }} • 
                  <span class="text-green-500/80 font-mono">
                    ${{ (getDynamicPrice(p) / 1000000).toFixed(1) }}M
                    <span v-if="getTrend(p) === 'up'" class="text-green-400 ml-1">↑</span>
                    <span v-if="getTrend(p) === 'down'" class="text-red-400 ml-1">↓</span>
                  </span>
                </div>
              </div>
            </div>

            <div class="text-right">
              <div class="text-2xl font-black text-white/90">{{ p.score }}</div>
              <div class="text-xs text-gray-500 tracking-widest uppercase">OVR</div>
            </div>

            <div class="hidden md:grid grid-cols-6 gap-2 text-center text-sm font-mono text-gray-300 bg-black/20 rounded-lg p-2 border border-gray-800/50">
              <div class="flex flex-col"><span class="text-[10px] text-gray-500">PTS</span>{{ p.pts }}</div>
              <div class="flex flex-col"><span class="text-[10px] text-gray-500">REB</span>{{ p.reb }}</div>
              <div class="flex flex-col"><span class="text-[10px] text-gray-500">AST</span>{{ p.ast }}</div>
              <div class="flex flex-col"><span class="text-[10px] text-gray-500">STL</span>{{ p.stl }}</div>
              <div class="flex flex-col"><span class="text-[10px] text-gray-500">BLK</span>{{ p.blk }}</div>
              <div class="flex flex-col"><span class="text-[10px] text-gray-500">TOV</span>{{ p.tov }}</div>
            </div>
            
            <!-- Trade Button -->
            <div v-if="isTrading && p.id !== props.player.id" class="text-right">
              <button 
                v-if="selectedTradePlayer && canTradeFor(selectedTradePlayer, p)"
                @click="executeTrade(p)"
                class="px-3 py-1 rounded text-xs font-bold uppercase transition-all bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg"
              >
                Trade
              </button>
              <button 
                v-else-if="selectedTradePlayer && !canTradeFor(selectedTradePlayer, p)"
                disabled
                class="px-3 py-1 rounded text-xs font-bold uppercase transition-all bg-gray-800 text-red-500/50 cursor-not-allowed border border-red-900/30"
                title="只能向下交易"
              >
                不可越級
              </button>
              <button 
                v-else
                disabled
                class="px-3 py-1 rounded text-xs font-bold uppercase transition-all bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
              >
                Trade
              </button>
            </div>
            <div v-else-if="isTrading" class="text-right">
              <div class="text-xs text-gray-500 italic">不可交易</div>
            </div>
          </div>
        </div>

        <!-- Pagination Controls -->
        <div v-if="totalPages > 1" class="p-4 border-t border-gray-800 flex justify-center items-center gap-4 bg-gray-950/50">
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="px-4 py-2 rounded-lg bg-gray-800 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            上一頁
          </button>
          <span class="text-gray-400 font-bold">
            第 <span class="text-white">{{ currentPage }}</span> 頁 / 共 {{ totalPages }} 頁
          </span>
          <button 
            @click="currentPage++" 
            :disabled="currentPage === totalPages"
            class="px-4 py-2 rounded-lg bg-gray-800 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            下一頁
          </button>
        </div>
      </div>
    </section>

    <!-- Trade Confirmation Modal -->
    <div v-if="pendingTrade" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">
        <div class="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
          <h3 class="text-xl font-black text-white flex items-center gap-2">
            <span class="text-indigo-400">🔄</span> 確認交易
          </h3>
          <button @click="pendingTrade = null" class="text-gray-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>
        
        <div class="p-6 space-y-6">
          <p class="text-center text-gray-300">
            確定要以 <span class="font-bold text-white">{{ pendingTrade.source.name }}</span> 交易成 <span class="font-bold text-white">{{ pendingTrade.target.name }}</span> 嗎？
          </p>

          <div class="flex items-center justify-center gap-6">
            <!-- Source Player -->
            <div class="flex flex-col items-center flex-1 bg-red-900/10 p-4 rounded-xl border border-red-500/20 relative">
              <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">賣出</div>
              <span :class="['w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shadow-lg mb-2', getTierClass(pendingTrade.source.tier), getTierBorder(pendingTrade.source.tier)]">
                {{ pendingTrade.source.tier }}
              </span>
              <div class="font-black text-white text-center text-balance">{{ pendingTrade.source.name }}</div>
              <div class="text-xs text-gray-400 mt-1 font-mono">
                ${{ (getDynamicPrice(pendingTrade.source) / 1000000).toFixed(1) }}M
                <span v-if="getTrend(pendingTrade.source) === 'up'" class="text-green-400 ml-1">↑</span>
                <span v-if="getTrend(pendingTrade.source) === 'down'" class="text-red-400 ml-1">↓</span>
              </div>
            </div>

            <!-- Arrow -->
            <div class="text-3xl text-gray-600 animate-pulse">➔</div>

            <!-- Target Player -->
            <div class="flex flex-col items-center flex-1 bg-green-900/10 p-4 rounded-xl border border-green-500/20 relative">
              <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">買入</div>
              <span :class="['w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shadow-lg mb-2', getTierClass(pendingTrade.target.tier), getTierBorder(pendingTrade.target.tier)]">
                {{ pendingTrade.target.tier }}
              </span>
              <div class="font-black text-white text-center text-balance">{{ pendingTrade.target.name }}</div>
              <div class="text-xs text-gray-400 mt-1 font-mono">
                ${{ (getDynamicPrice(pendingTrade.target) / 1000000).toFixed(1) }}M
                <span v-if="getTrend(pendingTrade.target) === 'up'" class="text-green-400 ml-1">↑</span>
                <span v-if="getTrend(pendingTrade.target) === 'down'" class="text-red-400 ml-1">↓</span>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-950 p-4 rounded-lg border border-gray-800 text-sm">
            <div class="flex justify-between text-gray-400 mb-2">
              <span>交易後總薪資估算</span>
              <span :class="{'text-red-400': (teamSalary - getDynamicPrice(pendingTrade.source) + getDynamicPrice(pendingTrade.target)) > (salaryCap + getTradeCapModifier(pendingTrade.source))}">
                ${{ ((teamSalary - getDynamicPrice(pendingTrade.source) + getDynamicPrice(pendingTrade.target)) / 1000000).toFixed(1) }}M / <span class="text-white font-bold">${{ ((salaryCap + getTradeCapModifier(pendingTrade.source)) / 1000000).toFixed(1) }}M</span>
              </span>
            </div>
            
            <div v-if="getTradeCapModifier(pendingTrade.source) !== 0" class="flex justify-between text-xs mt-2 pt-2 border-t border-gray-800">
              <span class="text-gray-500">賣出收益影響</span>
              <span :class="getTradeCapModifier(pendingTrade.source) > 0 ? 'text-green-400' : 'text-red-400'">
                {{ getTradeCapModifier(pendingTrade.source) > 0 ? '+' : '' }}${{ (getTradeCapModifier(pendingTrade.source) / 1000000).toFixed(1) }}M 薪資空間
              </span>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-gray-800 flex justify-end gap-3 bg-gray-900">
          <button 
            @click="pendingTrade = null" 
            class="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            取消
          </button>
          <button 
            @click="confirmTradeExecute" 
            class="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:scale-105 active:scale-95"
          >
            確定交易
          </button>
        </div>
      </div>
    </div>

    <!-- Difficulty Modal -->
    <div v-if="showDifficultyModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        <h2 class="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300 mb-6 text-center">選擇難度</h2>
        
        <div class="space-y-4">
          <button @click="startMatchup('Pro')" class="w-full p-4 rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-gray-700 hover:border-gray-500 transition-all text-left group flex justify-between items-center">
            <div>
              <div class="font-bold text-xl text-white group-hover:text-blue-400">職業 (Pro)</div>
              <div class="text-sm text-gray-400">對手包含 1 名 A 級球星帶隊</div>
            </div>
            <div class="text-2xl">🥉</div>
          </button>
          
          <button @click="startMatchup('All-Star')" class="w-full p-4 rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-gray-700 hover:border-gray-500 transition-all text-left group flex justify-between items-center">
            <div>
              <div class="font-bold text-xl text-white group-hover:text-purple-400">全明星 (All-Star)</div>
              <div class="text-sm text-gray-400">對手包含 1 名 S 級、2 名 A 級球星</div>
            </div>
            <div class="text-2xl">🥈</div>
          </button>
          
          <button @click="startMatchup('HallOfFame')" class="w-full p-4 rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-gray-700 hover:border-gray-500 transition-all text-left group flex justify-between items-center shadow-lg shadow-orange-500/10">
            <div>
              <div class="font-bold text-xl text-white group-hover:text-orange-400">名人堂 (Hall of Fame)</div>
              <div class="text-sm text-gray-400">對手包含 2 名 S 級、3 名 A 級球星</div>
            </div>
            <div class="text-2xl">🏆</div>
          </button>
        </div>

        <button @click="showDifficultyModal = false" class="mt-6 w-full py-3 rounded-xl border border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scaleY(0.01) translate(30px, 0);
}

.list-leave-active {
  position: absolute;
}
</style>
