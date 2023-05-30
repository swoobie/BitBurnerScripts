import { NS } from "../../NetscriptDefinitions";

export async function main(ns: NS) {
    let args: string[];
    try {
        args = ns.args as string[];
        if (args.length == 0) throw "no args";
    } catch {
        let argString = await ns.prompt(`Enter args separated by spaces:`, { type: "text"})
        args =  argString.toString().split(" ");
    }

    if (args.length == 0 || args[0].length == 0) {
        ns.tprint(`No init args supplied.`);
        return;
    }

    // stop everything first
    await runWait(ns, 'hak.stopall.js');

    // get access to everything in reach
    await runWait(ns, 'hak.access.js');

    // deploy libs
    await runWait(ns, 'hak.deploy.js', ['lib.serverbase.js']);

    // deploy the hacking scripts
    await runWait(ns, 'hak.deploy.js', args);

    // execute the newly deployed script
    run(ns, 'hak.run.js', args); 

    // start eco
    run(ns, 'eco.botnet.js');
}

async function runWait(ns: NS, file: string, args?: string[]) {
    let pid = run(ns, file, args);

    while (ns.isRunning(pid)) {
        await ns.sleep(100);
    }
}

function run(ns: NS, file: string, args?: string[]): number {
    let pid = 0;
    if (args != undefined) {
        ns.tprint(`Running ${file} with args ${args.join(" ")}. PID: ${pid}`);
        pid = ns.run(file, 1, ...args);
    } else {
        pid = ns.run(file, 1);
        ns.tprint(`Running ${file} with no args. PID: ${pid}`);
    }
    return pid;
}