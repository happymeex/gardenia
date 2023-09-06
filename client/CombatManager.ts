import Phaser from "phaser";
import { intersect } from "./utils";
import {
    CanBeHit,
    AttackData,
    HasLocation,
    AttackType,
    NullSocket,
    HasAppearance,
} from "./constants";
import { Projectile } from "./Player";

export interface ICombatManager {
    getTeam(name: string): string | null;
    addParticipant(
        participant: CanBeHit,
        team: string,
        onHit?: (dmg: number) => void
    ): void;
    removeParticipant(name: string): void;
    processAttack(attacker: CanBeHit, attackData: AttackData): void;

    /**
     * Enters a projectile into the combat system: sets up checker that determines
     * if the projectile has hit (intersects) any of the combatants in the system
     * and enacts the appropriate damage/effects. The checker calls projectile handlers `onInit`
     * and `onUpdate` appropriately.
     *
     * @param projectile
     * @param projectileTeam team name used to determine projectile's targets/non-targets
     * @param attackData
     * @param onProjectileHit callback executed when the projectile has hit at least one target.
     * @returns the process number of the intersection checker; call `clearInterval` on it when
     *      the projectile should no longer be able to strike targets.
     */
    registerProjectile(
        projectile: Projectile,
        projectileTeam: string,
        attackData: AttackData,
        onProjectileHit?: () => void
    ): number;

    /**
     * @returns Projectile handlers `onInit`, `onUpdate`, and `onRemove`, to be called
     *      on creating the projectile, on each projectile frame update, and on projecile removal
     *      (removal here means literally when the sprite needs to be destroyed).
     */
    getProjectileHandlers(): ProjectileHandlers;
}
/**
 * Class for managing attacks between in-game combatants (player-controlled or not).
 */
class CombatManager implements ICombatManager {
    /** Maps participants to "team names". Friendly fire is disallowed. */
    private teams: Map<
        CanBeHit,
        { team: string; onHit?: (dmg: number) => void }
    > = new Map();
    /** Maps participant names to participants. */
    private nameTracker: Map<string, CanBeHit> = new Map();
    private projectileHandlers = voidProjectileHandlers;
    public getTeam(name: string): string | null {
        const participant = this.nameTracker.get(name);
        if (participant === undefined) return null;
        const res = this.teams.get(participant);
        if (res === undefined)
            throw new Error(
                "Mismatch in combat manager: name corresponds to participant not on any team"
            );
        return res.team;
    }

    /**
     * Adds a combatant. Adding a combatant this way only guarantees that it can be hit.
     * For its attacks to be relayed to the rest of the combatants, use the `processAttack` method,
     * See also the `Player` class's `registerAsCombatant` method.
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

    /**
     * Updates the projectile handlers.
     */
    public setProjectileHandler(handlers: {
        onUpdate: (projectile: HasLocation) => void;
        onInit: (projectile: HasLocation) => void;
        onRemove: (projectile: HasLocation) => void;
    }) {
        this.projectileHandlers = handlers;
    }
    public getProjectileHandlers() {
        return this.projectileHandlers;
    }

    public registerProjectile(
        projectile: Projectile,
        projectileTeam: string,
        attackData: AttackData,
        onProjectileHit = () => {}
    ): number {
        this.projectileHandlers.onInit(projectile);
        const { type, damage, aoe, knockbackPrecedence } = attackData;
        if (type !== AttackType.PROJECTILE)
            throw new Error(
                "Cannot call `registerProjectile` on a non-projectile attack"
            );
        const process = setInterval(() => {
            this.projectileHandlers.onUpdate(projectile);
            let isHit = false;
            if (projectile.getAppearance().anim === "break") return;
            for (const [participant, { team, onHit }] of this.teams.entries()) {
                if (team === projectileTeam) continue;
                if (intersect(projectile, participant)) {
                    isHit = true;
                    participant.takeDamage(damage);
                    if (onHit !== undefined) onHit(damage);
                    if (!aoe) break;
                }
            }
            if (isHit) {
                onProjectileHit();
            }
        }, 33);
        return process;
    }
}

class NullCombatManager implements ICombatManager {
    removeParticipant(name: string): void {
        return;
    }
    addParticipant(
        participant: CanBeHit,
        team: string,
        onHit?: ((dmg: number) => void) | undefined
    ): void {
        return;
    }
    processAttack(attacker: CanBeHit, attackData: AttackData): void {
        return;
    }
    registerProjectile(
        projectile: Projectile,
        projectileTeam: string,
        attackData: AttackData
    ): number {
        return 0;
    }
    getTeam(name: string): string | null {
        return null;
    }
    getProjectileHandlers() {
        return voidProjectileHandlers;
    }
}

export interface ProjectileHandlers {
    /**
     * Method to be called on each frame update of `projectile`.
     */
    onUpdate(projectile: HasLocation): void;
    /**
     * Method to be called when the projectile is created.
     */
    onInit(projetile: HasLocation): void;
    /**
     * Callback to be executed the moment the projectile sprite needs to be destroyed.
     * Note that the combat manager does not handle projectile removal,
     * so clients will need to call this method themselves.
     */
    onRemove(projectile: HasLocation): void;
}

const voidProjectileHandlers: ProjectileHandlers = {
    onUpdate: (projectile: HasLocation) => {},
    onInit: (projectile: HasLocation) => {},
    onRemove: (projectile: HasLocation) => {},
};

export { CombatManager, NullCombatManager };
