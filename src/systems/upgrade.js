// upgrade.js - Upgrade selection and application system
import { UPGRADE_POOL } from '../config/upgrades.js';

export class UpgradeSystem {
    constructor() {
        /** @type {Map<string, number>} upgradeId -> current stack count */
        this.currentUpgrades = new Map();
    }

    /**
     * Pick `count` random upgrades from the pool, respecting maxStack and rarity weights.
     * @param {number} count - Number of upgrade options to return
     * @param {Map<string, number>} [currentUpgrades] - Override for current upgrade stacks
     * @returns {Array} array of upgrade objects from UPGRADE_POOL
     */
    getRandomUpgrades(count, currentUpgrades) {
        const stacks = currentUpgrades || this.currentUpgrades;

        // Filter out upgrades that have reached maxStack
        const available = UPGRADE_POOL.filter(upgrade => {
            const currentCount = stacks.get(upgrade.id) || 0;
            return currentCount < upgrade.maxStack;
        });

        if (available.length === 0) return [];
        if (available.length <= count) return [...available];

        // Weighted random selection without replacement
        const selected = [];
        const pool = [...available];

        for (let i = 0; i < count && pool.length > 0; i++) {
            const totalWeight = pool.reduce((sum, u) => sum + u.rarity.weight, 0);
            let roll = Math.random() * totalWeight;

            for (let j = 0; j < pool.length; j++) {
                roll -= pool[j].rarity.weight;
                if (roll <= 0) {
                    selected.push(pool[j]);
                    pool.splice(j, 1);
                    break;
                }
            }

            // Fallback: if floating point issues cause no selection, pick last
            if (selected.length <= i) {
                selected.push(pool.pop());
            }
        }

        return selected;
    }

    /**
     * Apply an upgrade to the player's stats. Increments the stack count and
     * calls the upgrade's apply() function on the stats object.
     * @param {string} upgradeId - The ID of the upgrade to apply
     * @param {object} playerStats - The player stats object to mutate
     * @returns {object|null} the upgrade info, or null if not found
     */
    applyUpgrade(upgradeId, playerStats) {
        const upgrade = UPGRADE_POOL.find(u => u.id === upgradeId);
        if (!upgrade) return null;

        // Increment stack count
        const currentCount = this.currentUpgrades.get(upgradeId) || 0;
        if (currentCount >= upgrade.maxStack) return null;

        this.currentUpgrades.set(upgradeId, currentCount + 1);

        // Apply the upgrade effect
        upgrade.apply(playerStats);

        return {
            id: upgrade.id,
            name: upgrade.name,
            description: upgrade.description,
            category: upgrade.category,
            rarity: upgrade.rarity,
            icon: upgrade.icon,
            currentStack: currentCount + 1,
            maxStack: upgrade.maxStack
        };
    }

    /**
     * Get the current stack count for a specific upgrade.
     * @param {string} upgradeId
     * @returns {number}
     */
    getStackCount(upgradeId) {
        return this.currentUpgrades.get(upgradeId) || 0;
    }

    /**
     * Reset all upgrade stacks (e.g. on new game).
     */
    reset() {
        this.currentUpgrades.clear();
    }
}
