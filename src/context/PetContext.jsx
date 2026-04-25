import React, { createContext, useContext, useMemo } from 'react';
import { useGame } from './GameContext';

const PetContext = createContext();

export const PetProvider = ({ children }) => {
    const { state, actions } = useGame();

    const value = useMemo(() => ({
        pets: state.character?.pets || [],
        incubatingEgg: state.character?.incubatingEgg,
        feedPet: actions.feedPet,
        playWithPet: actions.playWithPet,
        cleanPet: actions.cleanPet,
        togglePetVisibility: actions.togglePetVisibility,
        toggleSanctuaryPet: actions.toggleSanctuaryPet,
        releasePet: actions.releasePet,
        startIncubation: actions.startIncubation,
        cancelIncubation: actions.cancelIncubation,
        progressIncubation: actions.progressIncubation,
        useItem: actions.useItem
    }), [state.character?.pets, state.character?.incubatingEgg, actions]);

    return (
        <PetContext.Provider value={value}>
            {children}
        </PetContext.Provider>
    );
};

export const usePets = () => {
    const context = useContext(PetContext);
    if (!context) throw new Error("usePets must be used within a PetProvider");
    return context;
};
