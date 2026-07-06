import React, { createContext, useReducer, useState, useRef, useEffect, useContext } from 'react';
import { taskReducer } from './reducers/taskReducer';
import { petReducer } from './reducers/petReducer';
import { battleReducer } from './reducers/battleReducer';
import { systemReducer } from './reducers/systemReducer';
import { characterReducer } from './reducers/characterReducer';

import { TaskProvider } from './TaskContext';
import { PetProvider } from './PetContext';
import { BattleProvider } from './BattleContext';

import { playCoinSound, playHealSound, playHitSound, playLevelUpSound } from '../utils/sound';
import { getEffectiveStats } from '../utils/gameUtils';
import { usePageVisibility } from '../utils/usePageVisibility';

const GameContext = createContext();

const initialState = {
    character: null,
    tasks: [],
    completedTasks: [],
    habits: [],
    rewards: [
        { id: 'netflix', name: '1 Episode of Netflix', cost: 30, type: 'time' },
        { id: 'game', name: '30min Gaming', cost: 30, type: 'time' },
    ],
    log: [],
    floatingTexts: [],
    activeDungeon: { hp: 1000, maxHp: 1000, name: "Weekly Dungeon", lastReset: null },
    activeWorldBoss: {
        id: 'boss_dragon_1',
        name: 'The Procrastination Dragon',
        hp: { current: 15000, max: 15000 },
        sprite: { src: '/placeholder-boss.png', x: 0, y: 0, width: 64, height: 64 },
        isActive: true,
        rewards: { gold: 500, xp: 1000 }
    },
    epicQuests: [],
    showLevelUpModal: false,
    newLevelData: null,
    showDailyRewardModal: false,
    dailyRewardData: null,
    screensaverSettings: { enabled: false, timeout: 60 }
};

const sendPushNotification = (title, options) => {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            ...options
        });
    }
};

const gameReducer = (state, action) => {
    try {
        let newState = characterReducer(state, action);
        newState = taskReducer(newState, action);
        newState = petReducer(newState, action);
        newState = battleReducer(newState, action);
        newState = systemReducer(initialState)(newState, action);
        return newState;
    } catch (e) {
        console.error("Game reducer crash caught:", e, "Action:", action);
        return state; // Return current state to avoid total app blackout
    }
};

export const SYNC_STATUS = { IDLE: 'idle', SAVING: 'saving', SAVED: 'saved', ERROR: 'error' };

