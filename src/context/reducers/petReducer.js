import {
    calculateXpReq,
    PET_DECAY,
    PET_COOLDOWNS,
    PET_LEVEL_CAP,
    PET_BOND_MAX,
    PET_BOND_GAIN,
    EVOLUTIONS,
    canEvolvePet,
} from '../../utils/gameUtils';

const uid = (prefix = 'log') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// Pet types that match existing blueprints (pet_blueprints.json) so we never
// spawn a type whose sprite doesn't exist. The previous incubation pool
// included panda/cat/owl which were never rendered.
const HATCHABLE_TYPES = ['slime', 'wolf', 'lion', 'dragon', 'phoenix'];
const randomHatchable = () => HATCHABLE_TYPES[Math.floor(Math.random() * HATCHABLE_TYPES.length)];

// Multi-level XP processor (mirrors processRewardsAndLevelUp on the player).
// Honours PET_LEVEL_CAP and stops looping when reached.
const applyPetXp = (pet, gain) => {
    let level = pet.level;
    let cur = pet.xp.current + gain;
    let max = pet.xp.max;
    while (cur >= max && level < PET_LEVEL_CAP) {
        cur -= max;
        level++;
        max = Math.floor(max * 1.5);
    }
    if (level >= PET_LEVEL_CAP) cur = Math.min(cur, max);
    return { ...pet.xp, current: cur, max, _level: level };
};

const bumpBond = (pet, kind) => {
    const gain = PET_BOND_GAIN[kind] || 0;
    return Math.min(PET_BOND_MAX, (pet.bond || 0) + gain);
};

const baseNewPet = (extra = {}) => ({
    hunger: 100, happiness: 100, hygiene: 100,
    bond: 0,
    xp: { current: 0, max: 100 },
    level: 1,
    inSanctuary: false,
    showPet: true,
    lastFed: Date.now(),
    lastPlayed: Date.now(),
    lastCleaned: Date.now(),
    lastUpdate: Date.now(),
    runAwayWarned: false,
    ...extra,
});

