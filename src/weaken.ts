import { NS } from '../NetscriptDefinitions'
import { PortLog } from 'log/portLog';

export async function main(ns: NS) {
    const targetHost = ns.args[0] as string;
    const delay = ns.args[1] as number
    let pLog: PortLog = new PortLog(ns);

    await ns.sleep(delay); 
    let reducedAmount = await ns.weaken(targetHost);

    pLog.log(`INFO: -${reducedAmount} security from weaken on ${targetHost}`);
}
