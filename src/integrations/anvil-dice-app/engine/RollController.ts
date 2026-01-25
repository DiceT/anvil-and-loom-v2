import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { DiceForge } from './DiceForge';
import { PhysicsWorld } from './core/PhysicsWorld';
import { DiceParser } from './DiceParser';
import type { DiceTheme, PhysicsSettings, RollResult, DiceRollRequest, DiePositionRequest } from './types';
import { DEFAULT_THEME, DEFAULT_PHYSICS } from './types';

interface ActiveDie {
    mesh: THREE.Mesh;
    body: CANNON.Body;
    stopped: boolean;
    result: string | number | null;
    groupId: number; // Index in ParseResult.groups
    type: string;    // 'd6', 'd100', 'd%_tens', 'd%_ones'
    rollId: number;  // Unique ID for this specific die spawn
    isRepositioning?: boolean;
    targetPosition?: THREE.Vector3;
    targetQuaternion?: THREE.Quaternion;
}

export class RollController {
    private diceForge: DiceForge;
    private physicsWorld: PhysicsWorld;
    private scene: THREE.Scene;

    private activeDice: ActiveDie[] = [];
    private bounds = { width: 44, depth: 28, offsetX: 0, offsetZ: 0 };

    // Settings
    private currentTheme: DiceTheme = DEFAULT_THEME;
    private currentPhysics: PhysicsSettings = DEFAULT_PHYSICS;

    // Callback for results
    public onRollComplete: ((result: RollResult) => void) | null = null;

    private isRolling = false;
    private currentModifier = 0;
    private currentNotation = "";
    private currentParseResult: import('./DiceParser').ParseResult | null = null;
    private spawnOrigin: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'right';

    constructor(physicsWorld: PhysicsWorld, scene: THREE.Scene) {
        this.physicsWorld = physicsWorld;
        this.scene = scene;
        this.diceForge = new DiceForge();
    }

    public updateTheme(theme: DiceTheme) {
        this.currentTheme = theme;
    }

    public updatePhysics(physics: PhysicsSettings) {
        this.currentPhysics = physics;
    }

    public setBounds(width: number, depth: number, offsetX: number = 0, offsetZ: number = 0) {
        this.bounds = { width, depth, offsetX, offsetZ };
    }

    public setSpawnOrigin(origin: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') {
        this.spawnOrigin = origin;
    }

