import { NS } from '../NetscriptDefinitions'
import { ServerBase } from './lib.serverbase'

export async function main(ns: NS) {
    ns.tprint(`Starting botnet eco.`);
    const local = new ServerBase(ns, `home`);
    let servers = ns.scan(`home`).map(h => new ServerBase(ns, h)).filter(s => s.purchasedByPlayer);
    let index: number = servers.length == 0 ? 0 : parseInt(servers.map(s => s.id.split('-')[1]).sort((a, b) => parseInt(b) - parseInt(a))[0]);
    
    let startingServerRamPower = 4;
    let maxedOut = false;

    do {
        if (servers.length < 25) {
            // purchase a server
            if (canAfford(ns, ns.getPurchasedServerCost(powerToRam(startingServerRamPower)))) {
                
                let name = ns.purchaseServer(`botnet-${index++}`, powerToRam(startingServerRamPower));
                
                ns.tprint(`Bought new server: ${name}`);
            }

        } else {
            // sort the servers by memory and get the lowest one
            servers = ns.scan(`home`).map(h => new ServerBase(ns, h)).filter(s => s.purchasedByPlayer);
            const upgradeTarget = servers.sort((a, b) => a.ram.max - b.ram.max)[0]

            // max power is 20 supposedly, and it's expensive so just cap it lower
            if (upgradeTarget.ram.max == powerToRam(17)) {
                maxedOut = true;
            }

            let upgradeCost = ns.getPurchasedServerUpgradeCost(upgradeTarget.id, upgradeTarget.ram.max * 2);
            if (canAfford(ns, upgradeCost)) {
                ns.tprint(`Upgrading server ${upgradeTarget.id} to ${upgradeTarget.ram.max * 2}GB for $${upgradeCost}`);
                ns.upgradePurchasedServer(upgradeTarget.id, upgradeTarget.ram.max * 2);
            }
        }
        await ns.sleep(500);
    } while (!maxedOut)
}

function powerToRam(power: number): number {
    return Math.pow(2, power);
}

function canAfford(ns: NS, value: number) {
    return ns.getPlayer().money > value * 4; // never spend more than 25%
}