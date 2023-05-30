import { NS } from '../../NetscriptDefinitions'
import { ServerBase } from '../lib.serverbase'

// Get access to everything in reach with tools available
export async function main(ns: NS) {
    const startHost:string = ns.getHostname();
    stop(ns, startHost, new Set());
}

function stop(ns: NS, hostname: string, seenTargets: Set<string>): void {
    // end the recursion
    if (seenTargets.has(hostname)) {
        return;
    }
    seenTargets.add(hostname);

    const local: ServerBase = new ServerBase(ns, hostname);
    
    const runningScripts = ns.ps(local.id).map(p => p.filename);
    
    // kill scripts with exceptions
    runningScripts
        .filter(s => s != 'hak.stopall.js' && s != 'hak.init.js')
        .forEach(s => {
            ns.tprint(`Ending ${s} on ${local.id}`);
            ns.scriptKill(s, local.id);
        }); 

    // get the remote connections
    const remotes: Array<ServerBase> = ns
        .scan(local.id)
        .filter(host => !seenTargets.has(host)) // skip ones we've seen
        .map(host => new ServerBase(ns, host));

    remotes.forEach(r => {
        // repeat for each connected node
        stop(ns, r.id, seenTargets);
    });
}