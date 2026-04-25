import React, { createContext, useContext, useMemo } from 'react';
import { useGame } from './GameContext';

const BattleContext = createContext();

export const BattleProvider = ({ children }) => {
    const { state, actions } = useGame();

    const value = useMemo(() => ({
        activeDungeon: state.activeDungeon,
        activeWorldBoss: state.activeWorldBoss,
        epicQuests: state.epicQuests,
        finishPomodoro: actions.finishPomodoro,
        setFocusMessage: actions.setFocusMessage,
        triggerPush: actions.triggerPush
    }), [state.activeDungeon, state.activeWorldBoss, state.epicQuests, actions]);

    return (
        <BattleContext.Provider value={value}>
            {children}
        </BattleContext.Provider>
    );
};

export const useBattle = () => {
    const context = useContext(BattleContext);
    if (!context) throw new Error("useBattle must be used within a BattleProvider");
    return context;
};