export const GameProvider = ({ children, currentUser, familyData, activeProfileId, setFamilyData }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.IDLE);
    const familyDataRef = useRef(familyData);

    useEffect(() => { familyDataRef.current = familyData; }, [familyData]);

    useEffect(() => {
        if (!activeProfileId || !familyData || !familyData.profiles) return;
        const profile = familyData.profiles.find(p => p.id === activeProfileId);
        if (profile && profile.state) {
            dispatch({ type: 'RESTORE_STATE', payload: profile.state });
            // Per-profile daily-reward guard. The save loop is debounced + idle-
            // scheduled, so a refresh shortly after closing the modal can find
            // a stale `lastLoginDate` on the server and re-trigger CHECK_PENALTIES'
            // reward branch. localStorage gives us an atomic, synchronous flag
            // that survives any race with the server roundtrip.
            const today = new Date().toLocaleDateString('en-CA');
            const guardKey = `taskoria_daily_reward_${currentUser?.id}_${activeProfileId}`;
            const lastReward = localStorage.getItem(guardKey);
            const skipDailyReward = lastReward === today;
            dispatch({ type: 'CHECK_PENALTIES', payload: { skipDailyReward } });
            // Mark today *now* so the next refresh within the same day is guarded
            // even if the network save hasn't flushed yet.
            if (!skipDailyReward) localStorage.setItem(guardKey, today);
        }
    }, [activeProfileId]);

    useEffect(() => {
        if (!activeProfileId || !currentUser || !state.character) return;

        // Schedule the heavy JSON.stringify + localStorage write inside
        // `requestIdleCallback` so it never blocks a frame. The 1s debounce
        // before the schedule still collapses bursts of reducer dispatches.
        // Fallback to setTimeout 0 on Safari (no requestIdleCallback).
        const schedule = (cb) =>
            (typeof requestIdleCallback === 'function')
                ? requestIdleCallback(cb, { timeout: 2000 })
                : setTimeout(cb, 0);
        const cancel = (id) =>
            (typeof cancelIdleCallback === 'function')
                ? cancelIdleCallback(id)
                : clearTimeout(id);

        const saveGame = async () => {
            const currentFamily = familyDataRef.current;
            if (!currentFamily || !currentFamily.profiles) return;
            const updatedProfiles = currentFamily.profiles.map(p => p.id === activeProfileId ? { ...p, state: state } : p);
            const consolidatedSave = { ...currentFamily, profiles: updatedProfiles, lastActiveProfile: activeProfileId };
            // The stringify of the full family snapshot is the expensive bit;
            // it ran on the main thread inside the reducer flush before.
            const serialized = JSON.stringify(consolidatedSave);
            localStorage.setItem('taskoria_family_data_' + currentUser.id, serialized);
            setSyncStatus(SYNC_STATUS.SAVING);
            try {
                const res = await fetch('api/save_game.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: currentUser.id, save_data: consolidatedSave })
                });
                const data = await res.json();
                if (!res.ok || data.error) setSyncStatus(SYNC_STATUS.ERROR);
                else { setFamilyData(consolidatedSave); setSyncStatus(SYNC_STATUS.SAVED); setTimeout(() => setSyncStatus(SYNC_STATUS.IDLE), 2000); }
            } catch (e) { setSyncStatus(SYNC_STATUS.ERROR); setFamilyData(consolidatedSave); }
        };

        let idleId = null;
        const debounceId = setTimeout(() => { idleId = schedule(saveGame); }, 1000);
        return () => { clearTimeout(debounceId); if (idleId != null) cancel(idleId); };
    }, [state, activeProfileId, currentUser]);

    // Pause heartbeats when the tab is hidden — saves battery on mobile and
    // CPU on backgrounded desktop tabs (the OS already throttles us, but our
    // own reducer + JSON.stringify save loop can still chew through cycles).
    const pageVisible = usePageVisibility();

    useEffect(() => {
        if (!state.character?.pets?.length) return;
        if (!pageVisible) return;
        const tickPets = () => dispatch({ type: 'PET_DECAY' });
        tickPets();
        // Decay is now half as aggressive (2/h hunger), so we can tick less
        // often (every 5 min vs every 1 min). Cuts reducer dispatches by 5×.
        const intervalId = setInterval(tickPets, 5 * 60_000);
        return () => clearInterval(intervalId);
    }, [!!state.character, pageVisible]);

    useEffect(() => {
        if (!currentUser || !activeProfileId) return;
        if (!pageVisible) return;
        const checkMarketSales = async () => {
            try {
                const res = await fetch(`api/check_sales.php?user_id=${currentUser.id}&profile_id=${activeProfileId}`);
                const data = await res.json();
                if (data.sales?.length) {
                    data.sales.forEach(sale => {
                        dispatch({ type: 'MARKET_SALE_REWARD', payload: { amount: parseInt(sale.gold_amount), item_name: sale.item_name } });
                        try { playCoinSound(); } catch (e) {}
                    });
                }
            } catch (e) {}
        };
        checkMarketSales();
        const intervalId = setInterval(checkMarketSales, 60000);
        return () => clearInterval(intervalId);
    }, [currentUser, activeProfileId, pageVisible]);

    const actions = {
        createCharacter: (name, charClass, avatarId, stats, colors) => dispatch({ type: 'CREATE_CHARACTER', payload: { name, class: charClass, avatarId, stats, colors } }),
        equipItem: (item, slot) => dispatch({ type: 'EQUIP_ITEM', payload: { item, slot } }),
        unequipItem: (slot) => dispatch({ type: 'UNEQUIP_ITEM', payload: { slot } }),
        sellItem: (item) => { playCoinSound(); dispatch({ type: 'SELL_ITEM', payload: item }); },
        listMarketItem: (item) => { playCoinSound(); dispatch({ type: 'LIST_MARKET_ITEM', payload: item }); },
        useItem: (item) => { if (item.effect?.hp) playHealSound(); if (item.effect?.hatch) playLevelUpSound(); dispatch({ type: 'USE_ITEM', payload: item }); },
        feedPet: (petId, foodItem) => { playHealSound(); dispatch({ type: 'FEED_PET', payload: { petId, foodItem } }); },
        playWithPet: (petId) => dispatch({ type: 'PLAY_WITH_PET', payload: petId }),
        cleanPet: (petId) => dispatch({ type: 'CLEAN_PET', payload: petId }),
        togglePetVisibility: (petId) => dispatch({ type: 'TOGGLE_PET_VISIBILITY', payload: petId }),
        toggleSanctuaryPet: (petId) => dispatch({ type: 'TOGGLE_SANCTUARY_PET', payload: petId }),
        releasePet: (petId) => dispatch({ type: 'RELEASE_PET', payload: petId }),
        evolvePet: (petId) => { playLevelUpSound(); dispatch({ type: 'EVOLVE_PET', payload: petId }); },
        updateCharacter: (updates) => dispatch({ type: 'UPDATE_CHARACTER', payload: updates }),
        addTask: (title, difficulty, dueDate, recurrence = 'none', category = 'quest', extraInfo = '', assigneeId = 'self') => {
            const newTask = { id: Date.now().toString(), title, difficulty: parseInt(difficulty), dueDate, recurrence, category, extraInfo, assignerId: (assigneeId !== 'self' && assigneeId !== activeProfileId) ? activeProfileId : null, completed: false, lastCompleted: null, penalized: false };
            if (assigneeId !== 'self' && assigneeId !== activeProfileId) {
                const updatedProfiles = familyData.profiles.map(p => { if (p.id === assigneeId) { const pState = p.state || {}; return { ...p, state: { ...pState, tasks: [...(pState.tasks || []), newTask] } }; } return p; });
                setFamilyData({ ...familyData, profiles: updatedProfiles });
            } else dispatch({ type: 'ADD_TASK', payload: newTask });
        },
        editTask: (id, updates) => dispatch({ type: 'EDIT_TASK', payload: { id, updates } }),
        updateTaskStatus: (id, status) => dispatch({ type: 'UPDATE_TASK_STATUS', payload: { id, status } }),
        completeTask: (id, x = null, y = null) => {
            playHitSound(); setTimeout(playCoinSound, 200); dispatch({ type: 'COMPLETE_TASK', payload: { id, x, y } });
            if (state.character && state.activeWorldBoss?.isActive) { const effStats = getEffectiveStats(state.character); const strBonus = 1 + ((effStats.str || 10) * 0.05); dispatch({ type: 'DEAL_DAMAGE', payload: Math.floor(10 * strBonus) }); }
        },
        deleteTask: (id) => dispatch({ type: 'DELETE_TASK', payload: id }),
        finishPomodoro: (enemiesDefeated = 0) => { playLevelUpSound(); setTimeout(playCoinSound, 500); dispatch({ type: 'FINISH_POMODORO', payload: enemiesDefeated }); },
        setFocusMessage: (msg) => dispatch({ type: 'SET_FOCUS_MESSAGE', payload: msg }),
        addReward: (name, cost) => dispatch({ type: 'ADD_REWARD', payload: { id: Date.now().toString(), name, cost: parseInt(cost), type: 'time' } }),
        deleteReward: (id) => dispatch({ type: 'DELETE_REWARD', payload: id }),
        addHabit: (title, target, extraInfo = '', frequency = 'daily') => dispatch({ type: 'ADD_HABIT', payload: { id: Date.now().toString(), title, count: 0, target: parseInt(target), extraInfo, frequency, lastReset: Date.now(), completed: false } }),
        deleteHabit: (id) => dispatch({ type: 'DELETE_HABIT', payload: id }),
        editHabit: (id, updates) => dispatch({ type: 'EDIT_HABIT', payload: { id, updates } }),
        closeLevelUpModal: () => dispatch({ type: 'CLOSE_LEVEL_UP_MODAL' }),
        closeDailyReward: () => dispatch({ type: 'CLOSE_DAILY_REWARD' }),
        toggleResting: () => dispatch({ type: 'TOGGLE_RESTING' }),
        tickHabit: (id, x = null, y = null) => { playCoinSound(); dispatch({ type: 'TICK_HABIT', payload: { id, x, y } }); },
        triggerPush: (title, body) => sendPushNotification(title, { body }),
        removeFloatingText: (id) => dispatch({ type: 'REMOVE_FLOATING_TEXT', payload: id }),
        addEpicQuest: (title, maxHp, rewardXp, rewardGold, spriteType) => dispatch({ type: 'ADD_EPIC_QUEST', payload: { id: 'epic_' + Date.now(), title, maxHp, currentHp: maxHp, rewardXp, rewardGold, spriteType } }),
        addEpicProject: (title, maxHp, rewardXp, rewardGold, spriteType, childTasks) => {
            const projectId = 'proj_' + Date.now();
            const newBoss = { id: 'epic_' + Date.now(), title, maxHp, currentHp: maxHp, rewardXp, rewardGold, spriteType, isProject: true, projectId };
            const mappedTasks = childTasks.map((t, idx) => ({ id: 'task_' + Date.now() + '_' + idx, title: t.title, difficulty: 3, dueDate: null, recurrence: 'none', category: 'quest', extraInfo: '', assigneeId: t.assigneeId, projectId, completed: false, lastCompleted: null, penalized: false }));
            let selfTasks = [];
            const updatedProfiles = familyData.profiles.map(p => { const isSelf = p.id === activeProfileId; const tasksForThisProfile = mappedTasks.filter(t => t.assigneeId === p.id || (t.assigneeId === 'self' && isSelf)); if (isSelf) { selfTasks = tasksForThisProfile; return p; } if (tasksForThisProfile.length > 0) { const pState = p.state || {}; return { ...p, state: { ...pState, tasks: [...(pState.tasks || []), ...tasksForThisProfile] } }; } return p; });
            if (mappedTasks.some(t => t.assigneeId !== 'self' && t.assigneeId !== activeProfileId)) setFamilyData({ ...familyData, profiles: updatedProfiles });
            dispatch({ type: 'ADD_EPIC_PROJECT', payload: { boss: newBoss, projectTasks: selfTasks } });
        },
        deleteEpicQuest: (bossId) => {
            const boss = (state.epicQuests || []).find(b => b.id === bossId);
            if (boss?.isProject) { const updatedProfiles = familyData.profiles.map(p => { if (p.id === activeProfileId) return p; const pTasks = p.state?.tasks || []; if (pTasks.some(t => t.projectId === boss.projectId)) return { ...p, state: { ...p.state, tasks: pTasks.filter(t => t.projectId !== boss.projectId) } }; return p; }); if (JSON.stringify(updatedProfiles) !== JSON.stringify(familyData.profiles)) setFamilyData({ ...familyData, profiles: updatedProfiles }); }
            dispatch({ type: 'DELETE_EPIC_QUEST', payload: bossId });
        },
        editEpicQuest: (id, updates) => dispatch({ type: 'EDIT_EPIC_QUEST', payload: { id, updates } }),
        startIncubation: (eggId) => dispatch({ type: 'START_INCUBATION', payload: { eggId } }),
        cancelIncubation: () => dispatch({ type: 'CANCEL_INCUBATION' }),
        progressIncubation: () => dispatch({ type: 'PROGRESS_INCUBATION' }),
        updateAvatar: (avatarId, colors, cost) => dispatch({ type: 'UPDATE_AVATAR', payload: { avatarId, colors, cost } })
    };

    return (
        <GameContext.Provider value={{ state, dispatch, actions, activeProfileId, familyData, setFamilyData, syncStatus }}>
            <TaskProvider>
                <PetProvider>
                    <BattleProvider>
                        {children}
                    </BattleProvider>
                </PetProvider>
            </TaskProvider>
        </GameContext.Provider>
    );
};

export const useGame = () => useContext(GameContext);
