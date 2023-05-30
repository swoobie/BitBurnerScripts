import { NS } from '../../NetscriptDefinitions'
import { ServerBase } from '../lib.serverbase';
export async function main(ns: NS) {
    if (ns.args[0] == undefined || ns.args.length == 0) {
        ns.tprint(`Failed to run 'undefined' scripts.`);
        return;
    }
    const fileToRun: string = ns.args[0].toString();
    const args: string[] = ns.args[1] ? ns.args.slice(1).map(a => a.toString()) : [];

    run(ns, fileToRun, args, ns.getHostname(), new Set());
}

function run(ns: NS, file: string, args: string[], hostname: string, seenTargets: Set<string>): Set<string> {
    // end the recursion
    if (seenTargets.has(hostname)) {
        return seenTargets;
    }

    const local: ServerBase = new ServerBase(ns, hostname);
    seenTargets.add(local.id);

    if (local.defense.isRooted && local.hasFile(file)) {
        const ramRequired = ns.getScriptRam(file, local.id);
        let threads = local.getMaxThreadCountForScript(file);
        ns.tprint(`${local.id} needs ${ramRequired}GB and has ${local.ram.free}/${local.ram.max}GB free. Setting threads to ${threads}.`)
        if (threads >= 1) {
            ns.exec(file, local.id, threads, ...args);
        }
    } else {
        ns.tprint(`Failed to run ${file} on ${local.id}.`);
    }

    // get the remote connections
    const remotes: Array<ServerBase> = ns
        .scan(local.id)
        .filter(host => !seenTargets.has(host)) // skip ones we've seen
        .map(host => new ServerBase(ns, host));

    remotes.forEach(r => {
        run(ns, file, args, r.id, seenTargets);
    })
    
    return seenTargets;
}

