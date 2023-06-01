import { NS } from '../NetscriptDefinitions'
import { Logger } from '/log/logger';

export async function main(ns: NS) {
    const targetHost = ns.args[0] as string;
    const delay = ns.args[1] as number
    let pLog: Logger = new Logger(ns);

    pLog.log(`INFO: Running weaken on ${targetHost} in ${delay}ms`);

    let reducedAmount = await ns.weaken(targetHost, {additionalMsec: delay});

    pLog.log(`INFO: -${reducedAmount} security from weaken on ${targetHost}`);
}
