<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import type { FoodItem } from '@/types'

const emit = defineEmits<{
  close: []
  foodFound: [food: FoodItem]
}>()

const html5QrCode = ref<Html5Qrcode | null>(null)
const isScanning = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)
const scannedCode = ref<string>('')
const manualBarcode = ref<string>('')

onMounted(() => {
  startScanner()
})

onUnmounted(() => {
  stopScanner()
})

async function startScanner() {
  try {
    const scanner = new Html5Qrcode('barcode-reader')
    html5QrCode.value = scanner

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 150 },
      aspectRatio: 1.0,
      formatsToSupport: [
        0,  // EAN_13
        1,  // EAN_8
        3,  // UPC_A
        4,  // UPC_E
      ]
    }

    await scanner.start(
      { facingMode: 'environment' },
      config,
      onScanSuccess,
      onScanError
    )

    isScanning.value = true
    error.value = null
  } catch (err) {
    console.error('Failed to start scanner:', err)
    error.value = 'Unable to access camera. Please check permissions or enter barcode manually.'
    isScanning.value = false
  }
}

async function stopScanner() {
  if (html5QrCode.value && isScanning.value) {
    try {
      await html5QrCode.value.stop()
      html5QrCode.value.clear()
    } catch (err) {
      console.error('Error stopping scanner:', err)
    }
  }
}

async function onScanSuccess(decodedText: string) {
  scannedCode.value = decodedText
  await lookupBarcode(decodedText)
}

function onScanError(_errorMessage: string) {
  // Ignore scan errors as they're very common during scanning
  // console.log('Scan error:', _errorMessage)
}

async function lookupBarcode(barcode: string) {
  if (isLoading.value) return

  isLoading.value = true
  error.value = null

  try {
    // Query Open Food Facts API
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const data = await response.json()

    if (data.status === 1 && data.product) {
      const product = data.product

      // Extract nutritional information (per 100g)
      const nutriments = product.nutriments || {}

      const foodItem: FoodItem = {
        id: `barcode-${barcode}`,
        name: product.product_name || 'Unknown Product',
        calories: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy_100g'] / 4.184 || 0),
        protein: parseFloat(nutriments.proteins_100g || 0),
        carbs: parseFloat(nutriments.carbohydrates_100g || 0),
        fat: parseFloat(nutriments.fat_100g || 0),
        servingSize: product.serving_size || '100g'
      }

      // Pause scanning temporarily
      await stopScanner()

      // Emit the found food item
      emit('foodFound', foodItem)
    } else {
      error.value = `Product not found for barcode: ${barcode}. Try entering it manually.`
      // Restart scanning after a short delay
      setTimeout(() => {
        error.value = null
        if (!isScanning.value) {
          startScanner()
        }
      }, 3000)
    }
  } catch (err) {
    console.error('Failed to lookup barcode:', err)
    error.value = 'Failed to lookup product. Please try again.'
  } finally {
    isLoading.value = false
  }
}

async function searchManualBarcode() {
  if (!manualBarcode.value) return
  scannedCode.value = manualBarcode.value
  await stopScanner()
  await lookupBarcode(manualBarcode.value)
}

function close() {
  stopScanner()
  emit('close')
}
</script>

<template>
  <div class="modal-overlay" @click="close">
    <div class="modal barcode-modal" @click.stop>
      <div class="modal-header">
        <h3>Scan Barcode</h3>
        <button @click="close" class="close-btn">×</button>
      </div>
      <div class="modal-body">
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="isLoading" class="loading-message">
          Looking up product...
        </div>

        <div id="barcode-reader" class="barcode-reader"></div>

        <div class="manual-input">
          <p class="hint">Can't scan? Enter barcode manually:</p>
          <div class="input-group">
            <input
              v-model="manualBarcode"
              type="text"
              placeholder="Enter barcode number"
              @keyup.enter="searchManualBarcode"
            />
            <button @click="searchManualBarcode" :disabled="!manualBarcode">
              Search
            </button>
          </div>
        </div>

        <div v-if="scannedCode" class="scanned-code">
          Scanned: {{ scannedCode }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.barcode-modal {
  max-width: 500px;
  max-height: 90vh;
}

.barcode-reader {
  width: 100%;
  max-width: 100%;
  margin: 1rem 0;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.error-message {
  background: var(--ios-red);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
}

.loading-message {
  background: var(--ios-blue);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 500;
}

.manual-input {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.hint {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  text-align: center;
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.input-group input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-color);
  color: var(--text-primary);
  font-size: 1rem;
}

.input-group button {
  padding: 0.75rem 1.5rem;
  background: var(--ios-blue);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.input-group button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-group button:not(:disabled):hover {
  opacity: 0.9;
}

.scanned-code {
  margin-top: 1rem;
  padding: 0.75rem;
  background: var(--bg-light);
  border-radius: 8px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
}
</style>
