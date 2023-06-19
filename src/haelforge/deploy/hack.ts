import { NS } from '../../../NetscriptDefinitions'
export async function main(ns: NS) {
    const target = ns.args[0] as string;
    const executionTime = Number.parseInt(ns.args[1] as string);
    const delay = executionTime - Date.now();
    if ( delay > 0)
        await ns.hack(target, {additionalMsec: delay});
}