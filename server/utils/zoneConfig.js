/**
 * Zone Configuration for Delhi-based Pricing
 * 
 * Zone A – Premium (Highest Pricing): 45% higher prices
 * Zone B – Upper Standard: 30% higher prices
 * Zone C – Standard: 15% higher prices
 * Zone D – Budget: Normal prices (no increase)
 */

const ZONES = {
  A: {
    name: 'Premium',
    multiplier: 1.45,
    pincodes: [
      '110003', '110011', '110021', '110022', '110023', '110024', '110029',
      '110030', '110048', '110049', '110057', '110065', '110066', '110067',
      '110068', '110070', '110075'
    ]
  },
  B: {
    name: 'Upper Standard',
    multiplier: 1.30,
    pincodes: [
      '110008', '110015', '110018', '110027', '110028', '110034', '110035',
      '110052', '110058', '110059', '110063', '110064', '110075', '110078',
      '110085', '110086', '110087', '110088'
    ]
  },
  C: {
    name: 'Standard',
    multiplier: 1.15,
    pincodes: [
      '110005', '110006', '110007', '110009', '110031', '110032', '110033',
      '110041', '110042', '110045', '110051', '110053', '110054', '110055',
      '110092', '110093', '110094', '110095'
    ]
  },
  D: {
    name: 'Budget',
    multiplier: 1.00,
    pincodes: [
      '110036', '110039', '110040', '110043', '110044', '110071', '110072',
      '110073', '110081', '110082', '110083', '110084', '110086', '110089',
      '110090', '110091'
    ]
  }
};

/**
 * Get zone based on PIN code
 * @param {string} pincode - 6-digit PIN code
 * @returns {string|null} Zone letter (A, B, C, D) or null if not found
 */
function getZoneFromPincode(pincode) {
  if (!pincode || typeof pincode !== 'string') {
    return null;
  }

  const cleanPincode = pincode.trim().substring(0, 6);

  for (const [zone, config] of Object.entries(ZONES)) {
    if (config.pincodes.includes(cleanPincode)) {
      return zone;
    }
  }

  // Default to Zone D (Budget) if PIN code not found
  return 'D';
}

/**
 * Get zone multiplier
 * @param {string} zone - Zone letter (A, B, C, D)
 * @returns {number} Price multiplier
 */
function getZoneMultiplier(zone) {
  const zoneConfig = ZONES[zone];
  return zoneConfig ? zoneConfig.multiplier : 1.00;
}

/**
 * Get zone details
 * @param {string} zone - Zone letter (A, B, C, D)
 * @returns {object|null} Zone configuration
 */
function getZoneDetails(zone) {
  return ZONES[zone] || null;
}

/**
 * Adjust price based on zone
 * @param {number} basePrice - Original price
 * @param {string} zone - Zone letter (A, B, C, D)
 * @returns {number} Adjusted price
 */
function adjustPriceByZone(basePrice, zone) {
  const multiplier = getZoneMultiplier(zone);
  return Math.round(basePrice * multiplier);
}

/**
 * Extract PIN code from address string
 * @param {string} address - Full address string
 * @returns {string|null} Extracted 6-digit PIN code or null
 */
function extractPincodeFromAddress(address) {
  if (!address || typeof address !== 'string') {
    return null;
  }

  // Match 6-digit PIN code pattern
  const pincodeMatch = address.match(/\b(\d{6})\b/);
  return pincodeMatch ? pincodeMatch[1] : null;
}

module.exports = {
  ZONES,
  getZoneFromPincode,
  getZoneMultiplier,
  getZoneDetails,
  adjustPriceByZone,
  extractPincodeFromAddress
};