    public roll(request: string | DiceRollRequest[]) {
        this.clear();
        this.isRolling = true;

        // Handle array of requests (per-group theming)
        if (Array.isArray(request)) {
            // Combine all notations
            const combinedNotation = request.map(r => r.notation).join(' + ');
            this.currentNotation = combinedNotation;

            let dieKey = 0;
            let groupIndex = 0;

            request.forEach((req) => {
                const parsed = DiceParser.parse(req.notation);
                const groupTheme = req.theme
                    ? { ...this.currentTheme, ...req.theme }
                    : this.currentTheme;

                this.currentModifier += parsed.modifier;

                parsed.groups.forEach((group) => {
                    const count = Math.abs(group.count);

                    for (let i = 0; i < count; i++) {
                        if (group.type === 'd%') {
                            this.spawnDie('d100', dieKey++, groupIndex, 'd%_tens', groupTheme);
                            this.spawnDie('d10', dieKey++, groupIndex, 'd%_ones', groupTheme);
                        } else if (group.type === 'd66') {
                            // d66 = d6 (Tens) + d6 (Ones) with secondary colors
                            const tensTheme = { ...groupTheme };
                            const onesTheme = groupTheme.diceColorSecondary
                                ? {
                                    ...groupTheme,
                                    diceColor: groupTheme.diceColorSecondary,
                                    labelColor: groupTheme.labelColorSecondary || groupTheme.labelColor,
                                    outlineColor: groupTheme.outlineColorSecondary || groupTheme.outlineColor
                                }
                                : groupTheme;
                            this.spawnDie('d6', dieKey++, groupIndex, 'd66_tens', tensTheme);
                            this.spawnDie('d6', dieKey++, groupIndex, 'd66_ones', onesTheme);
                        } else if (group.type === 'd88') {
                            // d88 = d8 (Tens) + d8 (Ones) with secondary colors
                            const tensTheme = { ...groupTheme };
                            const onesTheme = groupTheme.diceColorSecondary
                                ? {
                                    ...groupTheme,
                                    diceColor: groupTheme.diceColorSecondary,
                                    labelColor: groupTheme.labelColorSecondary || groupTheme.labelColor,
                                    outlineColor: groupTheme.outlineColorSecondary || groupTheme.outlineColor
                                }
                                : groupTheme;
                            this.spawnDie('d8', dieKey++, groupIndex, 'd88_tens', tensTheme);
                            this.spawnDie('d8', dieKey++, groupIndex, 'd88_ones', onesTheme);
                        } else {
                            this.spawnDie(group.type, dieKey++, groupIndex, group.type, groupTheme);
                        }
                    }
                    groupIndex++;
                });
            });

            // Store combined parse result
            this.currentParseResult = DiceParser.parse(combinedNotation);

        } else {
            // Simple string notation
            this.currentNotation = request;

            const parsed = DiceParser.parse(request);
            this.currentParseResult = parsed;
            this.currentModifier = parsed.modifier;

            let dieKey = 0;
            parsed.groups.forEach((group, groupIndex) => {
                const count = Math.abs(group.count);

                for (let i = 0; i < count; i++) {
                    if (group.type === 'd%') {
                        this.spawnDie('d100', dieKey++, groupIndex, 'd%_tens', this.currentTheme);
                        this.spawnDie('d10', dieKey++, groupIndex, 'd%_ones', this.currentTheme);
                    } else if (group.type === 'd66') {
                        // d66 = d6 (Tens) + d6 (Ones) with secondary colors
                        const onesTheme = this.currentTheme.diceColorSecondary
                            ? {
                                ...this.currentTheme,
                                diceColor: this.currentTheme.diceColorSecondary,
                                labelColor: this.currentTheme.labelColorSecondary || this.currentTheme.labelColor,
                                outlineColor: this.currentTheme.outlineColorSecondary || this.currentTheme.outlineColor
                            }
                            : this.currentTheme;
                        this.spawnDie('d6', dieKey++, groupIndex, 'd66_tens', this.currentTheme);
                        this.spawnDie('d6', dieKey++, groupIndex, 'd66_ones', onesTheme);
                    } else if (group.type === 'd88') {
                        // d88 = d8 (Tens) + d8 (Ones) with secondary colors
                        const onesTheme = this.currentTheme.diceColorSecondary
                            ? {
                                ...this.currentTheme,
                                diceColor: this.currentTheme.diceColorSecondary,
                                labelColor: this.currentTheme.labelColorSecondary || this.currentTheme.labelColor,
                                outlineColor: this.currentTheme.outlineColorSecondary || this.currentTheme.outlineColor
                            }
                            : this.currentTheme;
                        this.spawnDie('d8', dieKey++, groupIndex, 'd88_tens', this.currentTheme);
                        this.spawnDie('d8', dieKey++, groupIndex, 'd88_ones', onesTheme);
                    } else {
                        this.spawnDie(group.type, dieKey++, groupIndex, group.type, this.currentTheme);
                    }
                }
            });
        }

        // If no dice were spawned, finish immediately
        if (this.activeDice.length === 0) {
            this.isRolling = false;
            this.finishRoll();
        }
    }

    public clear() {
        this.activeDice.forEach(die => {
            this.scene.remove(die.mesh);
            this.physicsWorld.removeBody(die.body);
        });
        this.activeDice = [];
        this.isRolling = false;
        this.currentModifier = 0;
        this.currentNotation = "";
    }

