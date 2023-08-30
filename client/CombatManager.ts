import Phaser from "phaser";
import { intersect } from "./utils";
import { CanBeHit } from "./constants";

/**
 * Parameters describing an attack.
 */
export type AttackData = {
    damage: number;
    /** If true, attack strikes all targets in range. */
    aoe: boolean;
    /**
     * A nonzero value indicates that the attack should knock back targets that are hit,
     * unless the target has a knockback resistance value higher than this value.
     */
    knockbackPrecedence: number;
};

/**
 * Class for managing attacks between in-game combatants (player-controlled or not).
 */
class CombatManager {
    /** Maps participants to "team names". Friendly fire is disallowed. */
    private teams: Map<
        CanBeHit,
        { team: string; onHit?: (dmg: number) => void }
    > = new Map();
    /** Maps participant names to participants. */
    private nameTracker: Map<string, CanBeHit> = new Map();

    /**
     * Adds a combatant. Adding a combatant this way only guarantees that it can be hit,
     * and not that its attacks will hit others. For the latter, use the `processAttack` method,
     * or if the participant is a player and not merely a bot, use player's `registerAsCombatant` method.
     *
     * @param participant if a participant with the same name has already been added, then
     *      this call will override the previous one.
     * @param team name used to determine which participants should be able to hit each other.
     *      Friendly fire is disallowed.
     * @param onHit optional callback executed when this participant takes damage (immediately
     *      after its `takeDamage` method is called).
     */
    public addParticipant(
        participant: CanBeHit,
        team: string,
        onHit?: (dmg: number) => void
    ) {
        this.teams.set(participant, { team, onHit });
        this.nameTracker.set(participant.name, participant);
    }

    /** Removes the participant with the given name. */
    public removeParticipant(name: string) {
        const participant = this.nameTracker.get(name);
        if (participant !== undefined) this.teams.delete(participant);
    }
    /**
     *
     * @param attacker
     * @param dmg amount of damage dealt by attack
     * @param aoe indicates whether attack strikes everybody in range.
     */
    public processAttack(attacker: CanBeHit, attack: AttackData) {
        const { damage, aoe } = attack;
        const attackerObj = this.teams.get(attacker);
        if (attackerObj === undefined) throw new Error("attacker not found");
        const { team: attackerTeam } = attackerObj;
        for (const [participant, { team, onHit }] of this.teams.entries()) {
            if (attackerTeam === team) continue;
            if (intersect(attacker, participant)) {
                participant.takeDamage(damage);
                if (onHit !== undefined) onHit(damage);
                if (!aoe) break;
            }
        }
    }
}

export default CombatManager;
