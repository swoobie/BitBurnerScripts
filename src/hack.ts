import { NS } from '../NetscriptDefinitions'
import { Logger } from '/log/logger';

export async function main(ns: NS) {
    const targetHost = ns.args[0] as string;
    const delay = ns.args[1] as number
    let pLog: Logger = new Logger(ns);

    pLog.log(`INFO: Running Hack on ${targetHost} in ${delay}ms`);
    let hackResult = await ns.hack(targetHost, {additionalMsec: delay});

    pLog.log(`INFO: $${hackResult} from hack on ${targetHost}`);
}