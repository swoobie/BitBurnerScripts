import { NS, Player } from "../NetscriptDefinitions";
import { PwndServer } from "./model/pwndServer";

export function ConnectedServerList(ns: NS, hostname?: string): Set<string> {
    let local = hostname ?? ns.getHostname();
    
    const populateVisitedHelper = (ns: NS, host: string, visited: Set<string> = new Set<string>()) => {
        if (visited.has(host)) {
            return visited;
        }

        visited.add(host);
        ns.print(`Visited ${host} Total: ${visited.size}`);
    
        let servers = ns
            .scan(host)
            .filter(h => !visited.has(h));
    
        servers.forEach(s => {
            populateVisitedHelper(ns, s, visited);
        })

        return visited;
    }

    return populateVisitedHelper(ns, local);
}

export function findOptimalTarget(ns: NS, player: Player, pwndServers: PwndServer[]) {
    let canUseFormulas = ns.fileExists(`Formulas.exe`);

    if (canUseFormulas) {
        // ns.formulas.hacking.growThreads
    }
}