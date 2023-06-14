import { NS } from "../../NetscriptDefinitions";
import { BasicServer } from "haelforge/model/basicServer";
import { PwndServer } from "haelforge/model/pwndServer";

export function getConnectedServers(ns: NS, hostname?: string): BasicServer[] {
    const local = hostname ?? ns.getHostname();
    
    const populateVisitedHelper = (ns: NS, host: string, visited: Set<string> = new Set<string>()) => {
        if (visited.has(host)) {
            return visited;
        }
        visited.add(host);
        let servers = ns
            .scan(host)
            .filter(h => !visited.has(h));
    
        servers.forEach(s => {
            populateVisitedHelper(ns, s, visited);
        })

        return visited;
    }

    return Array.from(populateVisitedHelper(ns, local)).map(s => new BasicServer(ns, s));
}

export function breachBasicServerList(ns: NS, targets: BasicServer[]): PwndServer[] {
    return targets
        .filter(target => breachTargetBasicServer(ns, target))
        .map(PwndServer.fromBasic);
}

export function breachTargetBasicServer(ns: NS, target: BasicServer) {
    try   {
        // Try and run all the exploits
        target.runExploit(ns.brutessh);
        target.runExploit(ns.ftpcrack);
        target.runExploit(ns.relaysmtp);
        target.runExploit(ns.httpworm);
        target.runExploit(ns.sqlinject);
    } catch {}

    if (target.canBePwnd()) {
        ns.nuke(target.hostname);
    }

    return target.rooted;
}

export function copyDeployScriptsToPwndServer(ns: NS, target: PwndServer) {
    const files = ns.ls(ns.getHostname(), `haelforge/deploy/`);
    files.forEach(f => {
        // ns.print(`Deploying '${f}' on '${target.hostname}`);
        target.deploy(f, `home`);
    });
}

export function formulasAvailable(ns: NS) {
    return ns.fileExists('Formulas.exe');
}

export function basicEco(ns: NS, servers: BasicServer[]) {
    const myServers = servers.filter(s => ns.getPurchasedServers().findIndex(val => val == s.hostname) != -1)

    if (myServers.length < ns.getPurchasedServerLimit()) {
        const result = ns.purchaseServer(`haelforge-${myServers.length + 1}`, 16);
        if (result !== '') {
            ns.print(`Bought a server: ${result}`);
        }
    } else {
        let totalCost = 0;
        let totalUpgrades = 0;
        myServers.forEach(s => {
            const ram = ns.getServerMaxRam(s.hostname) * 2;
            const upgradeCost = ns.getPurchasedServerUpgradeCost(s.hostname, ram);
            const playerMoney = ns.getPlayer().money;
            if (playerMoney / 20 > upgradeCost) {
                if (ns.upgradePurchasedServer(s.hostname, ram)) {
                    totalCost += upgradeCost;
                    totalUpgrades++;
                }
            }
        })

        if (totalUpgrades > 0) {
            ns.print(`Upgraded ${totalUpgrades} hosts for $${totalCost}`);
        }
    }
}