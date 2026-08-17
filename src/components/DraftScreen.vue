<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Player } from '../types'

const emit = defineEmits<{
  (e: 'select', player: Player): void
}>()

const featuredStars = ref<Player[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const fetchFeaturedStars = async () => {
  loading.value = true
  
  // Directly assign the Franchise players (IDs 1 to 5)
  featuredStars.value = [
    { id: '1', name: 'Tyrese Haliburton', team: 'IND', position: 'PG', price: 25000000, score: 90, tier: 'A', pts: 20.1, reb: 3.9, ast: 10.9, stl: 1.2, blk: 0.7, tov: 2.3 },
    { id: '2', name: 'Anthony Edwards', team: 'MIN', position: 'SG/SF', price: 26000000, score: 91, tier: 'A', pts: 25.9, reb: 5.4, ast: 5.1, stl: 1.3, blk: 0.5, tov: 3.1 },
    { id: '3', name: 'Kawhi Leonard', team: 'LAC', position: 'SF/PF', price: 28000000, score: 92, tier: 'A', pts: 23.7, reb: 6.1, ast: 3.6, stl: 1.6, blk: 0.9, tov: 1.8 },
    { id: '4', name: 'Zion Williamson', team: 'NOP', position: 'PF/C', price: 24000000, score: 90, tier: 'A', pts: 22.9, reb: 5.8, ast: 5.0, stl: 1.1, blk: 0.7, tov: 2.8 },
    { id: '5', name: 'Bam Adebayo', team: 'MIA', position: 'C/PF', price: 27000000, score: 90, tier: 'A', pts: 19.3, reb: 10.4, ast: 3.9, stl: 1.1, blk: 0.9, tov: 2.3 },
  ]
  
  loading.value = false
}

onMounted(() => {
  fetchFeaturedStars()
})

const getTierClass = (tier: string) => {
  return `tier-bg-${tier}`
}
</script>

<template>
  <div class="space-y-10">
    <div class="text-center space-y-4">
      <h2 class="text-4xl md:text-6xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-orange-300 via-orange-500 to-red-600 drop-shadow-sm">
        選擇你的首發球星
      </h2>
      <p class="text-gray-400 text-lg max-w-2xl mx-auto">
        從焦點球星中選擇一位作為你的建隊基石。
      </p>
    </div>

    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>
    
    <div v-else-if="error && featuredStars.length === 0" class="text-center text-red-400 bg-red-400/10 p-6 rounded-xl border border-red-500/20">
      {{ error }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <div 
        v-for="player in featuredStars" 
        :key="player.id"
        @click="emit('select', player)"
        class="group relative overflow-hidden rounded-2xl bg-gray-800 border border-gray-700 p-6 cursor-pointer hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:border-gray-500 flex flex-col justify-between aspect-[3/4]"
      >
        <div class="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/90 z-0"></div>
        
        <div class="relative z-10 flex justify-between items-start">
          <span :class="['px-3 py-1 rounded-full text-sm font-bold shadow-lg', getTierClass(player.tier)]">
            {{ player.tier }} 級
          </span>
          <span class="text-3xl font-black text-gray-700 group-hover:text-gray-500 transition-colors">
            {{ player.score }}
          </span>
        </div>

        <div class="relative z-10 mt-auto">
          <div class="flex items-center justify-between mb-1">
            <p class="text-orange-400 font-bold italic text-sm tracking-wider uppercase">{{ player.team }} • {{ player.position }}</p>
            <p class="text-green-400 font-mono font-bold">${{ (player.price / 1000000).toFixed(0) }}M</p>
          </div>
          <h3 class="text-2xl font-black italic text-white leading-tight mb-2 group-hover:text-orange-300 transition-colors">
            {{ player.name }}
          </h3>
          <div class="w-8 h-1 bg-orange-900 rounded-full group-hover:w-full group-hover:bg-orange-500 transition-all duration-500"></div>
        </div>
      </div>
    </div>
  </div>
</template>
