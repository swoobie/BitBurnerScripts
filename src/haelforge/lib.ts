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
        //ns.print(`Deploying '${f}' on '${target.hostname}`);
        target.deploy(f, `home`);
    });
}

export function formulasAvailable(ns: NS) {
    return ns.fileExists('Formulas.exe');
}

export function basicEco(ns: NS, servers: BasicServer[]) {
    const myServers = getPurchasedBasicServers(ns, servers);

    if (myServers.length < ns.getPurchasedServerLimit()) {
        const playerMoney = ns.getPlayer().money;
        const canAfford = playerMoney / 10 > ns.getPurchasedServerCost(8);
        const result = canAfford ? ns.purchaseServer(`haelforge-${myServers.length + 1}`, 8) : '';
        if (result !== '') {
            ns.print(`\u001b[35;1mEco> Bought a server: ${result}\u001b[0m`);
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
            ns.print(`\u001b[35;1mEco> Upgraded ${totalUpgrades} server${totalUpgrades > 1 ? 's' : ''} for $${ns.formatNumber(totalCost, 2)}\u001b[0m`);
        }
    }
}

export function availableThreadCounts(ns: NS, server: BasicServer): Map<string, number> {
    const files = ns.ls(ns.getHostname(), `haelforge/deploy/`);
    const map = new Map();
    files.forEach(f => map.set(f, Math.floor(server.freeRam() / ns.getScriptRam(f, server.hostname))))
    return map;
}

export function getPurchasedBasicServers(ns: NS, servers: BasicServer[]): BasicServer[] {
    return servers.filter(s => ns.getPurchasedServers().findIndex(val => val == s.hostname) != -1);
}

export function getPurchasedPwndServers(ns: NS, servers: PwndServer[]): PwndServer[] {
    return servers.filter(s => ns.getPurchasedServers().findIndex(val => val == s.hostname) != -1);
}

export const Colors = {
    black: "\u001b[30m",
    red: "\u001b[31m",
    green: "\u001b[32m",
    yellow: "\u001b[33m",
    blue: "\u001b[34m",
    magenta: "\u001b[35m",
    cyan: "\u001b[36m",
    white: "\u001b[37m",
    brightBlack: "\u001b[30;1m",
    brightRed: "\u001b[31;1m",
    brightGreen: "\u001b[32;1m",
    brightYellow: "\u001b[33;1m",
    brightBlue: "\u001b[34;1m",
    brightMagenta: "\u001b[35;1m",
    brightCyan: "\u001b[36;1m",
    brightWhite: "\u001b[37;1m",
    reset: "\u001b[0m"
};