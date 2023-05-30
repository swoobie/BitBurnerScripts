import { NS } from '../NetscriptDefinitions'
import { PortLog } from 'log/portLog';

export async function main(ns: NS) {
    const targetHost = ns.args[0] as string;
    const delay = ns.args[1] as number
    let pLog: PortLog = new PortLog(ns);

    pLog.log(`INFO: Grow in ${Math.trunc(delay / 1000)} seconds on ${targetHost}`);
    await ns.sleep(delay);
    let effectiveGrowthMultiplier = await ns.grow(targetHost);

    pLog.log(`INFO: ${effectiveGrowthMultiplier}x from grow on ${targetHost}`);
}