export const petReducer = (state, action) => {
    switch (action.type) {
        case 'USE_ITEM': {
            const item = action.payload;
            if (!item.effect?.hatch) return state;

            let newChar = { ...state.character };
            const randomType = randomHatchable();
            newChar.pets = [...(newChar.pets || []), baseNewPet({
                id: 'pet_' + Date.now(),
                type: randomType,
            })];

            return {
                ...state,
                character: newChar,
                log: [{ id: uid('log'), message: `Hatched a new companion: ${randomType}!`, type: 'info' }, ...state.log]
            };
        }

        case 'FEED_PET': {
            const { petId, foodItem } = action.payload;
            if (!state.character?.pets) return state;

            const petIndex = state.character.pets.findIndex(p => p.id === petId);
            if (petIndex === -1) return state;
            const currentPet = state.character.pets[petIndex];
            if (currentPet.inSanctuary) return state;

            // Cooldown: only feed when actually hungry — stops spamming food
            // to dump XP. 80% is "satisfied"; below that, feeding is allowed.
            if ((currentPet.hunger ?? 100) >= 80) {
                return {
                    ...state,
                    log: [{ id: uid('log'), message: `Your ${currentPet.type} isn't hungry yet.`, type: 'info' }, ...state.log],
                };
            }

            const hungerRestore = foodItem.effect?.hunger || 30;
            const xpGain = foodItem.effect?.xp || 20;
            const newHunger = Math.min(100, currentPet.hunger + hungerRestore);

            // Feeding makes the pet a little happier too — eating is joy.
            const happinessBoost = Math.floor(hungerRestore / 4);
            const newHappiness = Math.min(100, (currentPet.happiness ?? 100) + happinessBoost);

            // Multi-level XP (was capped to a single level → wasted excess).
            const xpResult = applyPetXp(currentPet, xpGain);

            const newInventory = [...state.character.inventory];
            const invIndex = newInventory.findIndex(i => i.id === foodItem.id);
            if (invIndex > -1) newInventory.splice(invIndex, 1);

            const updatedPets = [...state.character.pets];
            updatedPets[petIndex] = {
                ...currentPet,
                hunger: newHunger,
                happiness: newHappiness,
                bond: bumpBond(currentPet, 'feed'),
                xp: { current: xpResult.current, max: xpResult.max },
                level: xpResult._level,
                lastFed: Date.now(),
                lastUpdate: Date.now(),
                runAwayWarned: false,
            };

            const lvlMsg = xpResult._level > currentPet.level ? ` Level up → ${xpResult._level}!` : '';
            return {
                ...state,
                character: { ...state.character, pets: updatedPets, inventory: newInventory },
                log: [{ id: uid('log'), message: `Fed pet ${foodItem.name}. +${hungerRestore} Hunger, +${xpGain} XP${lvlMsg}`, type: 'info' }, ...state.log]
            };
        }

        case 'PLAY_WITH_PET': {
            const petId = action.payload;
            const now = Date.now();
            const pet = state.character.pets.find(p => p.id === petId);
            if (!pet) return state;
            // 30-min cooldown between plays — prevents farming happiness.
            const since = now - (pet.lastPlayed || 0);
            if (since < PET_COOLDOWNS.play) {
                const minsLeft = Math.ceil((PET_COOLDOWNS.play - since) / 60_000);
                return {
                    ...state,
                    log: [{ id: uid('log'), message: `Your ${pet.type} needs ${minsLeft} more min before playing again.`, type: 'info' }, ...state.log],
                };
            }
            const updatedPets = state.character.pets.map(p => {
                if (p.id !== petId) return p;
                const xpResult = applyPetXp(p, 5);
                return {
                    ...p,
                    happiness: Math.min(100, (p.happiness || 0) + 25),
                    bond: bumpBond(p, 'play'),
                    xp: { current: xpResult.current, max: xpResult.max },
                    level: xpResult._level,
                    lastPlayed: now,
                    lastUpdate: now,
                    runAwayWarned: false,
                };
            });
            return {
                ...state,
                character: { ...state.character, pets: updatedPets },
                log: [{ id: uid('log'), message: `You played with your pet!`, type: 'info' }, ...state.log]
            };
        }

        case 'CLEAN_PET': {
            const petId = action.payload;
            const now = Date.now();
            const pet = state.character.pets.find(p => p.id === petId);
            if (!pet) return state;
            // 1h cooldown between baths — no spam.
            const since = now - (pet.lastCleaned || 0);
            if (since < PET_COOLDOWNS.clean) {
                const minsLeft = Math.ceil((PET_COOLDOWNS.clean - since) / 60_000);
                return {
                    ...state,
                    log: [{ id: uid('log'), message: `Your ${pet.type} is still clean — ${minsLeft} min cooldown.`, type: 'info' }, ...state.log],
                };
            }
            const updatedPets = state.character.pets.map(p =>
                p.id !== petId ? p : {
                    ...p,
                    hygiene: 100,
                    bond: bumpBond(p, 'clean'),
                    lastCleaned: now,
                    lastUpdate: now,
                }
            );
            return {
                ...state,
                character: { ...state.character, pets: updatedPets },
                log: [{ id: uid('log'), message: `You groomed your pet!`, type: 'info' }, ...state.log]
            };
        }

        case 'RELEASE_PET': {
            const petId = action.payload;
            return {
                ...state,
                character: { ...state.character, pets: state.character.pets.filter(p => p.id !== petId) },
                log: [{ id: uid('log'), message: `Released companion for adoption.`, type: 'info' }, ...state.log]
            };
        }

        case 'ADOPT_PET': {
            const sanctuaryPet = action.payload;
            const cost = sanctuaryPet.cost || 0;
            if (state.character.gold < cost) return state;

            const newPet = baseNewPet({
                id: 'pet_' + Date.now() + Math.random().toString(36).slice(2, 7),
                type: sanctuaryPet.pet_type,
                xp: { current: sanctuaryPet.pet_xp, max: calculateXpReq(sanctuaryPet.pet_level) },
                level: sanctuaryPet.pet_level,
            });

            return {
                ...state,
                character: {
                    ...state.character,
                    pets: [...(state.character.pets || []), newPet],
                    gold: state.character.gold - cost,
                },
                log: [{ id: uid('log'), message: `Adopted ${newPet.type}!`, type: 'info' }, ...state.log]
            };
        }

        case 'PET_DECAY': {
            const now = Date.now();
            if (!state.character?.pets) return state;

            const newLogs = [];
            const updatedPets = state.character.pets.map(pet => {
                if (pet.inSanctuary) return pet;
                const lastUpdate = pet.lastUpdate || pet.lastFed || now;
                const hoursPassed = (now - lastUpdate) / (1000 * 60 * 60);
                if (hoursPassed < 0.05) return pet;

                const next = {
                    ...pet,
                    hunger:    Math.max(0, pet.hunger    - hoursPassed * PET_DECAY.hunger),
                    happiness: Math.max(0, (pet.happiness ?? 100) - hoursPassed * PET_DECAY.happiness),
                    hygiene:   Math.max(0, (pet.hygiene   ?? 100) - hoursPassed * PET_DECAY.hygiene),
                    lastUpdate: now,
                };

                // Send to sanctuary ONLY when truly starving — and emit the
                // "ran away" log exactly once per pet (was a per-tick spam).
                if ((next.hunger <= 0 || next.happiness <= 0) && !next.inSanctuary) {
                    if (!pet.runAwayWarned) {
                        newLogs.push({
                            id: uid('damage'),
                            message: `${pet.type} ran away to the Sanctuary — feed your pet!`,
                            type: 'damage',
                        });
                    }
                    return { ...next, inSanctuary: true, inSanctuarySince: now, runAwayWarned: true };
                }
                return next;
            });

            return {
                ...state,
                character: { ...state.character, pets: updatedPets },
                log: newLogs.length ? [...newLogs, ...state.log] : state.log,
            };
        }

        case 'TOGGLE_PET_VISIBILITY': {
            // "Display Next to Hero" semantics:
            //   • Click on a hidden pet → make it the ONE active companion.
            //     - Pulls it out of sanctuary (refreshes stats so it doesn't
            //       arrive starving the moment you summon it).
            //     - Hides every other pet so the active companion is unique
            //       (Garden's find() showed only the first match anyway, so
            //       toggling another pet visible would silently do nothing).
            //   • Click on the currently-visible pet → hide it (no companion).
            const petId = action.payload;
            const now = Date.now();
            const target = state.character.pets.find(p => p.id === petId);
            if (!target) return state;
            const turningOn = target.showPet === false || target.inSanctuary;

            const updatedPets = state.character.pets.map(p => {
                if (p.id !== petId) {
                    // Hide all other companions so there's a single active one
                    return turningOn ? { ...p, showPet: false } : p;
                }
                if (turningOn) {
                    return {
                        ...p,
                        showPet: true,
                        inSanctuary: false,
                        inSanctuarySince: null,
                        // Stats refresh on retrieve from sanctuary (mirrors the
                        // existing TOGGLE_SANCTUARY_PET behavior).
                        hunger:    p.inSanctuary ? 100 : p.hunger,
                        happiness: p.inSanctuary ? 100 : p.happiness,
                        hygiene:   p.inSanctuary ? 100 : p.hygiene,
                        lastFed:     p.inSanctuary ? now : p.lastFed,
                        lastPlayed:  p.inSanctuary ? now : p.lastPlayed,
                        lastCleaned: p.inSanctuary ? now : p.lastCleaned,
                        lastUpdate:  now,
                        runAwayWarned: false,
                    };
                }
                // Turning off: just hide.
                return { ...p, showPet: false };
            });

            return {
                ...state,
                character: { ...state.character, pets: updatedPets },
                log: [{
                    id: 'log_' + now,
                    message: turningOn
                        ? `${target.type} is now your active companion!`
                        : `${target.type} is no longer following you.`,
                    type: 'info',
                }, ...state.log],
            };
        }

        case 'EVOLVE_PET': {
            const petId = action.payload;
            if (!state.character?.pets) return state;
            const pet = state.character.pets.find(p => p.id === petId);
            if (!pet || !canEvolvePet(pet)) return state;
            const chain = EVOLUTIONS[pet.type];
            if (!chain) return state;
            const updatedPets = state.character.pets.map(p =>
                p.id !== petId ? p : {
                    ...p,
                    type: chain.evolveTo,
                    // Evolution refreshes mood and bumps bond — a milestone moment.
                    happiness: 100,
                    hygiene: Math.max(p.hygiene || 0, 50),
                    bond: Math.min(PET_BOND_MAX, (p.bond || 0) + 10),
                    runAwayWarned: false,
                    lastUpdate: Date.now(),
                }
            );
            return {
                ...state,
                character: { ...state.character, pets: updatedPets },
                log: [{
                    id: uid('reward'),
                    message: `[EVOLUTION] Your ${pet.type} evolved into ${chain.label}!`,
                    type: 'reward',
                }, ...state.log],
            };
        }

        case 'TOGGLE_SANCTUARY_PET': {
            const petId = action.payload;
            const now = Date.now();
            const updatedPets = state.character.pets.map(pet => {
                if (pet.id !== petId) return pet;
                const isCurrentlyInSanctuary = pet.inSanctuary;
                let additionalXp = 0;

                if (isCurrentlyInSanctuary && pet.inSanctuarySince) {
                    const hoursRested = (now - pet.inSanctuarySince) / (1000 * 60 * 60);
                    additionalXp = Math.floor(hoursRested * 50);
                }

                const xpResult = applyPetXp(pet, additionalXp);

                return {
                    ...pet,
                    inSanctuary: !isCurrentlyInSanctuary,
                    inSanctuarySince: !isCurrentlyInSanctuary ? now : null,
                    level: xpResult._level,
                    xp: { current: xpResult.current, max: xpResult.max },
                    // Coming back from sanctuary: stats fully restored
                    hunger:    isCurrentlyInSanctuary ? 100 : pet.hunger,
                    happiness: isCurrentlyInSanctuary ? 100 : pet.happiness,
                    hygiene:   isCurrentlyInSanctuary ? 100 : pet.hygiene,
                    lastFed:     isCurrentlyInSanctuary ? now : pet.lastFed,
                    lastPlayed:  isCurrentlyInSanctuary ? now : pet.lastPlayed,
                    lastCleaned: isCurrentlyInSanctuary ? now : pet.lastCleaned,
                    lastUpdate:  now,
                    runAwayWarned: false,
                };
            });

            return {
                ...state,
                character: { ...state.character, pets: updatedPets },
                log: [{ id: uid('log'), message: 'Sanctuary updated.', type: 'info' }, ...state.log]
            };
        }

        case 'START_INCUBATION':
            return { ...state, character: { ...state.character, incubatingEgg: { eggId: action.payload.eggId, sessions: 0 } } };

        case 'CANCEL_INCUBATION':
            return { ...state, character: { ...state.character, incubatingEgg: null } };

        case 'PROGRESS_INCUBATION': {
            const egg = state.character.incubatingEgg;
            if (!egg) return state;
            const newSessions = (egg.sessions || 0) + 1;

            if (newSessions >= 3) {
                const randomType = randomHatchable();
                const newPet = baseNewPet({
                    id: 'pet_' + Date.now(),
                    type: randomType,
                });
                return {
                    ...state,
                    character: {
                        ...state.character,
                        incubatingEgg: null,
                        inventory: state.character.inventory.filter(i => i.id !== egg.eggId),
                        pets: [...(state.character.pets || []), newPet]
                    },
                    log: [{ id: uid('reward'), message: `[HATCH] A wild ${randomType} appears!`, type: 'reward' }, ...state.log]
                };
            }

            return {
                ...state,
                character: { ...state.character, incubatingEgg: { ...egg, sessions: newSessions } },
                log: [{ id: uid('log'), message: `Incubation: ${newSessions}/3 sessions`, type: 'info' }, ...state.log]
            };
        }

        default:
            return state;
    }
};