    /**
     * Reposition dice to specific world coordinates.
     * NOTE: Optimal rotation is currently only mapped for d8.
     */
    public async repositionDice(targets: DiePositionRequest[], duration: number = 500): Promise<void> {
        // Find matching dice by ID
        const diceToMove: ActiveDie[] = [];

        for (const target of targets) {
            const die = this.activeDice.find(d => d.rollId === target.id);
            if (die) {
                die.isRepositioning = true;
                die.targetPosition = new THREE.Vector3(target.position.x, target.position.y, target.position.z);

                if (target.rotation) {
                    die.targetQuaternion = new THREE.Quaternion(
                        target.rotation.x,
                        target.rotation.y,
                        target.rotation.z,
                        target.rotation.w
                    );
                } else {
                    // Use optimal rotation if available
                    die.targetQuaternion = this.getOptimalRotation(die);
                }

                // Disable physics during repositioning
                die.body.type = CANNON.Body.KINEMATIC;
                diceToMove.push(die);
            }
        }

        if (diceToMove.length === 0) return;

        // Animate over duration
        const startTime = performance.now();
        const startPositions = diceToMove.map(d => d.mesh.position.clone());
        const startQuaternions = diceToMove.map(d => d.mesh.quaternion.clone());

        return new Promise((resolve) => {
            const animate = () => {
                const elapsed = performance.now() - startTime;
                const t = Math.min(elapsed / duration, 1);
                const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

                for (let i = 0; i < diceToMove.length; i++) {
                    const die = diceToMove[i];
                    if (!die.targetPosition || !die.targetQuaternion) continue;

                    // Lerp position
                    die.mesh.position.lerpVectors(startPositions[i], die.targetPosition, eased);
                    die.mesh.quaternion.copy(startQuaternions[i]).slerp(die.targetQuaternion, eased);

                    // Sync physics body
                    die.body.position.set(die.mesh.position.x, die.mesh.position.y, die.mesh.position.z);
                    die.body.quaternion.set(die.mesh.quaternion.x, die.mesh.quaternion.y, die.mesh.quaternion.z, die.mesh.quaternion.w);
                }

                if (t < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Done. Re-enable physics if needed
                    for (const die of diceToMove) {
                        die.isRepositioning = false;
                        die.body.type = CANNON.Body.DYNAMIC;
                        die.body.velocity.set(0, 0, 0);
                        die.body.angularVelocity.set(0, 0, 0);
                    }
                    resolve();
                }
            };
            animate();
        });
    }

    public update(time: number) {
        if (!this.isRolling || this.activeDice.length === 0) {
            // Update liquid shader even when not rolling
            this.activeDice.forEach(die => {
                if (die.mesh.userData.isLiquid && die.mesh.userData.liquidMesh) {
                    const liquidMat = die.mesh.userData.liquidMesh.material as THREE.ShaderMaterial;
                    if (liquidMat.uniforms && liquidMat.uniforms.time) {
                        liquidMat.uniforms.time.value = time % 7200;
                    }
                }
            });
            return;
        }

        let allStopped = true;

        // Sync Physics to Visuals & Check Stability
        this.activeDice.forEach(die => {
            if (die.isRepositioning) return; // Skip repositioning dice

            die.mesh.position.copy(die.body.position as any);
            die.mesh.quaternion.copy(die.body.quaternion as any);

            // Update liquid shader
            if (die.mesh.userData.isLiquid && die.mesh.userData.liquidMesh) {
                const liquidMat = die.mesh.userData.liquidMesh.material as THREE.ShaderMaterial;
                if (liquidMat.uniforms && liquidMat.uniforms.time) {
                    liquidMat.uniforms.time.value = time % 7200;
                }
            }

            if (!die.stopped) {
                // Check velocity
                const v = die.body.velocity.lengthSquared();
                const w = die.body.angularVelocity.lengthSquared();

                // Thresholds: Very low movement
                if (v < 0.01 && w < 0.01) {
                    die.stopped = true;
                    // Calculate Result immediately when one stops
                    die.result = this.getDieValue(die);
                } else {
                    allStopped = false;
                }
            }
        });

        if (allStopped && this.isRolling) {
            this.isRolling = false;
            this.finishRoll();
        }
    }

