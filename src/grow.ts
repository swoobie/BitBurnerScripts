import { NS } from '../NetscriptDefinitions'
import { Logger } from '/log/logger';

export async function main(ns: NS) {
    const targetHost = ns.args[0] as string;
    const delay = ns.args[1] as number
    let pLog: Logger = new Logger(ns);

    pLog.log(`INFO: Running Grow on ${targetHost}in ${Math.trunc(delay / 1000)} seconds`);

    let effectiveGrowthMultiplier = await ns.grow(targetHost, {additionalMsec: delay});

    pLog.log(`INFO: ${effectiveGrowthMultiplier}x from grow on ${targetHost}`);
}