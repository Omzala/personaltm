export const darkHyperspeedOptions = {
  distortion: 'turbulentDistortion',
  length: 400,
  roadWidth: 10,
  islandWidth: 2,
  lanesPerRoad: 4,
  fov: 86,
  fovSpeedUp: 132,
  speedUp: 1.5,
  totalSideLightSticks: 30,
  lightPairsPerRoadWay: 46,
  colors: {
    roadColor: 0x050508,
    islandColor: 0x08080d,
    background: 0x050508,
    shoulderLines: 0x00ff87,
    brokenLines: 0xff0080,
    leftCars: [0xff0080, 0xc084fc, 0xff4d6d],
    rightCars: [0x00ff87, 0x00d4ff, 0x03b3c3],
    sticks: 0x00ff87
  }
};

export const lightHyperspeedOptions = {
  distortion: 'turbulentDistortion',
  length: 400,
  roadWidth: 10,
  islandWidth: 2,
  lanesPerRoad: 4,
  fov: 86,
  fovSpeedUp: 132,
  speedUp: 1.5,
  totalSideLightSticks: 30,
  lightPairsPerRoadWay: 46,
  colors: {
    roadColor: 0x181a22,
    islandColor: 0x24262f,
    background: 0xf4f5ea,
    shoulderLines: 0x101219,
    brokenLines: 0x2e3038,
    leftCars: [0x111827, 0x312e81, 0x581c87],
    rightCars: [0x0f766e, 0x155e75, 0x334155],
    sticks: 0x111827
  }
};

export function getHyperspeedOptions(theme) {
  return theme === 'dark' ? darkHyperspeedOptions : lightHyperspeedOptions;
}
