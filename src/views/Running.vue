<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import NavBar from '@/components/NavBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Position {
  lat: number
  lng: number
  timestamp: number
}

const map = ref<L.Map | null>(null)
const routePolyline = ref<L.Polyline | null>(null)
const currentMarker = ref<L.Marker | null>(null)

const isTracking = ref(false)
const isPaused = ref(false)
const positions = ref<Position[]>([])
const watchId = ref<number | null>(null)

const distance = ref(0) // in meters
const duration = ref(0) // in seconds
const startTime = ref(0)
const pausedTime = ref(0)
const timerInterval = ref<number | null>(null)

const hasLocationPermission = ref(false)
const locationError = ref('')

// Computed stats
const distanceKm = computed(() => (distance.value / 1000).toFixed(2))
const durationFormatted = computed(() => {
  const hours = Math.floor(duration.value / 3600)
  const minutes = Math.floor((duration.value % 3600) / 60)
  const seconds = duration.value % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const pace = computed(() => {
  if (distance.value === 0 || duration.value === 0) return '0:00'
  const km = distance.value / 1000
  const minutes = duration.value / 60
  const paceMinPerKm = minutes / km
  const paceMin = Math.floor(paceMinPerKm)
  const paceSec = Math.floor((paceMinPerKm - paceMin) * 60)
  return `${paceMin}:${paceSec.toString().padStart(2, '0')}`
})

const caloriesBurned = computed(() => {
  // Rough estimate: 60 calories per km for running
  const km = distance.value / 1000
  return Math.round(km * 60)
})

onMounted(() => {
  initMap()
  checkLocationPermission()
})

onUnmounted(() => {
  stopTracking()
  if (map.value) {
    map.value.remove()
  }
})

function initMap() {
  // Default center (will update when GPS is available)
  const mapElement = document.getElementById('map')
  if (!mapElement) return

  map.value = L.map('map').setView([37.7749, -122.4194], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map.value as any)

  // Fix Leaflet's default icon path issue
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

async function checkLocationPermission() {
  if (!navigator.geolocation) {
    locationError.value = 'Geolocation is not supported by your browser'
    return
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      })
    })

    hasLocationPermission.value = true

    // Center map on current location
    if (map.value) {
      map.value.setView([position.coords.latitude, position.coords.longitude], 15)

      // Add marker for current position
      currentMarker.value = L.marker([position.coords.latitude, position.coords.longitude])
        .addTo(map.value as any)
        .bindPopup('You are here')
    }
  } catch (error: any) {
    hasLocationPermission.value = false
    locationError.value = error.message === 'User denied Geolocation'
      ? 'Location permission denied. Please enable location access to use GPS tracking.'
      : 'Unable to get your location. Please check your device settings.'
  }
}

function startTracking() {
  if (!navigator.geolocation || !hasLocationPermission.value) {
    locationError.value = 'Location permission is required to track your run'
    return
  }

  isTracking.value = true
  isPaused.value = false
  startTime.value = Date.now()
  positions.value = []
  distance.value = 0
  duration.value = 0
  pausedTime.value = 0

  // Clear previous route
  if (routePolyline.value && map.value) {
    (map.value as any).removeLayer(routePolyline.value)
    routePolyline.value = null
  }

  // Start timer
  timerInterval.value = window.setInterval(() => {
    if (!isPaused.value) {
      duration.value = Math.floor((Date.now() - startTime.value - pausedTime.value) / 1000)
    }
  }, 1000)

  // Start GPS tracking
  watchId.value = navigator.geolocation.watchPosition(
    (position) => {
      const pos: Position = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: position.timestamp
      }

      positions.value.push(pos)

      // Update current marker
      if (currentMarker.value && map.value) {
        currentMarker.value.setLatLng([pos.lat, pos.lng])
        map.value.panTo([pos.lat, pos.lng])
      }

      // Update route polyline
      if (positions.value.length >= 2) {
        if (!routePolyline.value && map.value) {
          routePolyline.value = L.polyline(
            positions.value.map(p => [p.lat, p.lng]),
            { color: 'blue', weight: 4 }
          ).addTo(map.value as any)
        } else if (routePolyline.value) {
          routePolyline.value.setLatLngs(positions.value.map(p => [p.lat, p.lng]))
        }

        // Calculate total distance
        distance.value = calculateTotalDistance()
      }
    },
    (error) => {
      console.error('GPS tracking error:', error)
      locationError.value = 'GPS tracking error: ' + error.message
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }
  )
}

function pauseTracking() {
  if (!isTracking.value) return

  isPaused.value = true
  const now = Date.now()
  pausedTime.value += now - (startTime.value + duration.value * 1000 + pausedTime.value)
}

function resumeTracking() {
  if (!isTracking.value) return
  isPaused.value = false
}

