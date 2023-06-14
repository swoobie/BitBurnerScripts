import { NS, Server } from '../../NetscriptDefinitions'
import { BasicServer } from 'haelforge/model/basicServer';
import { PwndServer } from 'haelforge/model/pwndServer';
import { basicEco, breachBasicServerList, copyDeployScriptsToPwndServer, formulasAvailable, getConnectedServers } from 'haelforge/lib';
import { ScriptCommandBatch } from './model/scriptCommandBatch';

export async function main(ns: NS) {
    const argsTarget: string = ns.args[0] as string ?? "foodnstuff";
    const canUseFormulas: boolean = formulasAvailable(ns);
    ns.disableLog('ALL');
    ns.tail();
    // loop
    let i = 0;
    do {
        // get available servers
        const basicServers: BasicServer[] = getConnectedServers(ns);

        // try to breach them all
        const pwndServers: PwndServer[] = breachBasicServerList(ns, basicServers);

        // deploy the files
        pwndServers.forEach(p => copyDeployScriptsToPwndServer(ns, p));

        // find a target
        const target = pwndServers.filter(p => p.hostname == argsTarget)[0];

        basicEco(ns, basicServers);
        
        i++;
        await ns.sleep(1000);

        // calculate end times and make sure batch ends after any current batches for the target
        // allocate the batch, aka find runners
        // run the batch on the runners
        // keep track of which targets have active batches and their end times
        // maybe a list of end times per host, similar to what's in script batch
    } while (i < 10); // TODO: figure out how long to repeat this for at some point
    
}

