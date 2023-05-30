import {NS} from '../../NetscriptDefinitions';

/**
 * Responsible for executing a batch of commands in a sequence on a target.
 * It creates the batch for the target and returns the batch to be analyzed or sent for dispatch.
 */
export class Batcher {
    ns: NS;

    constructor(ns: NS) {
        this.ns = ns;
    }

    createPreparationBatch(target: string) {
        this.ns.print(`INFO: Creating preparation batch for ${target}.`);
        let metadata = this.createMetadata(target, false); 

        let batch = new Batch(metadata);
        batch.addCommand(CommandType.WEAKEN);
        batch.addCommand(CommandType.GROW);
        batch.addCommand(CommandType.WEAKEN);
        return batch;
    }

    createHackingBatch(target: string) {
        this.ns.print(`INFO: Creating hacking batch for ${target}.`);
        let metadata = this.createMetadata(target); 

        let batch = new Batch(metadata);
        batch.addCommand(CommandType.WEAKEN);
        batch.addCommand(CommandType.GROW);
        batch.addCommand(CommandType.WEAKEN);
        batch.addCommand(CommandType.HACK);
        return batch;
    }

    private createMetadata(target: string, includeHacking: boolean = true) {
        let gTime = this.ns.getGrowTime(target);
        let growMultiplierNeeded = Math.max(
            this.ns.getServerMaxMoney(target) / this.ns.getServerMoneyAvailable(target),
            this.ns.getServerMaxMoney(target) / 2
        );
        let gThreads = this.ns.growthAnalyze(target, growMultiplierNeeded);
        let gSecurityIncrease = this.ns.growthAnalyzeSecurity(gThreads, target);

        let hTime = this.ns.getHackTime(target);
        let hRequiredMoney = Math.floor(this.ns.getServerMaxMoney(target) / 2);
        let hThreads = this.ns.hackAnalyzeThreads(target, hRequiredMoney);
        if (hThreads < 0) hThreads = 1;
        let hSecurityIncrease = this.ns.hackAnalyzeSecurity(hThreads, target);

        let wTime = this.ns.getWeakenTime(target);
        let weakenAmountPerThread = 0.05; // Same as this.ns.weakenAnalyze(1) but saves some ram
        let wThreads = (this.ns.getServerSecurityLevel(target) + gSecurityIncrease) / weakenAmountPerThread;

        // make sure our weaken delay is at least the length required to end exactly when growth ends
        let maxTime = Math.max(wTime, gTime, hTime);
        let minWeakenDelay = maxTime - wTime;
        let minHackDelay = maxTime - hTime ;
        let minGrowDelay = maxTime - gTime;

        // if (this.ns.fileExists(`Formulas.exe`)) {
        //     let targetServer = this.ns.getServer(target);
        //     let player = this.ns.getPlayer();
        // }


        let metadata: BatchMetadata = {
            target: target,
            growthTime: gTime,
            growMultiplierNeeded: growMultiplierNeeded,
            growThreads: Math.ceil(gThreads),
            gSecurityIncrease: gSecurityIncrease,
            hackTime: includeHacking ? hTime : 0,
            hackRequiredMoney: includeHacking ? hRequiredMoney : 0,
            hackThreads: includeHacking ? Math.floor(hThreads) : 0,
            hackSecurityIncrease: includeHacking ? hSecurityIncrease : 0,
            weakenTime: wTime,
            weakenAmountPerThread: weakenAmountPerThread, // Same as this.ns.weakenAnalyze(1) but saves some ram
            weakenThreads:  Math.ceil(wThreads),
            minWeakenDelay: minWeakenDelay,
            minHackDelay: minHackDelay,
            minGrowDelay: minGrowDelay
        }
        return metadata;
    }

}

export interface BatchMetadata {
    target: string;

    growthTime: number;
    growMultiplierNeeded: number;
    growThreads: number;
    gSecurityIncrease: number;

    hackTime: number;
    hackRequiredMoney: number;
    hackThreads: number; 
    hackSecurityIncrease:number;

    weakenTime: number;
    weakenAmountPerThread: number;
    weakenThreads: number;
    minWeakenDelay: number;
    minHackDelay: number;
    minGrowDelay: number;
}

/**
 * Represents a batch of commands.
 * Delays can be added more than once and will result in that command
 * being queued multiple times.
 * The thread count and execution time is static for each command type though.
 */
export class Batch {
    private readonly commandBuffer: number = 200;

    public metadata: BatchMetadata
    public commands: Command[];

    constructor(metadata: BatchMetadata)  {
        this.metadata = metadata;
        this.commands = [];
    }

    get runTime() {
        // weaken is always first, so the total delay is the last command's delay added plus weaken time
        return this.metadata.weakenTime + this.commands[this.commands.length - 1].delay; 
    }

    addCommand(type: CommandType) {
        this.commands.push({
            type: type,
            target: this.metadata.target,
            threads: this.getThreadsFromMetadataByType(type),
            delay: this.commandBuffer * this.commands.length + this.getMinDelaysFromMetadataByType(type)
        });
    }

    
    toJson() {
        return JSON.stringify({
            commands: [...this.commands.entries()],
            metadata: JSON.stringify(this.metadata)
        });
    }

    private getThreadsFromMetadataByType(commandType: CommandType) {
        switch (commandType) {
            case CommandType.WEAKEN:
                return this.metadata.weakenThreads;
            case CommandType.GROW:
                return this.metadata.growThreads;
            case CommandType.HACK:
                return this.metadata.hackThreads;
        }   
    }

    private getMinDelaysFromMetadataByType(commandType: CommandType) {
        switch (commandType) {
            case CommandType.WEAKEN:
                return this.metadata.minWeakenDelay;
            case CommandType.GROW:
                return this.metadata.minGrowDelay;
            case CommandType.HACK:
                return this.metadata.minHackDelay;
        }   
    }
}

export interface Command {
    type: CommandType,
    target: string,
    threads: number,
    delay: number,
}

export enum CommandType {
    HACK = `HACK`,
    GROW = `GROW`,
    WEAKEN = `WEAK`
}