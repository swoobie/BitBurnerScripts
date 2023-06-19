import { NS } from '../../NetscriptDefinitions'
import { BasicServer } from 'haelforge/model/basicServer';
import { PwndServer } from 'haelforge/model/pwndServer';
import { availableThreadCounts, basicEco, breachBasicServerList, copyDeployScriptsToPwndServer, formulasAvailable, getConnectedServers, getPurchasedBasicServers, getPurchasedPwndServers } from 'haelforge/lib';
import { Stage } from 'haelforge/model/stage';
import { upgradeHacknet } from 'haelforge/hacknet';

export async function main(ns: NS) {
    const argsTarget: string = ns.args[0] as string ?? "foodnstuff";
    const canUseFormulas: boolean = formulasAvailable(ns);
    let currentStage: Stage = Stage.INITIALIZE;
    let sleepTime = 100;

    ns.disableLog('ALL');
    ns.tail();
    // loop
    let hacknetMoneyLimit = 100;
    let targetPrimed = false;
    let queueTime = 0;
    let i = 0;

    let hackTime = 0, growTime = 0, weakenTime = 0, growThreads = 0, growSecurityAmount = 0, hackThreads = 0, hackSecurityAmount = 0, weakenThreads = 0, weakenGrowThreads = 0;

    do {
        ns.print(`Haelforge Run ${i+1}: Stage ${currentStage}`);

        /* stuff to run every time */

        // Discover and breach connected hosts
        const basicServers: BasicServer[] = getConnectedServers(ns);
        const pwndServers: PwndServer[] = breachBasicServerList(ns, basicServers);
        pwndServers.forEach(p => copyDeployScriptsToPwndServer(ns, p));

        // Do some scaling
        basicEco(ns, basicServers);

        // Hacknet
        // Increase the money limit every factor of 10 our money gets to from when the script started.
        // Alternatively, reduce it if we ever run lower on money than the current limit.
        if (ns.getPlayer().money > hacknetMoneyLimit * 100 || ns.getPlayer().money < hacknetMoneyLimit) {
            let prev = hacknetMoneyLimit;
            hacknetMoneyLimit = ns.getPlayer().money / 10;
            ns.print(`\u001b[35mHacknet> Adjusting max spending limit. Previous: $${ns.formatNumber(prev, 0)}. New Limit: $${ns.formatNumber(hacknetMoneyLimit, 0)}.\u001b[0m`);
        }
        const spentHacknetMoney = upgradeHacknet(ns, hacknetMoneyLimit, 21);
        ns.print(`\u001b[35mHacknet> Upgrade Spending: $${ns.formatNumber(spentHacknetMoney, 0)} of $${ns.formatNumber(hacknetMoneyLimit, 0)} spent.\u001b[0m`);

        // find a target
        const target = pwndServers.filter(p => p.hostname == argsTarget)[0];
        hackTime = ns.getHackTime(target.hostname);
        growTime = hackTime * 3.2; // constants used by the game
        weakenTime = hackTime * 4;

        /* stuff to run in stages */
        switch (currentStage as Stage) {
            case Stage.INITIALIZE:
                currentStage = formulasAvailable(ns) ? Stage.POST_FORMULAS : Stage.PRE_FORMULAS;

                getPurchasedPwndServers(ns, pwndServers).forEach(s => s.killDeployedScripts());
            break;
            case Stage.PRE_FORMULAS:
                // goal is to get to formulas asap
                try {
                    if (!targetPrimed) {
                        targetPrimed = await primeTarget(ns, target);

                        growThreads = Math.max(100, Math.ceil(ns.growthAnalyze(target.hostname, target.raw.moneyMax! * 2) / 2));
                        growSecurityAmount = ns.growthAnalyzeSecurity(growThreads, target.hostname);
                        hackThreads = Math.max(1, Math.ceil(ns.hackAnalyzeThreads(target.hostname, target.raw.moneyAvailable! / 2)));
                        hackSecurityAmount = ns.hackAnalyzeSecurity(hackThreads, target.hostname);

                        // weaken would be how much we grow security from hack and grow
                        weakenThreads = Math.max(1, Math.ceil((ns.getServerSecurityLevel(target.hostname) + hackSecurityAmount - ns.getServerMinSecurityLevel(target.hostname)) / 0.05));
                        weakenGrowThreads = Math.ceil((ns.getServerSecurityLevel(target.hostname) + growSecurityAmount - ns.getServerMinSecurityLevel(target.hostname)) / 0.05 )
                    } else {
                        const cyan = "\u001b[36m";
                        const reset = "\u001b[0m";

                        const offset = 10; // delay in ms between commands
                        // need to refactor this part to use the fleet runner func
                        const executionTime = Date.now() + 500;
                        executeOnRunners(ns, `haelforge/deploy/hack.js`, hackThreads, [target.hostname,         weakenTime - hackTime + executionTime])
                        executeOnRunners(ns, `haelforge/deploy/weaken.js`, weakenThreads, [target.hostname,     weakenTime + offset + executionTime])
                        executeOnRunners(ns, `haelforge/deploy/grow.js`, growThreads, [target.hostname,         weakenTime - growTime + offset * 2 + executionTime])
                        executeOnRunners(ns, `haelforge/deploy/weaken.js`, weakenGrowThreads, [target.hostname, weakenTime + offset * 3 + executionTime])

                        ns.print(`${cyan}Calculated thread counts are: ${hackThreads} Hack, ${growThreads} Grow, ${weakenThreads} Weaken. ETA: ${ns.formatNumber((weakenTime + offset * 3) / 1000, 0, 1000, true)} seconds.${reset}`);
                    }
                } catch {
                    ns.print(`Encountered an issue, might have run out of money or something. Re-priming.`)
                    targetPrimed = false;
                } 
            break;
            case Stage.POST_FORMULAS:
                // targetServer.moneyAvailable = 0;
                //  growThreads = ns.formulas.hacking.growThreads(targetServer, ns.getPlayer(), targetServer.moneyMax!);
                // const hackTime = ns.formulas.hacking.hackTime(targetServer, ns.getPlayer());
                // const growTime = hackTime * 3.2; // constants used by the game
                // const weakenTime = hackTime * 4;
            break;
            case Stage.TERMINATE:

            break;
        }

        i++;
        await ns.sleep(1000);
        if (i != i) {
            currentStage = Stage.TERMINATE;
        }

        // calculate end times and make sure batch ends after any current batches for the target
        // allocate the batch, aka find runners
        // run the batch on the runners
        // keep track of which targets have active batches and their end times
        // maybe a list of end times per host, similar to what's in script batch
    } while (currentStage != Stage.TERMINATE); // TODO: figure out how long to repeat this for at some point
    
}