    private finishRoll() {
        // Aggregate Results
        let total = 0;
        const breakdown: { type: string, value: number, dropped?: boolean }[] = [];
        const diceList: { id: number; groupId: number; value: number; type: string }[] = [];

        // Group dice by groupId to handle d%
        const groups = new Map<number, ActiveDie[]>();
        this.activeDice.forEach(d => {
            if (!groups.has(d.groupId)) groups.set(d.groupId, []);
            groups.get(d.groupId)!.push(d);
        });

        groups.forEach((dice, _) => {
            const firstType = dice[0]?.type || '';

            if (firstType.startsWith('d%')) {
                dice.sort((a, b) => a.rollId - b.rollId);

                for (let i = 0; i < dice.length; i += 2) {
                    const tenDie = dice[i];
                    const oneDie = dice[i + 1];

                    if (tenDie && oneDie) {
                        const tensStr = String(tenDie.result);
                        const onesStr = String(oneDie.result);
                        let tens = parseInt(tensStr.replace('00', '0'));
                        let ones = parseInt(onesStr);
                        if (isNaN(tens)) tens = 0;
                        if (isNaN(ones)) ones = 0;

                        let val = tens + ones;
                        if (val === 0 && tensStr === '00' && onesStr === '0') val = 100;

                        total += val;
                        breakdown.push({ type: 'd%', value: val });
                        diceList.push({ id: tenDie.rollId, groupId: tenDie.groupId, value: val, type: 'd%' });
                    }
                }
            } else if (firstType.startsWith('d66')) {
                dice.sort((a, b) => a.rollId - b.rollId);
                for (let i = 0; i < dice.length; i += 2) {
                    const tenDie = dice[i];
                    const oneDie = dice[i + 1];
                    if (tenDie && oneDie) {
                        const tens = parseInt(String(tenDie.result)) || 1;
                        const ones = parseInt(String(oneDie.result)) || 1;
                        // d66: tens is 1-6, ones is 1-6, result is tens*10 + ones
                        const val = tens * 10 + ones;
                        total += val;
                        breakdown.push({ type: 'd66', value: val });
                        diceList.push({ id: tenDie.rollId, groupId: tenDie.groupId, value: val, type: 'd66' });
                    }
                }
            } else if (firstType.startsWith('d88')) {
                dice.sort((a, b) => a.rollId - b.rollId);
                for (let i = 0; i < dice.length; i += 2) {
                    const tenDie = dice[i];
                    const oneDie = dice[i + 1];
                    if (tenDie && oneDie) {
                        const tens = parseInt(String(tenDie.result)) || 1;
                        const ones = parseInt(String(oneDie.result)) || 1;
                        // d88: tens is 1-8, ones is 1-8, result is tens*10 + ones
                        const val = tens * 10 + ones;
                        total += val;
                        breakdown.push({ type: 'd88', value: val });
                        diceList.push({ id: tenDie.rollId, groupId: tenDie.groupId, value: val, type: 'd88' });
                    }
                }
            } else {
                // Standard Dice
                const groupConfig = this.currentParseResult?.groups[dice[0].groupId];

                type DieRef = { die: ActiveDie, val: number };
                const dieRefs: DieRef[] = [];

                dice.forEach(d => {
                    let valStr = String(d.result);
                    let val = parseInt(valStr);
                    if (d.type === 'd10' && valStr === '0') val = 10;
                    if (d.type === 'd100' && valStr === '00') val = 0;
                    if (isNaN(val)) val = 0;
                    dieRefs.push({ die: d, val: val });
                });

                // Apply Keep Logic
                if (groupConfig && groupConfig.keep) {
                    if (groupConfig.keep === 'highest') {
                        dieRefs.sort((a, b) => b.val - a.val);
                    } else {
                        dieRefs.sort((a, b) => a.val - b.val);
                    }

                    const keepCount = groupConfig.keepCount || 1;

                    dieRefs.forEach((ref, index) => {
                        const kept = index < keepCount;
                        if (kept) {
                            total += ref.val;
                        }
                        breakdown.push({ type: ref.die.type, value: ref.val, dropped: !kept });
                        diceList.push({ id: ref.die.rollId, groupId: ref.die.groupId, value: ref.val, type: ref.die.type });
                    });

                } else {
                    dieRefs.forEach(ref => {
                        total += ref.val;
                        breakdown.push({ type: ref.die.type, value: ref.val, dropped: false });
                        diceList.push({ id: ref.die.rollId, groupId: ref.die.groupId, value: ref.val, type: ref.die.type });
                    });
                }
            }
        });

        // Add Modifier
        total += this.currentModifier;

        const result: RollResult = {
            total: total,
            notation: this.currentNotation,
            breakdown: breakdown,
            modifier: this.currentModifier,
            dice: diceList
        };

        if (this.onRollComplete) {
            this.onRollComplete(result);
        }
    }

