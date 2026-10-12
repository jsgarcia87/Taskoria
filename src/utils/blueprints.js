let customBlueprintsCache = null;
let blueprintsFetchPromise = null;

// A Forja design only replaces a shipped class sprite if it is a complete
// 64×64 frame whose letters all exist in its palette.
const isValidClassBlueprint = (bp) =>
    bp && bp.paleta && Array.isArray(bp.blueprint) && bp.blueprint.length === 64 &&
    bp.blueprint.every(row => typeof row === 'string' && row.length === 64 &&
        [...row].every(ch => ch === ' ' || bp.paleta[ch]));

const fetchLiveClasses = () =>
    fetch('api/class_blueprints.php?action=live')
        .then(res => res.json())
        .then(data => Object.fromEntries(
            Object.entries(data?.classes || {}).filter(([, bp]) => isValidClassBlueprint(bp))
        ))
        .catch(() => ({}));

export const fetchCustomBlueprints = () => {
    if (customBlueprintsCache) return Promise.resolve(customBlueprintsCache);
    if (blueprintsFetchPromise) return blueprintsFetchPromise;
    blueprintsFetchPromise = Promise.all([
        fetch('api/blueprints.php').then(res => res.json()),
        fetchLiveClasses(),
    ])
        .then(([data, liveClasses]) => {
            if (data.success) {
                customBlueprintsCache = {
                    characters: data.characters || {},
                    // Forja de Clases designs marked "En el juego" (override shipped sprites)
                    liveClasses,
                    pets: data.pets || {},
                    objects: data.objects || {}
                };
                return customBlueprintsCache;
            }
            return { characters: {}, liveClasses, pets: {}, objects: {} };
        })
        .catch(err => {
            console.error(err);
            return { characters: {}, liveClasses: {}, pets: {}, objects: {} };
        });
    return blueprintsFetchPromise;
};

export const getCustomBlueprintsCache = () => customBlueprintsCache;
