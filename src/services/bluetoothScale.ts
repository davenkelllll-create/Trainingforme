/**
 * Bluetooth Scale Service
 * Supports BLE Weight Scale (0x181D) and Body Composition (0x181B) GATT profiles
 *
 * Compatible with: Withings, Xiaomi Mi Scale 2, Garmin Index S2,
 * Renpho, Eufy Smart Scale, and most BLE-enabled scales.
 *
 * Requires: Chrome/Edge with Web Bluetooth API enabled.
 * iOS requires a 3rd-party browser (e.g. Bluefy).
 */

import type { BodyMeasurement } from '../types'

// GATT Service UUIDs
const WEIGHT_SCALE_SERVICE = 0x181d
const BODY_COMPOSITION_SERVICE = 0x181b
const WEIGHT_MEASUREMENT_CHAR = 0x2a9d
const BODY_COMPOSITION_CHAR = 0x2a9c

export const bluetoothScaleService = {
  isAvailable(): boolean {
    return 'bluetooth' in navigator
  },

  async connect(): Promise<{ measurement: Partial<BodyMeasurement>; deviceName: string }> {
    if (!this.isAvailable()) {
      throw new Error('Web Bluetooth wird von diesem Browser nicht unterstützt. Bitte Chrome oder Edge verwenden.')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bt = (navigator as any).bluetooth
    const device = await bt.requestDevice({
      filters: [
        { services: [WEIGHT_SCALE_SERVICE] },
        { services: [BODY_COMPOSITION_SERVICE] },
        { namePrefix: 'MI SCALE' },
        { namePrefix: 'Withings' },
        { namePrefix: 'Garmin Index' },
        { namePrefix: 'Renpho' },
        { namePrefix: 'eufy' },
        { namePrefix: 'BODY' },
      ],
      optionalServices: [WEIGHT_SCALE_SERVICE, BODY_COMPOSITION_SERVICE],
    })

    const server = await device.gatt!.connect()
    const result: Partial<BodyMeasurement> = {}

    // Try Body Composition Service first (has more data)
    try {
      const bcService = await server.getPrimaryService(BODY_COMPOSITION_SERVICE)
      const bcChar = await bcService.getCharacteristic(BODY_COMPOSITION_CHAR)
      const value = await bcChar.readValue()
      Object.assign(result, parseBodyComposition(value))
    } catch {
      // Fall back to Weight Scale Service
      try {
        const wsService = await server.getPrimaryService(WEIGHT_SCALE_SERVICE)
        const wsChar = await wsService.getCharacteristic(WEIGHT_MEASUREMENT_CHAR)
        const value = await wsChar.readValue()
        Object.assign(result, parseWeightMeasurement(value))
      } catch (e) {
        console.warn('Could not read weight data:', e)
      }
    }

    await device.gatt.disconnect()
    return { measurement: result, deviceName: device.name ?? 'Bluetooth Waage' }
  },
}

/** Parse GATT Weight Measurement (0x2A9D) */
function parseWeightMeasurement(data: DataView): Partial<BodyMeasurement> {
  const flags = data.getUint8(0)
  const isImperial = flags & 0x01
  const rawWeight = data.getUint16(1, true)
  const weight = isImperial ? rawWeight * 0.01 * 0.453592 : rawWeight * 0.005
  return { weight: Math.round(weight * 10) / 10 }
}

/** Parse GATT Body Composition (0x2A9C) */
function parseBodyComposition(data: DataView): Partial<BodyMeasurement> {
  const flags = data.getUint16(0, true)
  const result: Partial<BodyMeasurement> = {}

  let offset = 2
  const isImperial = flags & 0x0001
  const rawWeight = data.getUint16(offset, true)
  offset += 2
  result.weight = isImperial
    ? Math.round(rawWeight * 0.01 * 0.453592 * 10) / 10
    : Math.round(rawWeight * 0.005 * 10) / 10

  if (flags & 0x0002 && data.byteLength > offset + 1) {
    result.bodyFat = Math.round(data.getUint16(offset, true) * 0.1 * 10) / 10
    offset += 2
  }
  if (flags & 0x0008 && data.byteLength > offset + 1) {
    const rawMuscleMass = data.getUint16(offset, true)
    result.muscleMass = isImperial
      ? Math.round(rawMuscleMass * 0.01 * 0.453592 * 10) / 10
      : Math.round(rawMuscleMass * 0.005 * 10) / 10
    offset += 2
  }
  if (flags & 0x0010 && data.byteLength > offset + 1) {
    result.waterPercent = Math.round(data.getUint16(offset, true) * 0.1 * 10) / 10
    offset += 2
  }
  if (flags & 0x0040 && data.byteLength > offset + 1) {
    result.boneMass = Math.round(data.getUint16(offset, true) * 0.005 * 10) / 10
    offset += 2
  }
  if (flags & 0x0080 && data.byteLength > offset + 1) {
    result.bmr = data.getUint16(offset, true)
    offset += 2
  }
  if (flags & 0x0200 && data.byteLength > offset) {
    result.metabolicAge = data.getUint8(offset)
  }

  return result
}
