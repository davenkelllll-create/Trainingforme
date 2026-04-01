/**
 * Scientific reference values for body composition metrics
 *
 * Sources:
 * - WHO (2000): "Obesity: preventing and managing the global epidemic"
 * - ACSM (2022): "ACSM's Guidelines for Exercise Testing and Prescription", 11th Ed.
 * - Gallagher et al. (2000): "Healthy percentage body fat ranges"
 *   Am J Clin Nutr, 72(3):694-701
 * - Kyle et al. (2003): "Lean body mass reference values by bioelectrical impedance"
 *   Eur J Clin Nutr, 57(12):1492-1498
 * - Schutz et al. (2002): "Quantitative multicomponent-model body composition study"
 */

import type { Gender } from '../types'

export interface RangeValue {
  min: number
  max: number
  label: string
  color: 'success' | 'accent' | 'warning' | 'danger' | 'muted'
}

export interface MetricReference {
  metric: string
  unit: string
  source: string
  description: string
  ranges: RangeValue[]
}

// BMI - WHO Classification
export const BMI_RANGES: RangeValue[] = [
  { min: 0, max: 18.5, label: 'Untergewicht', color: 'warning' },
  { min: 18.5, max: 25, label: 'Normalgewicht', color: 'success' },
  { min: 25, max: 30, label: 'Übergewicht', color: 'warning' },
  { min: 30, max: 35, label: 'Adipositas Grad I', color: 'danger' },
  { min: 35, max: 999, label: 'Adipositas Grad II+', color: 'danger' },
]

// Body Fat % - Gallagher et al. (2000), ACSM (2022)
export const BODY_FAT_RANGES: Record<Gender, { age: [number, number]; ranges: RangeValue[] }[]> = {
  male: [
    {
      age: [20, 39],
      ranges: [
        { min: 0, max: 8, label: 'Sehr niedrig / Risiko', color: 'warning' },
        { min: 8, max: 20, label: 'Gesund / Fit', color: 'success' },
        { min: 20, max: 25, label: 'Akzeptabel', color: 'accent' },
        { min: 25, max: 999, label: 'Übergewicht', color: 'danger' },
      ],
    },
    {
      age: [40, 59],
      ranges: [
        { min: 0, max: 11, label: 'Sehr niedrig / Risiko', color: 'warning' },
        { min: 11, max: 22, label: 'Gesund / Fit', color: 'success' },
        { min: 22, max: 28, label: 'Akzeptabel', color: 'accent' },
        { min: 28, max: 999, label: 'Übergewicht', color: 'danger' },
      ],
    },
    {
      age: [60, 99],
      ranges: [
        { min: 0, max: 13, label: 'Sehr niedrig / Risiko', color: 'warning' },
        { min: 13, max: 25, label: 'Gesund / Fit', color: 'success' },
        { min: 25, max: 30, label: 'Akzeptabel', color: 'accent' },
        { min: 30, max: 999, label: 'Übergewicht', color: 'danger' },
      ],
    },
  ],
  female: [
    {
      age: [20, 39],
      ranges: [
        { min: 0, max: 21, label: 'Sehr niedrig / Risiko', color: 'warning' },
        { min: 21, max: 33, label: 'Gesund / Fit', color: 'success' },
        { min: 33, max: 39, label: 'Akzeptabel', color: 'accent' },
        { min: 39, max: 999, label: 'Übergewicht', color: 'danger' },
      ],
    },
    {
      age: [40, 59],
      ranges: [
        { min: 0, max: 23, label: 'Sehr niedrig / Risiko', color: 'warning' },
        { min: 23, max: 35, label: 'Gesund / Fit', color: 'success' },
        { min: 35, max: 40, label: 'Akzeptabel', color: 'accent' },
        { min: 40, max: 999, label: 'Übergewicht', color: 'danger' },
      ],
    },
    {
      age: [60, 99],
      ranges: [
        { min: 0, max: 24, label: 'Sehr niedrig / Risiko', color: 'warning' },
        { min: 24, max: 36, label: 'Gesund / Fit', color: 'success' },
        { min: 36, max: 42, label: 'Akzeptabel', color: 'accent' },
        { min: 42, max: 999, label: 'Übergewicht', color: 'danger' },
      ],
    },
  ],
  other: [], // Use male ranges as default
}

// Visceral Fat Index - Tanita classification
export const VISCERAL_FAT_RANGES: RangeValue[] = [
  { min: 1, max: 9, label: 'Normal (1–9)', color: 'success' },
  { min: 9, max: 14, label: 'Erhöht (10–14)', color: 'warning' },
  { min: 14, max: 20, label: 'Hoch (15–20)', color: 'danger' },
]

// Muscle Mass % - Kyle et al. (2003)
export const MUSCLE_MASS_RANGES: Record<Gender, RangeValue[]> = {
  male: [
    { min: 0, max: 33, label: 'Niedrig', color: 'warning' },
    { min: 33, max: 39, label: 'Normal', color: 'accent' },
    { min: 39, max: 44, label: 'Gut', color: 'success' },
    { min: 44, max: 999, label: 'Hoch', color: 'success' },
  ],
  female: [
    { min: 0, max: 24, label: 'Niedrig', color: 'warning' },
    { min: 24, max: 30, label: 'Normal', color: 'accent' },
    { min: 30, max: 35, label: 'Gut', color: 'success' },
    { min: 35, max: 999, label: 'Hoch', color: 'success' },
  ],
  other: [],
}

export function classifyBMI(bmi: number): RangeValue {
  return BMI_RANGES.find(r => bmi >= r.min && bmi < r.max) ?? BMI_RANGES[BMI_RANGES.length - 1]
}

export function classifyBodyFat(fat: number, gender: Gender, age: number): RangeValue | null {
  const genderRanges = gender === 'other' ? BODY_FAT_RANGES['male'] : BODY_FAT_RANGES[gender]
  const ageGroup = genderRanges.find(g => age >= g.age[0] && age <= g.age[1])
  if (!ageGroup) return null
  return ageGroup.ranges.find(r => fat >= r.min && fat < r.max) ?? ageGroup.ranges[ageGroup.ranges.length - 1]
}

export function classifyVisceralFat(index: number): RangeValue {
  return VISCERAL_FAT_RANGES.find(r => index >= r.min && index < r.max) ?? VISCERAL_FAT_RANGES[VISCERAL_FAT_RANGES.length - 1]
}

export const BODY_METRIC_SOURCES: Record<string, string> = {
  bmi: 'WHO (2000): Obesity: preventing and managing the global epidemic',
  bodyFat: 'Gallagher et al. (2000): Healthy percentage body fat ranges. Am J Clin Nutr, 72(3):694–701',
  muscleMass: 'Kyle et al. (2003): Lean body mass reference values. Eur J Clin Nutr, 57(12):1492–1498',
  visceralFat: 'Tanita Corp. / ACSM (2022): Guidelines for Exercise Testing and Prescription, 11th Ed.',
  bmr: 'Mifflin-St Jeor (1990): A new predictive equation for resting metabolic rate. Am J Clin Nutr, 51(2):241–247',
  waterPercent: 'Watson et al. (1980): A simple method to estimate total body water. Am J Clin Nutr, 33(1):27–39',
}
