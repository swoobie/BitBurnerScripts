import {NS, Server} from '../../NetscriptDefinitions';
import { Dispatcher } from './dispatcher';
import { Logger } from 'log/logger';

/**
 * Responsible for executing a batch of commands in a sequence on a target.
 * It creates the batch for the target and returns the batch to be analyzed or sent for dispatch.
 */
export class Batcher extends Logger {
    ns: NS;

    constructor(ns: NS) {
        super(ns);
        this.ns = ns;
    }

    createPreparationBatch(target: string) {
        this.log(`INFO: Creating preparation batch for ${target}.`);

        let batch = new Batch(this.ns, target);
        batch.addCommand(CommandType.WEAKEN);
        batch.addCommand(CommandType.GROW);
        batch.addCommand(CommandType.WEAKEN);
        return batch;
    }

    createHackingBatch(target: string) {
        this.log(`INFO: Creating hacking batch for ${target}.`);

        let batch = new Batch(this.ns, target);
        batch.addCommand(CommandType.WEAKEN);
        batch.addCommand(CommandType.GROW);
        batch.addCommand(CommandType.WEAKEN);
        batch.addCommand(CommandType.HACK);
        return batch;
    }
}

/**
 * Represents a batch of commands.
 * Delays can be added more than once and will result in that command
 * being queued multiple times.
 * The thread count and execution time is static for each command type though.
 */
export class Batch extends Logger {
    private readonly commandBuffer: number = 200;

    public targetName: string
    public commands: Command[];

    /*
    player: Player;
    target: Server;
    */
   
    ns: NS;

    constructor(ns: NS, targetName: string)  {
        super(ns);
        this.targetName = targetName;
        this.commands = [];
        this.ns = ns;
    }

    get runTime() {
        // weaken is always first, so the total delay is the last command's delay added plus weaken time
        return 0;
    }

    addCommand(type: CommandType) {
        switch(type) {
            case CommandType.GROW: 
                this.addGrowCommand();
                break;
            case CommandType.HACK:
                this.addHackCommand();
                break;
            case CommandType.WEAKEN:
                this.addWeakenCommand();
                break;
        }
    }
    private addWeakenCommand() {
        this.log(`Adding Weaken command.`);
        const weakenTime = this.ns.getWeakenTime(this.targetName);
        const weakenAmount = 0.05; // constant per thread
        const currentSecurity = this.ns.getServerSecurityLevel(this.targetName);
        
        const weakenThreads = currentSecurity / weakenAmount;
        const weakenEstimate = this.ns.weakenAnalyze(weakenThreads);
        
        const dontSkip = this.commands.length == 0;

        const difference = currentSecurity - weakenEstimate;

        // TODO: need to figure this part out, weaken doesn't skip being added when it should

        if (difference < 5 && difference > 0 || (difference == 0 && dontSkip)) {
            this.log(`Weaken Estimate looks good: Current: ${currentSecurity} Minimum: ${this.ns.getServerMinSecurityLevel(this.targetName)} Estimate: ${weakenEstimate} Difference: ${difference}.`)
            this.commands.push({
                duration: weakenTime,
                target: this.targetName,
                threads: Math.ceil(weakenThreads),
                type: CommandType.WEAKEN
            })
        } else {
            this.log(`Weaken not needed. Current Security: ${currentSecurity} Minimum Security: ${this.ns.getServerMinSecurityLevel(this.targetName)} Difference: ${difference}.`);
        }
// from https://darktechnomancer.github.io/ 
// By passing the time it’s expected to end, and how long it’s meant to run as arguments, you can have it calculate its own delay at no additional RAM cost.
// 
// maybe don't pass delay but change it to end time? 
/* 
    Goals for batch execution: 
    1) Tighten the gap between tasks to only 5ms. 
    2) Start a new batch within 5ms of the previous one 
    3) Have your tasks ending within 1-2ms of when they are supposed to. 
    4) Automatically recalculate threads and timing after a level up.
*/
        
    }

    private addGrowCommand() {
        this.log(`Adding Grow command.`);
        let growTime = this.ns.getGrowTime(this.targetName);
        
        // with formulas, should be able to predict this from zero security instead of current
        let multiplier = this.ns.getServerMaxMoney(this.targetName) / this.ns.getServerMoneyAvailable(this.targetName);
        let growThreads = 1;

        try {
            growThreads = this.ns.growthAnalyze(this.targetName, multiplier);
        } catch {}

        let repeatCount = growThreads / 2000;

        if (growThreads > 0 && repeatCount > 0) {
            for (let i = 0; i < repeatCount; i++) {
                this.commands.push({
                    duration: growTime,
                    target: this.targetName,
                    threads: Math.ceil(growThreads / repeatCount),
                    type: CommandType.GROW
                })
            }
        } else {
            this.log(`Skipping Grow on ${this.targetName} as it needs ${growThreads.toPrecision(3)} threads.`);
        }
    }

    private addHackCommand() {
        this.log(`Adding Hack command.`);
        let hackTime = this.ns.getHackTime(this.targetName);

        let desiredAmount = this.ns.getServerMaxMoney(this.targetName) / 2;
        let hackThreads = this.ns.hackAnalyzeThreads(this.targetName, desiredAmount);

        if (hackThreads < 1) {
            hackThreads = 1; // fall back
        }

        this.commands.push({
            duration: hackTime,
            target: this.targetName,
            threads: Math.trunc(hackThreads),
            type: CommandType.HACK
        }) 
    }
}

export interface Command {
    type: CommandType,
    target: string,
    threads: number,
    duration: number,
    delay?: number,
    executor?: string
}

export enum CommandType {
    HACK = `HACK`,
    GROW = `GROW`,
    WEAKEN = `WEAK`
}