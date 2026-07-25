let customBlueprintsCache = null;
let blueprintsFetchPromise = null;

export const fetchCustomBlueprints = () => {
    if (customBlueprintsCache) return Promise.resolve(customBlueprintsCache);
    if (blueprintsFetchPromise) return blueprintsFetchPromise;
    blueprintsFetchPromise = fetch('api/blueprints.php')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                customBlueprintsCache = {
                    characters: data.characters || {},
                    pets: data.pets || {},
                    objects: data.objects || {}
                };
                return customBlueprintsCache;
            }
            return { characters: {}, pets: {}, objects: {} };
        })
        .catch(err => {
            console.error(err);
            return { characters: {}, pets: {}, objects: {} };
        });
    return blueprintsFetchPromise;
};

export const getCustomBlueprintsCache = () => customBlueprintsCache;