    /**
     * Get the optimal rotation for a die to show its current value clearly.
     * NOTE: Currently only mapped for d8. Other dice return current rotation.
     */
    private getOptimalRotation(die: ActiveDie): THREE.Quaternion {
        // Only d8 has optimal rotation mapping currently
        if (die.type !== 'd8') {
            return die.mesh.quaternion.clone();
        }

        // d8 face normals - maps value to target normal (pointing up)
        const d8Normals: { [key: number]: THREE.Vector3 } = {
            1: new THREE.Vector3(1, 1, 1).normalize(),
            2: new THREE.Vector3(-1, -1, 1).normalize(),
            3: new THREE.Vector3(-1, 1, -1).normalize(),
            4: new THREE.Vector3(1, -1, -1).normalize(),
            5: new THREE.Vector3(-1, 1, 1).normalize(),
            6: new THREE.Vector3(1, -1, 1).normalize(),
            7: new THREE.Vector3(1, 1, -1).normalize(),
            8: new THREE.Vector3(-1, -1, -1).normalize()
        };

        const val = parseInt(String(die.result));
        const targetNormal = d8Normals[val];

        if (!targetNormal) {
            return die.mesh.quaternion.clone();
        }

        // Calculate quaternion to rotate targetNormal to world up (0, 1, 0)
        const worldUp = new THREE.Vector3(0, 1, 0);
        const q = new THREE.Quaternion();
        q.setFromUnitVectors(targetNormal, worldUp);

        return q;
    }

    private getDieValue(die: ActiveDie): string | number {
        const mesh = die.mesh;
        const faceValues = mesh.userData.faceValues;

        if (!faceValues || faceValues.length === 0) return '?';

        const worldUp = new THREE.Vector3(0, 1, 0);
        const quaternion = mesh.quaternion.clone().invert();
        const localUp = worldUp.applyQuaternion(quaternion);

        // Check for D4 (values are arrays)
        const isD4 = Array.isArray(faceValues[0].value);

        if (isD4) {
            const localDown = localUp.clone().negate();

            let closestFace = null;
            let maxDot = -Infinity;

            for (const fv of faceValues) {
                const dot = localDown.dot(fv.normal);
                if (dot > maxDot) {
                    maxDot = dot;
                    closestFace = fv;
                }
            }

            if (!closestFace) return '?';

            const present = closestFace.value as string[];
            const all = ['1', '2', '3', '4'];
            const result = all.find(n => !present.includes(n));
            return result || '?';

        } else {
            let closestFace = null;
            let maxDot = -Infinity;

            for (const fv of faceValues) {
                const dot = localUp.dot(fv.normal);
                if (dot > maxDot) {
                    maxDot = dot;
                    closestFace = fv;
                }
            }

            return closestFace ? closestFace.value : '?';
        }
    }

