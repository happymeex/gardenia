import Phaser from "phaser";

export interface CanTakeDamage {
    name: string;
    getBounds(): Phaser.Geom.Rectangle;
    takeDamage(dmg: number): void;
}

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
    private teams: Map<CanTakeDamage, string> = new Map();
    /** Maps participant names to participants. */
    private nameTracker: Map<string, CanTakeDamage> = new Map();

    /**
     * Adds a combatant.
     *
     * @param participant if a participant with the same name has already been added, then
     *      this call will override the previous one.
     * @param team
     */
    public addParticipant(participant: CanTakeDamage, team: string) {
        this.teams.set(participant, team);
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
    public processAttack(attacker: CanTakeDamage, attack: AttackData) {
        const attackerTeam = this.teams.get(attacker);
        const { damage, aoe } = attack;
        if (attackerTeam === undefined) throw new Error("attacker not found");
        for (const [participant, team] of this.teams.entries()) {
            if (attackerTeam === team) continue;
            if (
                Phaser.Geom.Intersects.RectangleToRectangle(
                    attacker.getBounds(),
                    participant.getBounds()
                )
            ) {
                participant.takeDamage(damage);
                if (!aoe) break;
            }
        }
    }
}

export default CombatManager;
