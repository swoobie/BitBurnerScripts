import { Action } from "brain/interfaces";
import { ServerBase } from "lib.serverbase";
import { NS } from "/../NetscriptDefinitions";


export class FleetActionController {
    private ns: NS;
    
    constructor(ns: NS) {
        this.ns = ns;
    }

    // Takes a list of servers and updates their allocated thread counts then returns the list
    runActions(fleet: ServerBase[], actions: Action[]) {
        
        this.ns.tprint(`${actions.length} actions to run and ${fleet.length} hosts to utilize.`);
        // if an action won't fit in the fleet, filter it out
        actions.forEach(action => {
            this.ns.tprint(`Running fleet action: ${JSON.stringify(action)}`);

            let remainingHackThreads = action.threads.hack;
            let remainingGrowThreads = action.threads.grow;
            let remainingWeakenThreads = action.threads.weaken;

            for (let i = 0; i < fleet.length; i++) {
                const s = fleet[i];

                let serverAction: Action = {
                    ...action,
                    threads: {
                        grow: 0,
                        hack: 0,
                        weaken: 0   
                    }
                }
                
                if (remainingHackThreads > 0) {
                    this.ns.tprint(`Allocating ${remainingHackThreads} hack threads`);
                    let allocated = s.requestHackThreads(remainingHackThreads);
                    if (allocated > 0) {
                        remainingHackThreads -= allocated;
                        serverAction.threads.hack = allocated;
                    }
                }

                if (remainingGrowThreads > 0) {
                    this.ns.tprint(`Allocating ${remainingGrowThreads} grow threads`);
                    let allocated = s.requestGrowThreads(remainingGrowThreads);
                    if (allocated > 0) {
                        remainingGrowThreads -= allocated;
                        serverAction.threads.grow = allocated;
                    }
                }
           
                if (remainingWeakenThreads > 0) {
                    this.ns.tprint(`Allocating ${remainingWeakenThreads} weaken threads`); 
                    let allocated = s.requestWeakenThreads(remainingWeakenThreads);
                    if (allocated > 0) {
                        remainingWeakenThreads -= allocated;
                        serverAction.threads.weaken = allocated;
                    }
                }
                
                this.ns.tprint(`Running server action on ${s.id}. ServerAction: ${JSON.stringify(serverAction)}`);

                if (serverAction.threads.hack > 0) {
                    this.ns.exec(`hack.js`, s.id, serverAction.threads.hack, serverAction.target, serverAction.delay.hack) 
                }
                
                if (serverAction.threads.grow > 0) {
                    this.ns.exec(`grow.js`, s.id, serverAction.threads.grow, serverAction.target, serverAction.delay.grow) 
                }
                 
                if (serverAction.threads.weaken > 0) {
                    this.ns.exec(`weaken.js`, s.id, serverAction.threads.weaken, serverAction.target, serverAction.delay.weaken) 
                }
                
                if (remainingGrowThreads + remainingHackThreads + remainingWeakenThreads == 0) {
                    this.ns.tprint(`Done with action. Next!`);
                    i = fleet.length;
                }
            }
        })
    }

}