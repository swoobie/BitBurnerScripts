import { NS } from '../../NetscriptDefinitions'
import { ServerBase } from '../lib.serverbase'

// Get access to everything in reach with tools available
export async function main(ns: NS) {
    const startHost: string = ns.getHostname();
    let result = accessTarget(ns, startHost, new Set(), { successCount: 0, attemptCount: 0});
    ns.tprint(`Tried gaining access to ${result.attemptCount} targets. Succeeded on ${result.successCount} targets.`);
}

interface AccessResult {
    successCount: number,
    attemptCount: number
}

function accessTarget(ns: NS, hostname: string, seenTargets: Set<string>, result: AccessResult): AccessResult {
    // end the recursion
    if (seenTargets.has(hostname)) {
        return result;
    }
    seenTargets.add(hostname);

    const local: ServerBase = new ServerBase(ns, hostname);

    // get the remote connections
    const remotes: Array<ServerBase> = ns
        .scan(local.id)
        .filter(host => !seenTargets.has(host)) // skip ones we've seen
        .map(host => new ServerBase(ns, host));
    
    remotes.forEach(r => {
        result.attemptCount++;
        if (r.defense.ports.requiredAmountIsOpen) {
            ns.nuke(r.id);
        } else {
            try {
                // open ports
                ns.brutessh(r.id);
                ns.ftpcrack(r.id);
                ns.httpworm(r.id);
                ns.relaysmtp(r.id);
            } catch {}
            try {
                // nuke
                ns.nuke(r.id); 
            } catch {}
        }

        if (ns.hasRootAccess(r.id)) {
            result.successCount++;
        }

        // repeat for each connected node
        accessTarget(ns, r.id, seenTargets, result);
    });

    return result;
}