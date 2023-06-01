import { NS } from '../../NetscriptDefinitions'
import { ConnectedServerList } from 'lib.util'
import { BasicServer } from 'model/basicServer';
import { PwndServer } from 'model/pwndServer';
import { Batcher, CommandType } from 'fractal/batcher';
import { Dispatcher } from 'fractal/dispatcher';
import { Logger } from 'log/logger';

export async function main(ns: NS) {
    ns.run(`log/startNetLogger.js`);

    let logger: Logger = new Logger(ns);

    let basicServers: BasicServer[] = Array.from(ConnectedServerList(ns)).map(c => new BasicServer(ns, c));
    let pwndServers: PwndServer[] = pwnServers(ns, basicServers);
    pwndServers.forEach(s => {
        s.deploy(Dispatcher.getScriptForCommandType(CommandType.GROW), `home`);
        s.deploy(Dispatcher.getScriptForCommandType(CommandType.HACK), `home`);
        s.deploy(Dispatcher.getScriptForCommandType(CommandType.WEAKEN), `home`);
        s.deploy(`log/portLog.js`, `home`);
    })
    let target = pwndServers.filter(p => p.hostname == `foodnstuff`)[0];
    let batcher = new Batcher(ns);
    let batch = await batcher.createPreparationBatch(target.hostname);
    let dispatcher = new Dispatcher(ns);

    
    let targetPrimed = false;
    while (!targetPrimed) {
        logger.log(`Publishing priming batch for ${target.hostname}`);
        await dispatcher.tryDispatch(pwndServers, batch);
        while (dispatcher.isBatchRunning(batch))
            await ns.sleep(1000);

        if (ns.getServerMoneyAvailable(target.hostname) > ns.getServerMaxMoney(target.hostname) - 1000 /* arbitrary value for balancing */) {
            targetPrimed = true;
        } else {
            logger.log(`Failed to prime ${target.hostname}. Retrying`);
            await ns.sleep(1000);
        }
    }


    let batchesDispatched = 0;
    while (true) {
        logger.log(`Creating hack batch...`);
        let hackBatch = await batcher.createHackingBatch(target.hostname);
        batchesDispatched++;
        await dispatcher.tryDispatch(pwndServers, hackBatch);
        logger.log(`Hack Batch #${batchesDispatched + 1} Dispatched.`);
        await ns.sleep(10000);
    }
}

function pwnServers(ns: NS, basicServers: BasicServer[]) {
    let pwndServers: PwndServer[] = [];
    basicServers.forEach(bs => {
        if (bs.rooted) {
            pwndServers.push(PwndServer.fromBasic(bs));
        } else {
            // Try and run all the exploits
            bs.runExploit(ns.brutessh);
            bs.runExploit(ns.ftpcrack);
            bs.runExploit(ns.relaysmtp);
            bs.runExploit(ns.httpworm);
            bs.runExploit(ns.sqlinject);

            if (bs.canBePwnd()) {
                ns.nuke(bs.hostname);
                pwndServers.push(PwndServer.fromBasic(bs));
            }            
        }
    });
    return pwndServers;
}