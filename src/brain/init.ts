import { NS } from '../../NetscriptDefinitions'
import { ConnectedServerList } from '/lib.util'
export async function main(ns: NS) {
    let connections = ConnectedServerList(ns);

    // how do we prepare these for our botnet?

    // try to breach their defenses
    let breachedConnections = breach(ns, connections);
    
    // copy the script over to successfull breaches
    deploy(ns, breachedConnections);

    // kill all scripts
    stopAllScripts(ns, breachedConnections);

}

function breach(ns: NS, connections: Set<string>) {
    let breached = new Set<string>();
    connections.forEach(c => {
        let portsOpened = 0;
        if (!ns.hasRootAccess(c)) {
            try {
                ns.brutessh(c);
                portsOpened++;
                ns.ftpcrack(c);
                portsOpened++;
                ns.relaysmtp(c);
                portsOpened++;
                ns.httpworm(c);
                portsOpened++;
                ns.sqlinject(c);
                portsOpened++;
            } catch {}
    
            if (ns.getServerNumPortsRequired(c) <= portsOpened)
                ns.nuke(c);
            
            if (ns.hasRootAccess(c))
                breached.add(c);

        } else {
            breached.add(c);
        }
    })
    return breached;
}

function deploy(ns: NS, deployTargets: Set<string>) {
    deployTargets.forEach(t => {
        ns.scp([
            `hack.js`,
            `grow.js`,
            `weaken.js`
        ], t);
    })
}

function stopAllScripts(ns: NS, connections: Set<string>) {
    connections.forEach(c => {
        ns.killall(c, true);
    })
}