    private spawnDie(type: string, rollId: number, groupId: number, subType: string, theme: DiceTheme) {
        try {
            // If d%_tens or d%_ones, we need physical mesh for d100/d10
            let meshType = type;
            if (subType === 'd%_tens') meshType = 'd100';
            if (subType === 'd%_ones') meshType = 'd10';

            const mesh = this.diceForge.createdice(meshType, theme);

            // Spawn Position based on spawnOrigin
            let x = 0, y = 0, z = 0;
            let vx = 0, vy = 0, vz = 0;
            let angularX = 0, angularY = 0, angularZ = 0;
            const throwForce = (this.currentPhysics.throwForce || 40) + Math.random() * 5;

            // Special behavior for d2 (coin flip)
            if (meshType === 'd2') {
                // Spawn from high above, near center with slight random offset
                x = (Math.random() - 0.5) * 4;
                y = 45 + Math.random() * 5; // Very high drop
                z = (Math.random() - 0.5) * 3;

                // Some horizontal velocity for arc effect
                vx = (Math.random() - 0.5) * 8;
                vy = 0; // Let gravity do the work
                vz = (Math.random() - 0.5) * 8;

                // Clean flip spin along ONE horizontal axis only
                const flipAxis = Math.random() > 0.5 ? 'x' : 'z';
                const flipSpeed = 12 + Math.random() * 8; // More visible flip with longer drop
                if (flipAxis === 'x') {
                    angularX = flipSpeed * (Math.random() > 0.5 ? 1 : -1);
                    angularY = 0;
                    angularZ = 0;
                } else {
                    angularX = 0;
                    angularY = 0;
                    angularZ = flipSpeed * (Math.random() > 0.5 ? 1 : -1);
                }

            } else if (this.spawnOrigin === 'bottom') {
                // Dice enter from bottom, throw upward (-Z)
                const wallZ = this.bounds.depth / 2;
                const spawnZ = wallZ - 1;

                const safeX = (this.bounds.width / 2) - 4;
                const spread = safeX > 0 ? safeX * 2 : 5;

                x = (Math.random() - 0.5) * spread;
                y = 5 + Math.random() * 2;
                z = spawnZ + (Math.random() * 2);

                vx = (Math.random() - 0.5) * 5;
                vy = 0;
                vz = -throwForce;

                angularX = (Math.random() - 0.5) * 20;
                angularY = (Math.random() - 0.5) * 20;
                angularZ = (Math.random() - 0.5) * 20;

            } else if (this.spawnOrigin === 'top') {
                // Dice enter from top, throw downward (+Z)
                const wallZ = this.bounds.depth / 2;
                const spawnZ = -wallZ + 1;

                const safeX = (this.bounds.width / 2) - 4;
                const spread = safeX > 0 ? safeX * 2 : 5;

                x = (Math.random() - 0.5) * spread;
                y = 5 + Math.random() * 2;
                z = spawnZ - (Math.random() * 2);

                vx = (Math.random() - 0.5) * 5;
                vy = 0;
                vz = throwForce;

                angularX = (Math.random() - 0.5) * 20;
                angularY = (Math.random() - 0.5) * 20;
                angularZ = (Math.random() - 0.5) * 20;

            } else if (this.spawnOrigin === 'left') {
                // Dice enter from left, throw rightward (+X)
                const wallX = this.bounds.width / 2;
                const spawnX = -wallX + 1;

                const safeZ = (this.bounds.depth / 2) - 3;
                const spread = safeZ > 0 ? safeZ * 2 : 2;

                x = spawnX - (Math.random() - 0.5) * 1;
                y = 2 + Math.random() * 1;
                z = (Math.random() - 0.5) * spread;

                vx = throwForce;
                vy = 0;
                vz = (Math.random() - 0.5) * 2;

                angularX = (Math.random() - 0.5) * 20;
                angularY = (Math.random() - 0.5) * 20;
                angularZ = (Math.random() - 0.5) * 20;

            } else if (this.spawnOrigin === 'top-left') {
                // Dice enter from top-left corner, throw diagonally toward center
                const wallX = this.bounds.width / 2;
                const wallZ = this.bounds.depth / 2;

                x = -wallX + 1 + (Math.random() - 0.5) * 2;
                y = 3 + Math.random() * 2;
                z = -wallZ + 1 + (Math.random() - 0.5) * 2;

                const diagForce = throwForce * 0.7;
                vx = diagForce;
                vy = 0;
                vz = diagForce;

                angularX = (Math.random() - 0.5) * 20;
                angularY = (Math.random() - 0.5) * 20;
                angularZ = (Math.random() - 0.5) * 20;

            } else if (this.spawnOrigin === 'top-right') {
                // Dice enter from top-right corner
                const wallX = this.bounds.width / 2;
                const wallZ = this.bounds.depth / 2;

                x = wallX - 1 + (Math.random() - 0.5) * 2;
                y = 3 + Math.random() * 2;
                z = -wallZ + 1 + (Math.random() - 0.5) * 2;

                const diagForce = throwForce * 0.7;
                vx = -diagForce;
                vy = 0;
                vz = diagForce;

                angularX = (Math.random() - 0.5) * 20;
                angularY = (Math.random() - 0.5) * 20;
                angularZ = (Math.random() - 0.5) * 20;

            } else if (this.spawnOrigin === 'bottom-left') {
                // Dice enter from bottom-left corner
                const wallX = this.bounds.width / 2;
                const wallZ = this.bounds.depth / 2;

                x = -wallX + 1 + (Math.random() - 0.5) * 2;
                y = 3 + Math.random() * 2;
                z = wallZ - 1 + (Math.random() - 0.5) * 2;

                const diagForce = throwForce * 0.7;
                vx = diagForce;
                vy = 0;
                vz = -diagForce;

                angularX = (Math.random() - 0.5) * 20;
                angularY = (Math.random() - 0.5) * 20;
                angularZ = (Math.random() - 0.5) * 20;

            } else if (this.spawnOrigin === 'bottom-right') {
                // Dice enter from bottom-right corner
                const wallX = this.bounds.width / 2;
                const wallZ = this.bounds.depth / 2;

                x = wallX - 1 + (Math.random() - 0.5) * 2;
                y = 3 + Math.random() * 2;
                z = wallZ - 1 + (Math.random() - 0.5) * 2;

                const diagForce = throwForce * 0.7;
                vx = -diagForce;
                vy = 0;
                vz = -diagForce;

                angularX = (Math.random() - 0.5) * 20;
                angularY = (Math.random() - 0.5) * 20;
                angularZ = (Math.random() - 0.5) * 20;

            } else {
                // Default: right - Dice enter from right, throw leftward (-X)
                const wallX = this.bounds.width / 2;
                const spawnX = wallX - 1;

                const safeZ = (this.bounds.depth / 2) - 3;
                const spread = safeZ > 0 ? safeZ * 2 : 2;

                x = spawnX + (Math.random() - 0.5) * 1;
                y = 2 + Math.random() * 1;
                z = (Math.random() - 0.5) * spread;

                vx = -throwForce;
                vy = 0;
                vz = (Math.random() - 0.5) * 2;

                angularX = (Math.random() - 0.5) * 20;
                angularY = (Math.random() - 0.5) * 20;
                angularZ = (Math.random() - 0.5) * 20;
            }

            // Apply bounds offset to spawn position
            x += this.bounds.offsetX;
            z += this.bounds.offsetZ;

            mesh.position.set(x, y, z);
            mesh.castShadow = true;

            // Physics Body
            let bodyShape: CANNON.Shape | null = null;
            if ((mesh as any).body_shape) {
                bodyShape = (mesh as any).body_shape;
            } else {
                bodyShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
            }

            const body = new CANNON.Body({
                mass: 1,
                shape: bodyShape!,
                position: new CANNON.Vec3(x, y, z),
                material: this.physicsWorld.diceMaterial
            });

            // Random Rotation
            body.quaternion.setFromEuler(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );

            const velocity = new CANNON.Vec3(vx, vy, vz);
            body.velocity.copy(velocity);
            body.angularVelocity.set(angularX, angularY, angularZ);

            this.scene.add(mesh);
            this.physicsWorld.addBody(body);

            this.activeDice.push({
                mesh,
                body,
                stopped: false,
                result: null,
                groupId: groupId,
                type: subType,
                rollId: rollId
            });

        } catch (e) {
            console.error(`Failed to spawn die: ${type}`, e);
        }
    }
}
