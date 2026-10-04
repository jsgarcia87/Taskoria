// Single source of truth for the main destinations — desktop top nav and
// mobile bottom nav both render this list, in this order.
export const NAV_DESTINATIONS = [
    { id: 'home', label: 'Camp', icon: 'home' },
    { id: 'tasks', label: 'Quests', icon: 'checkSquare', alsoActiveOn: ['createTask', 'createHabit'] },
    { id: 'party', label: 'Party', icon: 'users' },
    { id: 'creations', label: 'World', icon: 'hammer', alsoActiveOn: ['studio'] },
    { id: 'diary', label: 'Diary', icon: 'book', alsoActiveOn: ['calendar'] },
];

export const isDestinationActive = (item, activeView) =>
    activeView === item.id || (item.alsoActiveOn || []).includes(activeView);
