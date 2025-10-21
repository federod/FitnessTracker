export type UnitSystem = 'metric' | 'imperial'

// Weight conversions
const KG_TO_LBS = 2.20462
const LBS_TO_KG = 1 / KG_TO_LBS

// Distance conversions
const KM_TO_MILES = 0.621371
const MILES_TO_KM = 1 / KM_TO_MILES

// Height conversions
const CM_TO_INCHES = 0.393701
const INCHES_TO_CM = 1 / CM_TO_INCHES

/**
 * Convert weight from kg to the user's preferred unit
 */
export function displayWeight(weightKg: number, unitSystem: UnitSystem): number {
  if (unitSystem === 'imperial') {
    return Number((weightKg * KG_TO_LBS).toFixed(1))
  }
  return Number(weightKg.toFixed(1))
}

/**
 * Convert weight from user's preferred unit to kg (for storage)
 */
export function toKg(weight: number, unitSystem: UnitSystem): number {
  if (unitSystem === 'imperial') {
    return weight * LBS_TO_KG
  }
  return weight
}

/**
 * Get weight unit label
 */
export function getWeightUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'lbs' : 'kg'
}

/**
 * Convert distance from km to the user's preferred unit
 */
export function displayDistance(distanceKm: number, unitSystem: UnitSystem): number {
  if (unitSystem === 'imperial') {
    return Number((distanceKm * KM_TO_MILES).toFixed(2))
  }
  return Number(distanceKm.toFixed(2))
}

/**
 * Convert distance from user's preferred unit to km (for storage)
 */
export function toKm(distance: number, unitSystem: UnitSystem): number {
  if (unitSystem === 'imperial') {
    return distance * MILES_TO_KM
  }
  return distance
}

/**
 * Get distance unit label
 */
export function getDistanceUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'mi' : 'km'
}

/**
 * Get distance unit label (full name)
 */
export function getDistanceUnitFull(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'miles' : 'kilometers'
}

/**
 * Convert height from cm to the user's preferred unit
 */
export function displayHeight(heightCm: number, unitSystem: UnitSystem): number {
  if (unitSystem === 'imperial') {
    return Number((heightCm * CM_TO_INCHES).toFixed(1))
  }
  return Number(heightCm.toFixed(0))
}

/**
 * Convert height from user's preferred unit to cm (for storage)
 */
export function toCm(height: number, unitSystem: UnitSystem): number {
  if (unitSystem === 'imperial') {
    return height * INCHES_TO_CM
  }
  return height
}

/**
 * Get height unit label
 */
export function getHeightUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'in' : 'cm'
}

/**
 * Format pace for running (min per distance unit)
 */
export function formatPace(paceMinPerKm: string, unitSystem: UnitSystem): string {
  if (unitSystem === 'imperial') {
    // Convert min/km to min/mile
    const parts = paceMinPerKm.split(':')
    const minutes = parseInt(parts[0])
    const seconds = parseInt(parts[1])
    const totalSeconds = (minutes * 60 + seconds) * KM_TO_MILES
    const newMinutes = Math.floor(totalSeconds / 60)
    const newSeconds = Math.round(totalSeconds % 60)
    return `${newMinutes}:${newSeconds.toString().padStart(2, '0')}`
  }
  return paceMinPerKm
}

/**
 * Get pace unit label
 */
export function getPaceUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'min/mi' : 'min/km'
}
