import { NS } from "../../NetscriptDefinitions";
import { Batch, Command, CommandType } from "fractal/batcher";
import { PwndServer } from "model/pwndServer";
import { Logger } from "log/logger";

export class Dispatcher extends Logger {
    ns: NS;
    timeSinceLastDispatch: number;

    constructor(ns: NS) {
        super(ns);
        this.ns = ns;
        this.timeSinceLastDispatch = Date.now();
    }

    /**
     * 
     * @param runners 
     * @param batch 
     * @returns true if all commands in the batch were dispatched.
     */
    async tryDispatch(runners: PwndServer[], batch: Batch) {
        let commands = batch.commands;

        if (commands.length == 0) {
            this.log(`WARN: Empty batch, likely due to not being needed. Discarding.`);
            return;
        }

        // setup ram allocation map
        const allocatedHostRam: Map<string, number> = new Map();
        runners.forEach(r => allocatedHostRam.set(r.hostname, 0));

        this.log(`Preparing to dispatch batch with ${commands.length} commands.`);

        commands.forEach(async command => {

            for (let i: number = 0; i < runners.length; i++) {
                const runner = runners[i];

                if (runner.hostname == undefined) continue;
                // calculate required ram
                const allocatedRam = allocatedHostRam.get(runner.hostname) ?? 0;
                const availableRam = runner.freeRam() + allocatedRam;

                const script = Dispatcher.getScriptForCommandType(command.type);
                const requiredRamForSingleThread = this.ns.getScriptRam(script, runner.hostname);
                const totalRequiredRam = requiredRamForSingleThread * command.threads;
                
                if (totalRequiredRam == 0) {
                    this.log(
                        `ERROR: Can't get ram for ${runner.hostname}. ` + 
                        `RequiredRam: ${requiredRamForSingleThread} ` + 
                        `Total: ${totalRequiredRam} Script: ${script}`);
                } else if (availableRam > totalRequiredRam && totalRequiredRam != 0) {
                    // if there's room, add it to the map
                    allocatedHostRam.set(runner.hostname, allocatedRam + totalRequiredRam);
                    command.executor = runner.hostname
                    this.log(`Runner found for ${command.type}: ${runner.hostname}`);
                    i = runners.length;
                } 
            }
        });

        let runnerCount = commands.reduce((a, b) => b.executor != undefined && b.executor.length != 0 ? 1 + a : a + 0, 0);
        if (runnerCount != commands.length) {
            this.log(`ERROR: Unable to find runners for all commands in batch.`);
        } else {
            // using 50ms intervals to start with
            let interval = 50;

            this.log(`INFO: All commands have a runner. Starting batch at ${interval}ms intervals.`);


            // we'll find the longest command first, every other command will come before or after this one.
            let longestCommandIndex: number = 0;
            for (let i = 0; i < commands.length; i++) {
                this.log(`Command: ${commands[i].type} Threads: ${commands[i].threads} Target: ${commands[i].target}`);
                if (commands[i].duration > commands[longestCommandIndex].duration) longestCommandIndex = i;
            }

            // each command before the longest will 50 ms earlier. So if longest is ID 3, it's the 4th command and occurs 150ms after the first command
            // t 00 command 1, ID 0 finishes
            // t 50 command 2, ID 1 finishes
            // t 100 command 3, ID 2 finishes
            // t 150 command 4, ID 3 finishes

            // the delay for command N is the longest command duration - the duration of N + interval * (command number - 1, or use command index)
            // if N is ID 2 in above example, then 2 needs a delay of ID 3's duration - ID 2's + 50ms * 2
            let longest = commands[longestCommandIndex].duration
            for (let i = 0; i < commands.length; i++) {
                const c = commands[i];
                const delay = longest - c.duration + interval * i;
                c.delay = delay;
                this.log(`Command Index ${i} assigned delay: ${Math.trunc(delay)}ms and has duration: ${c.duration}`);
            }

            // dispatch with ns.exec
            commands.forEach(c => {
                const script = Dispatcher.getScriptForCommandType(c.type)
                this.ns.exec(script, c.executor!, c.threads, c.target, c.delay!);
            })
        }
    }

    isBatchRunning(batch: Batch) {
        if (batch.commands.length == 0) return false;

        let isRunning = false;

        batch.commands.forEach(c => {
            let script = Dispatcher.getScriptForCommandType(c.type);
            if (c.executor != undefined) {
                isRunning = isRunning || this.ns.scriptRunning(script, c.executor!);
            }
        })

        return isRunning;
    }

    public static getScriptForCommandType(commandType: CommandType) {
        switch(commandType) {
            case CommandType.GROW:
                return `grow.js`;
            case CommandType.HACK:
                return `hack.js`;
            case CommandType.WEAKEN:
                return `weaken.js`;
        }
    }
}