import { calculateXpReq } from '../../utils/gameUtils';

export const petReducer = (state, action) => {
    switch (action.type) {
        case 'USE_ITEM': {
            const item = action.payload;
            if (!item.effect?.hatch) return state;

            let newChar = { ...state.character };
            const petTypes = ['wolf', 'lion', 'dragon'];
            const randomType = petTypes[Math.floor(Math.random() * petTypes.length)];
            
            newChar.pets = [...(newChar.pets || []), {
                id: 'pet_' + Date.now(),
                type: randomType,
                hunger: 100,
                happiness: 100,
                hygiene: 100,
                xp: { current: 0, max: 100 },
                level: 1,
                inSanctuary: false,
                showPet: true,
                lastFed: Date.now(),
                lastPlayed: Date.now(),
                lastCleaned: Date.now(),
                lastUpdate: Date.now()
            }];

            return {
                ...state,
                character: newChar,
                log: [{ id: Date.now(), message: `Hatched a new companion ${randomType}!`, type: 'info' }, ...state.log]
            };
        }

        case 'FEED_PET': {
            const { petId, foodItem } = action.payload;
            if (!state.character?.pets) return state;

            const petIndex = state.character.pets.findIndex(p => p.id === petId);
            if (petIndex === -1) return state;

            const currentPet = state.character.pets[petIndex];
            if (currentPet.inSanctuary) return state; 

            const hungerRestore = foodItem.effect?.hunger || 30;
            const xpGain = foodItem.effect?.xp || 20;

            let newHunger = Math.min(100, currentPet.hunger + hungerRestore);
            let newXp = currentPet.xp.current + xpGain;
            let newLevel = currentPet.level;
            let newMaxXp = currentPet.xp.max;

            if (newXp >= newMaxXp && newLevel < 30) {
                newLevel++;
                newXp = newXp - newMaxXp;
                newMaxXp = Math.floor(newMaxXp * 1.5);
            }

            const newInventory = [...state.character.inventory];
            const invIndex = newInventory.findIndex(i => i.id === foodItem.id);
            if (invIndex > -1) newInventory.splice(invIndex, 1);

            const updatedPets = [...state.character.pets];
            updatedPets[petIndex] = {
                ...currentPet,
                hunger: newHunger,
                xp: { current: newXp, max: newMaxXp },
                level: newLevel,
                lastFed: Date.now(),
                lastUpdate: Date.now()
            };

            return {
                ...state,
                character: { ...state.character, pets: updatedPets, inventory: newInventory },
                log: [{ id: Date.now(), message: `Fed pet ${foodItem.name}. +${hungerRestore} Hunger, +${xpGain} XP`, type: 'info' }, ...state.log]
            };
        }

        case 'PLAY_WITH_PET': {
            const petId = action.payload;
            const updatedPets = state.character.pets.map(p => 
                p.id === petId ? {
                    ...p,
                    happiness: Math.min(100, (p.happiness || 0) + 25),
                    xp: { ...p.xp, current: p.xp.current + 5 },
                    lastPlayed: Date.now(),
                    lastUpdate: Date.now()
                } : p
            );
            return {
                ...state,
                character: { ...state.character, pets: updatedPets },
                log: [{ id: Date.now(), message: `You played with your pet!`, type: 'info' }, ...state.log]
            };
        }

        case 'CLEAN_PET': {
            const petId = action.payload;
            const updatedPets = state.character.pets.map(p => 
                p.id === petId ? { ...p, hygiene: 100, lastCleaned: Date.now(), lastUpdate: Date.now() } : p
            );
            return {
                ...state,
                character: { ...state.character, pets: updatedPets },
                log: [{ id: Date.now(), message: `You groomed your pet!`, type: 'info' }, ...state.log]
            };
        }

        case 'RELEASE_PET': {
            const petId = action.payload;
            return {
                ...state,
                character: { ...state.character, pets: state.character.pets.filter(p => p.id !== petId) },
                log: [{ id: Date.now(), message: `Released companion for adoption.`, type: 'info' }, ...state.log]
            };
        }

        case 'ADOPT_PET': {
            const sanctuaryPet = action.payload;
            const cost = sanctuaryPet.cost || 0;
            if (state.character.gold < cost) return state;

            const newPet = {
                id: 'pet_' + Date.now() + Math.random().toString(36).substr(2, 5),
                type: sanctuaryPet.pet_type,
                hunger: 100,
                happiness: 100,
                hygiene: 100,
                xp: { current: sanctuaryPet.pet_xp, max: calculateXpReq(sanctuaryPet.pet_level) },
                level: sanctuaryPet.pet_level,
                inSanctuary: false,
                showPet: true,
                lastFed: Date.now(),
                lastPlayed: Date.now(),
                lastCleaned: Date.now(),
                lastUpdate: Date.now()
            };

            return {
                ...state,
                character: { 
                    ...state.character, 
                    pets: [...(state.character.pets || []), newPet],
                    gold: state.character.gold - cost
                },
                log: [{ id: Date.now(), message: `Adopted ${newPet.type}!`, type: 'info' }, ...state.log]
            };
        }

        case 'PET_DECAY': {
            const now = Date.now();
            if (!state.character?.pets) return state;
            
            const updatedPets = state.character.pets.map(pet => {
                if (pet.inSanctuary) return pet;
                const lastUpdate = pet.lastUpdate || pet.lastFed || now;
                const hoursPassed = (now - lastUpdate) / (1000 * 60 * 60);
                if (hoursPassed < 0.05) return pet;

                return {
                    ...pet,
                    hunger: Math.max(0, pet.hunger - (hoursPassed * 4)),
                    happiness: Math.max(0, (pet.happiness ?? 100) - (hoursPassed * 2)),
                    hygiene: Math.max(0, (pet.hygiene ?? 100) - (hoursPassed * 1.5)),
                    lastUpdate: now
                };
            });

            const ranAwayPets = updatedPets.filter(p => !p.inSanctuary && (p.hunger <= 0 || p.happiness <= 0));
            const newLogs = ranAwayPets.map(p => ({ id: Date.now() + Math.random(), message: `${p.type} ran away to Sanctuary!`, type: 'damage' }));
            
            const finalPets = updatedPets.map(p => (p.hunger <= 0 || p.happiness <= 0) ? { ...p, inSanctuary: true, inSanctuarySince: now } : p);

            return {
                ...state,
                character: { ...state.character, pets: finalPets },
                log: [...newLogs, ...state.log]
            };
        }

        case 'TOGGLE_PET_VISIBILITY': {
            const petId = action.payload;
            return {
                ...state,
                character: {
                    ...state.character,
                    pets: state.character.pets.map(p => p.id === petId ? { ...p, showPet: !p.showPet } : p)
                }
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

                let newLevel = pet.level;
                let newXp = pet.xp.current + additionalXp;
                let newMaxXp = pet.xp.max;

                while (newXp >= newMaxXp && newLevel < 30) {
                    newLevel++;
                    newXp = newXp - newMaxXp;
                    newMaxXp = Math.floor(newMaxXp * 1.5);
                }

                return {
                    ...pet,
                    inSanctuary: !isCurrentlyInSanctuary,
                    inSanctuarySince: !isCurrentlyInSanctuary ? now : null,
                    level: newLevel,
                    xp: { current: newXp, max: newMaxXp },
                    hunger: isCurrentlyInSanctuary ? 100 : pet.hunger,
                    lastFed: isCurrentlyInSanctuary ? now : pet.lastFed
                };
            });

            return {
                ...state,
                character: { ...state.character, pets: updatedPets },
                log: [{ id: Date.now(), message: 'Sanctuary updated.', type: 'info' }, ...state.log]
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
                const petTypes = ['wolf', 'lion', 'dragon', 'panda', 'cat', 'owl'];
                const randomType = petTypes[Math.floor(Math.random() * petTypes.length)];
                const newPet = {
                    id: 'pet_' + Date.now(),
                    type: randomType,
                    hunger: 100, happiness: 100, hygiene: 100, xp: { current: 0, max: 100 },
                    level: 1, inSanctuary: false, showPet: true, lastFed: Date.now(), lastPlayed: Date.now(),
                    lastCleaned: Date.now(), lastUpdate: Date.now()
                };
                return {
                    ...state,
                    character: {
                        ...state.character,
                        incubatingEgg: null,
                        inventory: state.character.inventory.filter(i => i.id !== egg.eggId),
                        pets: [...(state.character.pets || []), newPet]
                    },
                    log: [{ id: Date.now(), message: `🐣 Hatched ${randomType}!`, type: 'reward' }, ...state.log]
                };
            }

            return {
                ...state,
                character: { ...state.character, incubatingEgg: { ...egg, sessions: newSessions } },
                log: [{ id: Date.now(), message: `✨ Incubation: ${newSessions}/3`, type: 'info' }, ...state.log]
            };
        }

        default:
            return state;
    }
};
