import { NS } from '../NetscriptDefinitions'
export async function main(ns: NS) {
let target = `foodnstuff`;
    let gTime = ns.getGrowTime(target);
    let hTime = ns.getHackTime(target);
    let wTime = ns.getWeakenTime(target);

    let min = Math.min(gTime, hTime, wTime);

    // ns.tprint(`The min is ${min}. G: ${gTime}, H: ${hTime}, W: ${wTime}`);

    ns.tprint(`1 hack takes as long as ${(gTime/hTime).toPrecision(2)} grows or ${wTime/hTime} weakens`);
}