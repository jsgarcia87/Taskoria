import React, { createContext, useContext, useMemo } from 'react';
import { useGame } from './GameContext';

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
    const { state, actions } = useGame();

    const value = useMemo(() => ({
        tasks: state.tasks,
        habits: state.habits,
        completedTasks: state.completedTasks,
        addTask: actions.addTask,
        editTask: actions.editTask,
        deleteTask: actions.deleteTask,
        updateTaskStatus: actions.updateTaskStatus,
        completeTask: actions.completeTask,
        addHabit: actions.addHabit,
        editHabit: actions.editHabit,
        deleteHabit: actions.deleteHabit,
        tickHabit: actions.tickHabit,
        addEpicQuest: actions.addEpicQuest,
        addEpicProject: actions.addEpicProject,
        deleteEpicQuest: actions.deleteEpicQuest,
        editEpicQuest: actions.editEpicQuest
    }), [state.tasks, state.habits, state.completedTasks, state.epicQuests, actions]);

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    );
};

export const useTasks = () => {
    const context = useContext(TaskContext);
    if (!context) throw new Error("useTasks must be used within a TaskProvider");
    return context;
};