function stopTracking() {
  if (watchId.value !== null) {
    navigator.geolocation.clearWatch(watchId.value)
    watchId.value = null
  }

  if (timerInterval.value !== null) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }

  isTracking.value = false
  isPaused.value = false

  // Save run to localStorage
  if (positions.value.length > 0) {
    saveRun()
  }
}

function calculateTotalDistance(): number {
  let total = 0
  for (let i = 1; i < positions.value.length; i++) {
    total += getDistanceBetweenPoints(
      positions.value[i - 1],
      positions.value[i]
    )
  }
  return total
}

function getDistanceBetweenPoints(pos1: Position, pos2: Position): number {
  // Haversine formula for calculating distance between two GPS coordinates
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (pos1.lat * Math.PI) / 180
  const φ2 = (pos2.lat * Math.PI) / 180
  const Δφ = ((pos2.lat - pos1.lat) * Math.PI) / 180
  const Δλ = ((pos2.lng - pos1.lng) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

function saveRun() {
  const run = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    distance: distance.value,
    duration: duration.value,
    pace: pace.value,
    calories: caloriesBurned.value,
    positions: positions.value
  }

  const runs = JSON.parse(localStorage.getItem('runs') || '[]')
  runs.push(run)
  localStorage.setItem('runs', JSON.stringify(runs))

  alert(`Run saved! ${distanceKm.value} km in ${durationFormatted.value}`)
}

function resetTracking() {
  stopTracking()
  positions.value = []
  distance.value = 0
  duration.value = 0
  startTime.value = 0
  pausedTime.value = 0

  if (routePolyline.value && map.value) {
    (map.value as any).removeLayer(routePolyline.value)
    routePolyline.value = null
  }
}
</script>

<template>
  <div class="page-wrapper">
    <NavBar />
    <div class="container">
      <div class="running-page">
        <header class="page-header">
          <h2>Running Tracker</h2>
        </header>

        <div v-if="locationError" class="alert alert-error">
          {{ locationError }}
          <button @click="checkLocationPermission" class="retry-btn">Retry</button>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="card stat-card">
            <div class="stat-label">Distance</div>
            <div class="stat-value">{{ distanceKm }}</div>
            <div class="stat-unit">km</div>
          </div>
          <div class="card stat-card">
            <div class="stat-label">Duration</div>
            <div class="stat-value">{{ durationFormatted }}</div>
            <div class="stat-unit">time</div>
          </div>
          <div class="card stat-card">
            <div class="stat-label">Pace</div>
            <div class="stat-value">{{ pace }}</div>
            <div class="stat-unit">min/km</div>
          </div>
          <div class="card stat-card">
            <div class="stat-label">Calories</div>
            <div class="stat-value">{{ caloriesBurned }}</div>
            <div class="stat-unit">kcal</div>
          </div>
        </div>

        <!-- Map -->
        <div class="card map-container">
          <div id="map" class="map"></div>
        </div>

        <!-- Controls -->
        <div class="controls">
          <button
            v-if="!isTracking"
            @click="startTracking"
            :disabled="!hasLocationPermission"
            class="btn btn-start"
          >
            🏃 Start Run
          </button>

          <template v-else>
            <button
              v-if="!isPaused"
              @click="pauseTracking"
              class="btn btn-pause"
            >
              ⏸ Pause
            </button>
            <button
              v-else
              @click="resumeTracking"
              class="btn btn-resume"
            >
              ▶️ Resume
            </button>

            <button
              @click="stopTracking"
              class="btn btn-stop"
            >
              ⏹ Stop & Save
            </button>
          </template>

          <button
            v-if="isTracking"
            @click="resetTracking"
            class="btn btn-reset"
          >
            🔄 Reset
          </button>
        </div>
      </div>
    </div>
    <BottomNav />
  </div>
</template>

<style scoped>
.page-wrapper {
  min-height: 100vh;
}

.running-page {
  padding: 1.5rem 0;
}

@media (max-width: 768px) {
  .running-page {
    padding: 1rem 0;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-error {
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid var(--ios-red);
  color: var(--ios-red);
}

.retry-btn {
  background: var(--ios-red);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  text-align: center;
  padding: 1.5rem 1rem;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.stat-unit {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.map-container {
  padding: 0;
  overflow: hidden;
  margin-bottom: 1.5rem;
  height: 400px;
}

.map {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 150px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-start {
  background: rgba(142, 142, 147, 0.12);
  color: var(--ios-blue);
  border: 1px solid var(--separator);
}

.btn-start:hover:not(:disabled) {
  background: var(--fill-tertiary);
}

.btn-pause {
  background: var(--ios-orange);
  color: white;
}

.btn-resume {
  background: var(--ios-blue);
  color: white;
}

.btn-stop {
  background: var(--ios-red);
  color: white;
}

.btn-reset {
  background: rgba(142, 142, 147, 0.12);
  color: var(--text-primary);
  border: 1px solid var(--separator);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .map-container {
    height: 300px;
  }

  .map {
    min-height: 300px;
  }

  .controls {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
