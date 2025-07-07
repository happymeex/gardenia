import Phaser from "phaser";
import { intersect } from "./utils/utils";
import {
    CanBeHit,
    AttackData,
    HasLocation,
    AttackType,
} from "./utils/constants";
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

    /** Registers a projectile for collision detection with combat participants */
    registerProjectile(
        projectile: Projectile,
        projectileTeam: string,
        attackData: AttackData,
        onProjectileHit?: () => void
    ): number;

    /** Returns projectile handlers for init, update, and remove events */
    getProjectileHandlers(): ProjectileHandlers;
}

/**
 * Manages attacks between in-game combatants
 */
class CombatManager implements ICombatManager {
    /** Maps participants to team names */
    private teams: Map<
        CanBeHit,
        { team: string; onHit?: (dmg: number) => void }
    > = new Map();
    /** Maps participant names to participants */
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
     * Adds a combatant to the combat system
     * @param participant combatant to add
     * @param team team name for friendly fire prevention
     * @param onHit optional callback when participant takes damage
     */
    public addParticipant(
        participant: CanBeHit,
        team: string,
        onHit?: (dmg: number) => void
    ) {
        this.teams.set(participant, { team, onHit });
        this.nameTracker.set(participant.name, participant);
    }

    /** Removes participant by name */
    public removeParticipant(name: string) {
        const participant = this.nameTracker.get(name);
        if (participant !== undefined) this.teams.delete(participant);
    }

    /** Processes an attack from attacker against valid targets */
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

    /** Updates projectile handlers */
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
    onUpdate(projectile: HasLocation): void;
    onInit(projectile: HasLocation): void;
    onRemove(projectile: HasLocation): void;
}

const voidProjectileHandlers: ProjectileHandlers = {
    onUpdate: (projectile: HasLocation) => {},
    onInit: (projectile: HasLocation) => {},
    onRemove: (projectile: HasLocation) => {},
};

export { CombatManager, NullCombatManager };
