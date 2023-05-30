import { NS } from '../../NetscriptDefinitions'
export async function main(ns: NS) {


    const connects = connections(ns, ns.getHostname(), new Set());
    ns.tprint(`${ns.getHostname()} is connected to ${connects.size} hosts:`);

    let targets = Array.from(connects).filter(c => (
            c != ns.getHostname() &&
            c != `home` && 
            !c.includes(`auto`) &&
            !c.includes(`botnet`)
        ));
        
    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        let money = ns.getServerMoneyAvailable(target);
        let moneyRemains = money > 0;
        if (ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(target)) {
            while(moneyRemains) {
                let hackResult = await ns.hack(target);
                if (hackResult > 0) {
                    ns.tprint(`Hacked $${hackResult} from ${target}`);
                }
                moneyRemains = hackResult == 0;
            }
        }
    }
}

function connections(ns: NS, hostname: string, seenTargets: Set<string>): Set<string> {
    // end the recursion
    if (seenTargets.has(hostname)) {
        return seenTargets;
    }

    seenTargets.add(hostname);

    // get the remote connections
    const remotes: Array<string> = ns
        .scan(hostname)
        .filter(host => !seenTargets.has(host)); // skip ones we've seen

    remotes.forEach(r => {
        // we have remotes, so execute this again on the remote
        connections(ns, r, seenTargets);
    })

    return seenTargets;
}