async function primeTarget(ns: NS, target: PwndServer) {
    ns.print(`Priming [${target.hostname}]...`);
    const hackTime = ns.getHackTime(target.hostname);
    const weakenTime = hackTime * 4;
    const growTime = hackTime * 3.2;
    const runners = ns.getPurchasedServers().map(hostname => new PwndServer(ns, hostname));
    runners.push(new PwndServer(ns, 'home')); // include home for when we don't have a fleet

    if (target.shouldBeWeakened()) {
        const totalWeakenThreads = Math.ceil((ns.getServerSecurityLevel(target.hostname) - ns.getServerMinSecurityLevel(target.hostname)) / 0.05)
        executeOnRunners(ns, 'haelforge/deploy/weaken.js', totalWeakenThreads, [target.hostname, Date.now() + 1000]);
        ns.print(`Weakening. T-${(weakenTime / 1000).toFixed(2)}s`)
        await ns.sleep(weakenTime);
    } else if (target.shouldBeGrown()) {
        const totalGrowThreads = Math.ceil(ns.growthAnalyze(target.hostname, ns.getServerMaxMoney(target.hostname) / ns.getServerMoneyAvailable(target.hostname)));
        executeOnRunners(ns, 'haelforge/deploy/grow.js', totalGrowThreads, [target.hostname, Date.now() + 1000]);
        ns.print(`Growing. T-${(growTime / 1000).toFixed(2)}s`)
        await ns.sleep(growTime);
        const totalWeakenThreads = Math.ceil((ns.getServerSecurityLevel(target.hostname) - ns.getServerMinSecurityLevel(target.hostname)) / 0.05)
        executeOnRunners(ns, 'haelforge/deploy/weaken.js', totalWeakenThreads, [target.hostname, Date.now() + 1000]);
        ns.print(`Weakening. T-${(weakenTime / 1000).toFixed(2)}s`)
        await ns.sleep(weakenTime);
    }
    
    // shrug, we added an extra second to the priming runs so why not
    await ns.sleep(1000);

    const result = !target.shouldBeWeakened() && !target.shouldBeGrown()
    ns.print(`Priming ${result ? 'Successful': `Failed`}. Weakened: ${!target.shouldBeWeakened()} Grown: ${!target.shouldBeGrown()}`);
    return result;
}

function executeOnRunners(ns: NS, script: string, threads: number, args: (string | number)[]) {
    const runners = ns.getPurchasedServers().map(hostname => new PwndServer(ns, hostname));
    runners.push(new PwndServer(ns, 'home')); // include home for when we don't have a fleet

    let assignedThreads = 0;

    runners.forEach(r => {
        if (threads - assignedThreads > 0) {
            const availWeakenThreads = availableThreadCounts(ns, r).get('haelforge/deploy/weaken.js') ?? 0;
        
            const runnerThreads = Math.min(threads - assignedThreads, availWeakenThreads)
            assignedThreads += runnerThreads;

            if (runnerThreads > 0) {
                ns.exec(script, r.hostname, runnerThreads, ...args);
                
            }
        }
    })

    
    ns.print(`Running '${script}' with ${assignedThreads}/${threads} threads. Args: ${JSON.stringify(args)}`);
}