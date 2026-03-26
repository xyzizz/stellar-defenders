// collision.js - Collision detection system
import { rectCollide, distance } from '../utils/helpers.js';

export class CollisionSystem {
    /**
     * Check collisions between bullets and enemies.
     * Both bullets and enemies are expected to have { x, y, width, height }.
     * @param {Array} bullets
     * @param {Array} enemies
     * @returns {Array<{bullet: object, enemy: object}>} colliding pairs
     */
    checkBulletEnemy(bullets, enemies) {
        const hits = [];
        for (const bullet of bullets) {
            for (const enemy of enemies) {
                if (!enemy.alive) continue;
                if (rectCollide(bullet, enemy)) {
                    hits.push({ bullet, enemy });
                }
            }
        }
        return hits;
    }

    /**
     * Check collisions between the player and enemies.
     * @param {object} player - { x, y, width, height }
     * @param {Array} enemies
     * @returns {Array} enemies colliding with the player
     */
    checkPlayerEnemy(player, enemies) {
        const colliding = [];
        for (const enemy of enemies) {
            if (enemy.dead) continue;
            if (rectCollide(player, enemy)) {
                colliding.push(enemy);
            }
        }
        return colliding;
    }

    /**
     * Check collisions between pickups and the player.
     * Uses distance-based check (center-to-center) against pickup SIZE.
     * @param {Array} pickups - each { x, y, size } (x,y = center)
     * @param {object} player - { x, y, width, height }
     * @returns {Array} collected pickups
     */
    checkPickupPlayer(pickups, player) {
        const collected = [];
        const playerCX = player.x + player.width / 2;
        const playerCY = player.y + player.height / 2;
        const collectRadius = Math.max(player.width, player.height) / 2;

        for (const pickup of pickups) {
            // Pickup x,y is its center; use its size as radius
            const pickupRadius = (pickup.size || pickup.width || 8) / 2;
            const pickupCX = pickup.centerX !== undefined ? pickup.centerX : (pickup.x + pickupRadius);
            const pickupCY = pickup.centerY !== undefined ? pickup.centerY : (pickup.y + pickupRadius);
            const dist = distance(playerCX, playerCY, pickupCX, pickupCY);
            if (dist < collectRadius + pickupRadius) {
                collected.push(pickup);
            }
        }
        return collected;
    }

    /**
     * Check which enemies have passed the base line (bottom of screen).
     * @param {Array} enemies
     * @param {number} baseY - the Y coordinate of the base line
     * @returns {Array} enemies that crossed the base line
     */
    checkEnemyBase(enemies, baseY) {
        const passed = [];
        for (const enemy of enemies) {
            if (enemy.dead) continue;
            if (enemy.y + enemy.height >= baseY) {
                passed.push(enemy);
            }
        }
        return passed;
    }
}
