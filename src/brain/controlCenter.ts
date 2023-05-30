

// starts up the netscript ports and sets up the main state machine
import { NS } from '../../NetscriptDefinitions';
import { ConnectedServerList } from 'lib.util';
import { ServerBase } from 'lib.serverbase';
import { FleetActionController } from 'brain/fleetActionController';
import { Action } from 'brain/interfaces';

export class ControlCenter {
    private readonly ns: NS;

    running: boolean = false;
    fleetActionController: FleetActionController;
    //remoteServers: ServerBase[] = [];

    constructor(ns: NS) {
        this.ns = ns;
        this.fleetActionController = new FleetActionController(ns);
    }

    get remoteServers(): ServerBase[] { return Array.from(ConnectedServerList(this.ns, `home`)).map(h => new ServerBase(this.ns, h)); };
   
    async start() {
        this.running = true;
        
        await this.hum();
    }

    stop() {
        this.running = false;

        // cleanup commands for deployed scripts
    }

    private async hum() {
        while (this.running) {

            // figure out who can run the hacks
            this.ns.tprint(`Gathering peasants`);
            let peasants = this.getUsableServers();
           
            // get the hack targets, yeah they come from the peasants too
            this.ns.tprint(`Finding the wealthy`);
            let hackTargets = this.getHackableServers(peasants);

            this.ns.tprint(`${hackTargets.length} wealthy wizards located`);
            // sort the hack targets by priority

            // assign hack targets to the peasants
            this.ns.tprint(`Spreading joy`)
            this.divideTheLabor(peasants, hackTargets);

            this.raiseTheChildren(peasants);

            // wait x minutes and re-evaluate for now
            this.ns.tprint(`Taking a breather`)
            await this.ns.sleep(1000 * 60 * 5);
            
            peasants.forEach(c => {
                this.ns.killall(c.id, true);
            })
        }
    }

    // always current when called
    private getUsableServers(): ServerBase[] {
        // only target rooted, accessible remotes
        return this.remoteServers.filter(s => s.defense.isRooted);
                
    }

    private getHackableServers(availableServers: ServerBase[]): ServerBase[] {
        return availableServers
            .filter(s => s.defense.isRooted)
            .filter(s => !s.purchasedByPlayer)
            .filter(s => s.money.percentToFull > 50);
    }

    private raiseTheChildren(peasants: ServerBase[]) {
        
        let actions: Action[] = peasants.filter(s => s.defense.isRooted && !s.purchasedByPlayer && !isNaN(s.money.percentToFull)).map(s => {
        // calculate hack weaken grow weaken delays
            const growTime = s.defense.growTime;
            const weakenTime = s.defense.weakenTime;

            const maxTime = Math.max(growTime, weakenTime);

            const growDelay = maxTime - growTime;
            const weakenDelay = maxTime - weakenTime;

            // calculate number of threads needed
            this.ns.tprint(`Kid ${s.id} has ${s.money.percentToFull}% full money.`)
            
            // just ball parking a thread count if we're completely empty
            const threadsNeededToGrow = !s.money.percentToFull ? 100 : Math.ceil(this.ns.growthAnalyze(s.id, 100 / s.money.percentToFull));

            // ns.weaken always decreases security by 0.05
            // https://github.com/bitburner-official/bitburner-src/blob/dev/markdown/bitburner.ns.weaken.md
            const weakenAmount = 0.05;
            const threadsNeededToWeaken = Math.ceil(s.defense.minDifficultyDelta / weakenAmount);
            
            return {
                target: s.id,
                delay: {
                    grow: growDelay,
                    hack: 0,
                    weaken: weakenDelay
                },
                threads: {
                    grow: threadsNeededToGrow,
                    hack: 0,
                    weaken: threadsNeededToWeaken
                }
            } as Action;
        })

        this.fleetActionController.runActions(peasants, actions);
    }

    private divideTheLabor(peasants: ServerBase[], hackTargets: ServerBase[]) {
        //TODO: need to loop over all the servers and initialize them 
        // by copying required scripts if missing and stopping any other scripts

        let actions: Action[] = hackTargets.map(t => {
        // calculate hack weaken grow weaken delays
            const growTime = t.defense.growTime;
            const hackTime = t.defense.hackTime;
            const weakenTime = t.defense.weakenTime;

            const maxTime = Math.max(growTime, hackTime, weakenTime);

            const growDelay = maxTime - growTime;
            const hackDelay = maxTime - hackTime;
            const weakenDelay = maxTime - weakenTime;

            // calculate number of threads needed
            const halfMoney = t.money.available / 2;
            const threadsNeededToHack = Math.floor(this.ns.hackAnalyzeThreads(t.id, halfMoney));
            const threadsNeededToGrow = Math.ceil(this.ns.growthAnalyze(t.id, 2)); // double the money

            // ns.weaken always decreases security by 0.05
            // https://github.com/bitburner-official/bitburner-src/blob/dev/markdown/bitburner.ns.weaken.md
            const weakenAmount = 0.05;
            const threadsNeededToWeaken = Math.ceil(t.defense.minDifficultyDelta / weakenAmount);
            
            return {
                target: t.id,
                delay: {
                    grow: growDelay,
                    hack: hackDelay,
                    weaken: weakenDelay
                },
                threads: {
                    grow: threadsNeededToGrow,
                    hack: threadsNeededToHack,
                    weaken: threadsNeededToWeaken
                }
            } as Action
        })

        // just need to divide up the threads
        // cause now we know each target's requirements to loop fast hacks
        this.fleetActionController.runActions(peasants, actions);
    }

}


export async function main(ns: NS) {
   
    let controlCenter = new ControlCenter(ns);

    await controlCenter.start();

}


