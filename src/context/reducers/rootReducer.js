import { characterReducer } from './characterReducer';
import { taskReducer } from './taskReducer';
import { petReducer } from './petReducer';
import { battleReducer } from './battleReducer';
import { systemReducer } from './systemReducer';

export const createRootReducer = (initialState) => (state, action) => {
    let newState = state;

    // 1. Character & Items (Most common)
    newState = characterReducer(newState, action);
    
    // 2. Tasks & Habits
    newState = taskReducer(newState, action);
    
    // 3. Pets & Incubation
    newState = petReducer(newState, action);
    
    // 4. Battles & Pomodoro
    newState = battleReducer(newState, action);
    
    // 5. System (Penalties, UI, Restore)
    newState = systemReducer(initialState)(newState, action);

    return newState;
};
