import { NS } from "../../NetscriptDefinitions";
import { Batch, Command, CommandType } from "fractal/batcher";
import { PwndServer } from "model/pwndServer";
import { PortLog } from "/log/portLog";

export class Dispatcher {
    ns: NS;
    timeSinceLastDispatch: number;
    portLog: PortLog;

    constructor(ns: NS) {
        this.ns = ns;
        this.timeSinceLastDispatch = Date.now();
        this.portLog = new PortLog(ns);
    }

    /**
     * 
     * @param runners 
     * @param batch 
     * @returns true if all commands in the batch were dispatched.
     */
    tryDispatch(runners: PwndServer[], batch: Batch) {
        let commands = batch.commands;
        let commandTotal = commands.length;
        let currentIndex = 0;
        let commandFailed = false;

        this.portLog.log(`INFO: Starting batch, completion ETA: ${batch.runTime}`);
//////////////////////////////////

// attempt at planning the commands before executing them

// really just need a map of which servers have XX ram, and how much the required thread count needs, 
// if I figure that out for each command first then I can see which server (aka bucket) the required thread count (aka ram juice) will fit in
// no need to keep track of which commands are going on which servers, just need to find enough buckets to say yeah it'll fit and if so which bucket it
// goes in
///
        let plannedCommands: Map<PwndServer, Command[]> = new Map();

        while (currentIndex < commandTotal) {
            const currentCommand = commands[currentIndex];


            for (let i = 0; i < runners.length; i++) {
                const runner = runners[i];

                if (this.ableToRunCommand(runner, currentCommand)) {
                    if (plannedCommands.get(runner) == undefined) plannedCommands.set(runner, []);
                    plannedCommands.get(runner)!.push(currentCommand);
                    break;
                }
            }

        }

///////////////////////////////

        while (currentIndex < commandTotal && !commandFailed) {
            const currentCommand = commands[currentIndex];
            let commandDispatched = false;

            for (let i = 0; i < runners.length; i++) {
                const runner = runners[i];

                
                //TODO: need to instead sort what can be ran and then if all
                // of the commands in the batch can be applied, execute

                if (this.ableToRunCommand(runner, currentCommand)) {
                    this.portLog.log(`Running command ${currentIndex}: ${currentCommand.type}.`);
                    runner.runScript(Dispatcher.getScriptForCommandType(currentCommand.type), currentCommand.threads, [currentCommand.target, currentCommand.delay.toString()]);
                    currentIndex++;
                    commandDispatched = true;
                }

                if (commandDispatched) {
                    break;
                }
            }

            commandFailed = commandFailed || !commandDispatched;
        }


        return !commandFailed;
    }

    private ableToRunCommand(runner: PwndServer, command: Command) {
        let script = Dispatcher.getScriptForCommandType(command.type);
        return runner.canRunScriptCount(script, command.threads);
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