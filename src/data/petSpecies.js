export const PET_SPECIES = {
  WOLF: 'wolf',
  LION: 'lion',
  EMBERWYRM: 'emberwyrm',
  FROSTCOIL: 'frostcoil',
  TIDEWYRM: 'tidewyrm',
  SLIME: 'slime',
};

export const PET_EVOLUTION_CHAINS = {
  [PET_SPECIES.WOLF]: [
    { stage: 'base', blueprintKey: 'wolf', label: 'Wolf' },
    { stage: 'evolved', blueprintKey: 'wolf_arctic', label: 'Arctic Alpha', perk: { dmgPct: 5 } },
  ],
  [PET_SPECIES.LION]: [
    { stage: 'base', blueprintKey: 'lion', label: 'Lion' },
    { stage: 'evolved', blueprintKey: 'lion_desert', label: 'Desert Sovereign', perk: { resistancePct: 5 } },
  ],
  [PET_SPECIES.EMBERWYRM]: [
    { stage: 'young', blueprintKey: 'emberwyrm_young', label: 'Wyrmling' },
    { stage: 'adult', blueprintKey: 'emberwyrm', label: 'Emberwyrm', perk: { physicalDmgPct: 8 } },
  ],
  [PET_SPECIES.FROSTCOIL]: [
    { stage: 'young', blueprintKey: 'frostcoil_young', label: 'Coilling' },
    { stage: 'adult', blueprintKey: 'frostcoil', label: 'Frostcoil', perk: { intBonus: 5, focusRegenPct: 10 } },
  ],
  [PET_SPECIES.TIDEWYRM]: [
    { stage: 'young', blueprintKey: 'tidewyrm_young', label: 'Tidewyrm Hatchling' },
    { stage: 'adult', blueprintKey: 'tidewyrm', label: 'Tidewyrm', perk: { focusRegenPct: 8, staminaBonus: 5 } },
  ],
  [PET_SPECIES.SLIME]: [
    { stage: 'base', blueprintKey: 'slime', label: 'Slime' },
  ],
};

export const MYSTIC_EGG_BLUEPRINT_KEY = 'mystic_egg';
export const PHOENIX_BLUEPRINT_KEY = 'phoenix';
