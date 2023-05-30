import { NS } from '../../NetscriptDefinitions'
import { ConnectedServerList } from 'lib.util'
import { BasicServer } from 'model/basicServer';
import { PwndServer } from 'model/pwndServer';
import { Batcher, CommandType } from 'fractal/batcher';
import { Dispatcher } from 'fractal/dispatcher';
import { PortLog } from '/log/portLog';

export async function main(ns: NS) {
    ns.run(`log/startNetLogger.js`);

    let logger: PortLog = new PortLog(ns);

    ns.tail();
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
    let batch = batcher.createPreparationBatch(target.hostname);
    let dispatcher = new Dispatcher(ns);

    let dispatchResult = dispatcher.tryDispatch(pwndServers, batch);
    logger.log(`Dispatch Result for prep: ${dispatchResult}`);

    

    logger.log(`waiting a second before dispatching hack batch`);
    
    
    await ns.sleep(1000);
    let hackBatch = batcher.createHackingBatch(target.hostname);
    let hackResult = dispatcher.tryDispatch(pwndServers, hackBatch);
    logger.log(`Hack Batch Dispatched: ${hackResult}`);


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