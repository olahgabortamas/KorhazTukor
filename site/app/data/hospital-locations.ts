export type HospitalLocation = {
  lat: number;
  lon: number;
  locality: string;
};

// Institution-centre coordinates used only to calculate a nearby-options view.
// A hospital group can operate at more than one site, so results are deliberately
// labelled as approximate straight-line distance rather than travel directions.
export const hospitalLocations: Record<string, HospitalLocation> = {
  '1903': { lat: 48.074, lon: 19.296, locality: 'Balassagyarmat' },
  M915: { lat: 47.529, lon: 19.039, locality: 'Budapest' },
  R730: { lat: 48.104, lon: 20.761, locality: 'Miskolc' },
  U121: { lat: 47.500, lon: 19.026, locality: 'Budapest' },
  '2879': { lat: 47.429, lon: 19.174, locality: 'Budapest' },
  '2891': { lat: 47.516, lon: 19.095, locality: 'Budapest' },
  '1122': { lat: 46.907, lon: 19.692, locality: 'Kecskemét' },
  R464: { lat: 46.650, lon: 21.280, locality: 'Gyula' },
  N593: { lat: 47.174, lon: 19.798, locality: 'Cegléd' },
  U894: { lat: 47.530, lon: 21.630, locality: 'Debrecen' },
  M934: { lat: 46.973, lon: 18.948, locality: 'Dunaújváros' },
  '1865': { lat: 47.791, lon: 18.744, locality: 'Esztergom' },
  '1568': { lat: 47.191, lon: 18.415, locality: 'Székesfehérvár' },
  '2896': { lat: 47.506, lon: 19.088, locality: 'Budapest' },
  '1640': { lat: 47.687, lon: 17.652, locality: 'Győr' },
  '2877': { lat: 47.480, lon: 19.086, locality: 'Budapest' },
  N585: { lat: 47.905, lon: 20.374, locality: 'Eger' },
  '2324': { lat: 47.179, lon: 20.198, locality: 'Szolnok' },
  K404: { lat: 47.489, lon: 19.081, locality: 'Budapest' },
  N590: { lat: 46.435, lon: 19.484, locality: 'Kiskunhalas' },
  '1876': { lat: 47.578, lon: 18.403, locality: 'Tatabánya' },
  '2747': { lat: 46.453, lon: 16.986, locality: 'Nagykanizsa' },
  '1928': { lat: 48.116, lon: 19.807, locality: 'Salgótarján' },
  '1243': { lat: 46.566, lon: 20.670, locality: 'Orosháza' },
  '2910': { lat: 47.497, lon: 19.044, locality: 'Budapest' },
  U912: { lat: 46.075, lon: 18.210, locality: 'Pécs' },
  U915: { lat: 47.489, lon: 19.081, locality: 'Budapest' },
  '2137': { lat: 46.364, lon: 17.783, locality: 'Kaposvár' },
  '1663': { lat: 47.688, lon: 16.591, locality: 'Sopron' },
  N599: { lat: 47.950, lon: 21.727, locality: 'Nyíregyháza' },
  U917: { lat: 46.260, lon: 20.147, locality: 'Szeged' },
  '2052': { lat: 47.669, lon: 19.074, locality: 'Szentendre' },
  '2425': { lat: 46.356, lon: 18.704, locality: 'Szekszárd' },
  N595: { lat: 47.229, lon: 16.621, locality: 'Szombathely' },
  N594: { lat: 47.095, lon: 17.910, locality: 'Veszprém' },
  '2734': { lat: 46.845, lon: 16.843, locality: 'Zalaegerszeg' },
  U403: { lat: 47.535, lon: 19.081, locality: 'Budapest' },
  '2880': { lat: 47.527, lon: 18.989, locality: 'Budapest' },
};
