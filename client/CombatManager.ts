import Phaser from "phaser";
import { intersect } from "./utils/utils";
import {
    CanBeHit,
    AttackData,
    HasLocation,
    AttackType,
} from "./utils/constants";
import { Projectile } from "./Player";

/**
 * The CombatManager class handles combat-related logic, including projectile management, damage application, and combat state.
 */
export interface ICombatManager {
    /**
     * Returns the team of a participant by name.
     */
    getTeam(name: string): string | null;
    /**
     * Adds a participant to a team.
     */
    addParticipant(
        participant: CanBeHit,
        team: string,
        onHit?: (dmg: number) => void
    ): void;
    /**
     * Removes a participant by name.
     */
    removeParticipant(name: string): void;
    /**
     * Processes an attack from a combatant.
     */
    processAttack(attacker: CanBeHit, attackData: AttackData): void;
    /**
     * Registers a projectile with the combat system.
     *
     * @param projectile The projectile to register.
     * @param projectileTeam The team of the projectile.
     * @param attackData The attack data for the projectile.
     * @param onProjectileHit Callback when the projectile hits a target.
     * @returns The process ID for the projectile's collision checker.
     */
    registerProjectile(
        projectile: Projectile,
        projectileTeam: string,
        attackData: AttackData,
        onProjectileHit?: () => void
    ): number;

    /**
     * Returns projectile handlers for `onInit`, `onUpdate`, and `onRemove`.
     */
    getProjectileHandlers(): ProjectileHandlers;
}

/**
 * Class for managing attacks between in-game combatants.
 */
class CombatManager implements ICombatManager {
    /** Maps participants to their team and optional hit callback. */
    private teams: Map<
        CanBeHit,
        { team: string; onHit?: (dmg: number) => void }
    > = new Map();
    /** Maps participant names to participant objects. */
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
     * Adds a combatant to a team. Overwrites if name exists.
     * @param participant Combatant object
     * @param team Team name
     * @param onHit Callback after taking damage (optional)
     */
    public addParticipant(
        participant: CanBeHit,
        team: string,
        onHit?: (dmg: number) => void
    ) {
        this.teams.set(participant, { team, onHit });
        this.nameTracker.set(participant.name, participant);
    }

    /**
     * Removes a combatant by name.
     */
    public removeParticipant(name: string) {
        const participant = this.nameTracker.get(name);
        if (participant !== undefined) this.teams.delete(participant);
    }

    /**
     * Processes an attack from a combatant.
     * @param attacker Attacker object
     * @param attack Attack data (damage, aoe, etc)
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
     * Sets custom projectile handlers.
     * @param handlers Object with onInit, onUpdate, and onRemove methods.
     */
    public setProjectileHandler(handlers: {
        onUpdate: (projectile: HasLocation) => void;
        onInit: (projectile: HasLocation) => void;
        onRemove: (projectile: HasLocation) => void;
    }) {
        this.projectileHandlers = handlers;
    }

    /**
     * Gets the current projectile handlers.
     */
    public getProjectileHandlers() {
        return this.projectileHandlers;
    }

    /**
     * Registers a projectile and handles collisions.
     * @param projectile Projectile object.
     * @param projectileTeam Team name for projectile.
     * @param attackData Attack data for projectile.
     * @param onProjectileHit Callback when a target is hit (optional).
     * @returns Interval ID for collision checker.
     */
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
     * Called on each frame update of the projectile.
     */
    onUpdate(projectile: HasLocation): void;
    /**
     * Called when the projectile is created.
     */
    onInit(projetile: HasLocation): void;
    /**
     * Called when the projectile sprite needs to be destroyed.
     */
    onRemove(projectile: HasLocation): void;
}

const voidProjectileHandlers: ProjectileHandlers = {
    onUpdate: (projectile: HasLocation) => {},
    onInit: (projectile: HasLocation) => {},
    onRemove: (projectile: HasLocation) => {},
};

export { CombatManager, NullCombatManager };
