import { NS } from '../../NetscriptDefinitions'
import { ServerBase } from '../lib.serverbase';
export async function main(ns: NS) {
    if (ns.args[0] == undefined) {
        ns.tprint(`Failed to deploy 'undefined' script.`);
        return;
    }
    const fileToDeploy: string = ns.args[0].toString();
    
    if (!ns.fileExists(fileToDeploy)) {
        ns.tprint(`Failed to deploy file: ${fileToDeploy}`);
        return;
    }

    const deployCount = deployToReachableTargets(ns, fileToDeploy, ns.getHostname(), new Set(), 0);
    ns.tprint(`Deployed ${fileToDeploy} to ${deployCount} hosts.`);
}

function deployToReachableTargets(ns: NS, file: string, hostname: string, seenTargets: Set<string>, deployCount: number): number {
    // end the recursion
    if (seenTargets.has(hostname)) {
        return deployCount;
    }
    seenTargets.add(hostname);

    const local: ServerBase = new ServerBase(ns, hostname);

    // get the remote connections
    const remotes: Array<ServerBase> = ns
        .scan(local.id)
        .filter(host => !seenTargets.has(host)) // skip ones we've seen
        .map(host => new ServerBase(ns, host));

    remotes.forEach(r => {
        if (true) {
            ns.scp(file, r.id, local.id);
            deployCount++;
            // repeat for each connected node
            deployToReachableTargets(ns, file, r.id, seenTargets, 0);
        }
    });

    return deployCount;
}