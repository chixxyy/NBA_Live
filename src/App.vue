<script setup lang="ts">
import { ref } from 'vue'
import type { Player } from './types'
import DraftScreen from './components/DraftScreen.vue'
import Dashboard from './components/Dashboard.vue'

const currentView = ref<'draft' | 'dashboard'>('draft')
const selectedPlayer = ref<Player | null>(null)

const onSelectPlayer = (player: Player) => {
  selectedPlayer.value = player
  currentView.value = 'dashboard'
}

const onBack = () => {
  currentView.value = 'draft'
  selectedPlayer.value = null
}
</script>

<template>
  <div class="min-h-screen bg-orange-950 text-white font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
    <!-- Navbar -->
    <nav class="sticky top-0 z-50 bg-orange-950/80 backdrop-blur-md border-b border-orange-800 px-6 py-4 flex items-center justify-between shadow-lg">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-red-500 flex items-center justify-center font-bold text-lg shadow-lg shadow-orange-500/50 transform -skew-x-6">🏀</div>
        <h1 class="text-xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">NBA Live</h1>
      </div>
      <button 
        v-if="currentView === 'dashboard'" 
        @click="onBack"
        class="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        重新選擇
      </button>
    </nav>

    <main class="max-w-7xl mx-auto p-6 md:p-10">
      <Transition name="fade" mode="out-in">
        <DraftScreen v-if="currentView === 'draft'" @select="onSelectPlayer" />
        <Dashboard v-else-if="currentView === 'dashboard' && selectedPlayer" :player="selectedPlayer" />
      </Transition>
    </main>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
