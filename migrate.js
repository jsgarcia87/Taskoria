import { MAP_DATA } from './src/components/dashboard/world/MapData.js';

async function migrate() {
    console.log('Migrating MapData to database via local API...');
    for (const [key, mapObj] of Object.entries(MAP_DATA)) {
        const res = await fetch('http://localhost:5173/api/admin.php?action=save_design', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_id: 1, // Assume admin ID is 1 locally
                tool: 'map',
                name: mapObj.name || key,
                snippet: 'SYSTEM_MAP',
                payload: mapObj
            })
        });
        const text = await res.text();
        console.log(`Response for ${key}:`, text);
    }
}

migrate();
