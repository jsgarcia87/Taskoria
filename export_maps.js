import fs from 'fs';
import { MAP_DATA } from './src/components/dashboard/world/MapData.js';

fs.writeFileSync('maps.json', JSON.stringify(MAP_DATA, null, 2));
console.log('Exported MAP_DATA to maps.json');
