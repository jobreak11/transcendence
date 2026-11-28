export const MAX_LEVEL = 100;

/**
 * Pre-computed XP required for each single level (1-indexed).
 * EXP_REQUIRED_PER_LEVEL[1] = 100
 * EXP_REQUIRED_PER_LEVEL[2] = 110
 * EXP_REQUIRED_PER_LEVEL[100] = 12,520
 */
export const EXP_REQUIRED_PER_LEVEL: number[] = [0];
for (let lv = 1; lv <= MAX_LEVEL; lv++) {
  EXP_REQUIRED_PER_LEVEL[lv] = Math.round((100 * (1.05 ** (lv - 1))) / 10) * 10;
}

export function getRequiredExpForLevel(level: number): number {
  const clampedLevel = Math.min(Math.max(1, level), MAX_LEVEL);
  return EXP_REQUIRED_PER_LEVEL[clampedLevel];
}

/**
 * Adds earned XP to a player's current level progress, carries over overflow
 * across one or more level-ups, and returns the updated { level, expPoint }.
 */
export function applyEarnedExp(
  currentLevel: number,
  currentLevelExp: number,
  expEarned: number,
): { level: number; expPoint: number } {
  let level = Math.min(Math.max(1, currentLevel), MAX_LEVEL);
  let expPoint = Math.max(0, currentLevelExp + expEarned);

  while (level < MAX_LEVEL && expPoint >= getRequiredExpForLevel(level)) {
    expPoint -= getRequiredExpForLevel(level);
    level += 1;
  }

  // Optional at Level 100: cap expPoint at Level 100's max bar (12,520)
  if (level >= MAX_LEVEL) {
    expPoint = Math.min(expPoint, getRequiredExpForLevel(MAX_LEVEL));
  }

  return { level, expPoint };
}
