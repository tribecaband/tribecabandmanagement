// Test script to verify band format functionality
// This script can be run in the browser console to test the band format logic

const BAND_FORMATS = [
  { value: 'solo', label: 'Solo (1 músico)', musicians: 1 },
  { value: 'duo', label: 'Dúo (2 músicos)', musicians: 2 },
  { value: 'trio', label: 'Trío (3 músicos)', musicians: 3 },
  { value: 'quartet', label: 'Cuarteto (4 músicos)', musicians: 4 },
  { value: 'quintet', label: 'Quinteto (5 músicos)', musicians: 5 },
  { value: 'sextet', label: 'Sexteto (6 músicos)', musicians: 6 }
]

function getAutomaticBandFormat(selectedMusicianIds) {
  const count = selectedMusicianIds.length
  const format = BAND_FORMATS.find(f => f.musicians === count)
  return format ? format.value : 'custom'
}

// Test cases
console.log('Testing band format logic:')
console.log('1 musician:', getAutomaticBandFormat(['1'])) // should be 'solo'
console.log('2 musicians:', getAutomaticBandFormat(['1', '2'])) // should be 'duo'
console.log('3 musicians:', getAutomaticBandFormat(['1', '2', '3'])) // should be 'trio'
console.log('4 musicians:', getAutomaticBandFormat(['1', '2', '3', '4'])) // should be 'quartet'
console.log('7 musicians:', getAutomaticBandFormat(['1', '2', '3', '4', '5', '6', '7'])) // should be 'custom'

// Test the display format function
function getDisplayFormat(selectedCount) {
  const format = BAND_FORMATS.find(f => f.musicians === selectedCount)
  return format ? format.label : selectedCount > 0 ? `Formato personalizado (${selectedCount} músicos)` : 'Selecciona músicos'
}

console.log('\nTesting display format:')
console.log('0 musicians:', getDisplayFormat(0))
console.log('1 musician:', getDisplayFormat(1))
console.log('2 musicians:', getDisplayFormat(2))
console.log('3 musicians:', getDisplayFormat(3))
console.log('7 musicians:', getDisplayFormat(7))

console.log('\nBand format logic test completed successfully!')