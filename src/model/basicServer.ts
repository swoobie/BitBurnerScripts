import { NS } from "../../NetscriptDefinitions";

export class BasicServer {
    ns: NS;
    hostname: string;
    openedPorts: number;

    constructor(ns: NS, hostname: string) {
        this.ns = ns;
        this.hostname = hostname;

        if (!this.rooted) {
            this.openedPorts = 0;
        } else {
            this.openedPorts = this.ns.getServerNumPortsRequired(this.hostname);
        }
    }

    /**
     * Get the free ram for this server object
     * Cost 0.10 GB to run
     * @returns The free ram amount
     */
    freeRam() {
        return this.ns.getServerMaxRam(this.hostname) - this.ns.getServerUsedRam(this.hostname);
    }

    get rooted() {
        return this.ns.hasRootAccess(this.hostname);
    }

    /**
     * Runs all the exploits and updates number of known open ports
     */
    runExploit(exploitFunc: (hostname: string) => void) {
        try {
            exploitFunc(this.hostname);
            this.openedPorts++;
        } catch {}
    }

    canBePwnd() {
        return this.ns.getServerNumPortsRequired(this.hostname) <= this.openedPorts;
    }
}