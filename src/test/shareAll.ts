import { NS } from '../../NetscriptDefinitions'
import { BasicServer } from 'haelforge/model/basicServer';
import { PwndServer } from 'haelforge/model/pwndServer';
import { breachBasicServerList, copyDeployScriptsToPwndServer, formulasAvailable, getConnectedServers } from 'haelforge/lib';


export async function main(ns: NS) {
    
    const argsTarget: string = ns.args[0] as string ?? "foodnstuff";
    const canUseFormulas: boolean = formulasAvailable(ns);
    ns.disableLog('ALL');
    
    // loop

    // get available servers
    const basicServers: BasicServer[] = getConnectedServers(ns);

    // try to breach them all
    const pwndServers: PwndServer[] = breachBasicServerList(ns, basicServers);

    // deploy the files
    pwndServers.forEach(p => {
        p.deploy('test/share.js', 'home');
    });

    let runners = pwndServers.filter(p => {
        let freeRam = p.freeRam();
        let scriptRam = ns.getScriptRam('test/share.js', p.hostname);

        let threads = Math.floor((freeRam * 0.9) / scriptRam);
        if (threads > 0) {
            p.runScript('test/share.js', threads);
            return true;
        }
        return false;
    })
}