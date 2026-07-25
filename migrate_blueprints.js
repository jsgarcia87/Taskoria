import fs from 'fs';

async function migrateBlueprints() {
    console.log('Migrating blueprints to database via local API...');
    const characters = JSON.parse(fs.readFileSync('./src/data/character_blueprints.json', 'utf-8'));
    for (const [key, obj] of Object.entries(characters)) {
        obj.name = key.toUpperCase(); // Ensure it has a name
        const res = await fetch('http://localhost:5173/api/admin.php?action=save_design', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_id: 1, // Assume admin ID is 1 locally
                tool: 'character',
                name: obj.name,
                snippet: 'SYSTEM_CHARACTER',
                payload: obj
            })
        });
        const text = await res.text();
        console.log(`Response for character ${key}:`, text);
    }

    const pets = JSON.parse(fs.readFileSync('./src/data/pet_blueprints.json', 'utf-8'));
    for (const [key, obj] of Object.entries(pets)) {
        obj.name = key.toUpperCase(); // Ensure it has a name
        const res = await fetch('http://localhost:5173/api/admin.php?action=save_design', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_id: 1, // Assume admin ID is 1 locally
                tool: 'pet',
                name: obj.name,
                snippet: 'SYSTEM_PET',
                payload: obj
            })
        });
        const text = await res.text();
        console.log(`Response for pet ${key}:`, text);
    }
}

migrateBlueprints();
