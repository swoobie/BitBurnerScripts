import { NS } from '../../../NetscriptDefinitions'
export async function main(ns: NS) {
    const target = ns.args[0] as string;
    const delay = Number.parseInt(ns.args[1] as string);
    await ns.hack(target, {additionalMsec: delay});
}