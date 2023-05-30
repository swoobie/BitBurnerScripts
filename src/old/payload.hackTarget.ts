import { NS } from '../../NetscriptDefinitions'
export async function main(ns: NS) {
    // Defines the "target server", which is the server
    // that we're going to hack. In this case, it's "n00dles"
    const target = ns.args[0] ? ns.args[0].toString() : "foodnstuff";

    // Defines how much money a server should have before we hack it
    const moneyThresh = ns.getServerMaxMoney(target) * 0.95;

    // Defines the maximum security level the target server can
    // have. If the target's security level is higher than this,
    // we'll weaken it before doing anything else
    const securityThresh = ns.getServerMinSecurityLevel(target) + 3;

    // Infinite loop that continuously hacks/grows/weakens the target server
    while(true) {
        if (ns.getServerSecurityLevel(target) > securityThresh) {
            // If the server's security level is above our threshold, weaken it
            await ns.weaken(target);
        } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
            // If the server's money is less than our threshold, grow it
            await ns.grow(target);
            await ns.weaken(target);
        } else {
            // Otherwise, hack it sometimes?
            if (Math.random() * 10 > 8)
            await ns.hack(target);
        }
    }
}