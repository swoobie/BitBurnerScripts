import { NS } from '../../NetscriptDefinitions'
import { Logger } from '/log/logger'

export async function main(ns: NS) {

    if (ns.ps()
        .filter( pi => pi.filename == ns.getScriptName() && pi.pid != ns.pid)
        .length != 0)
        ns.exit();

    let portLog: Logger = new Logger(ns);
    portLog.clear();

    ns.disableLog(`sleep`);
    ns.tail();
    
    while (true) {
        let log = portLog.read();
        if (log.valueOf().toString().length != 0) {
            ns.print(log.valueOf());
        }
        await ns.sleep(100);
    }
}