import { BasicServer } from "haelforge/model/basicServer";
import { NS, ProcessInfo } from "../../../NetscriptDefinitions";

export class PwndServer extends BasicServer {
    private localScripts: string[] = [];
    
    constructor(ns: NS, hostname: string) {
        super(ns, hostname);
    }

    static fromBasic(basicServer: BasicServer) {
        return new PwndServer(basicServer.ns, basicServer.hostname);
    }

    /**
     * Uploads a script to this server
     * @param scriptName Name of the script to deploy
     * @param sourceHost Location of script
     */
    deploy(scriptName: string, sourceHost: string) {
        if (this.ns.scp(scriptName, this.hostname, sourceHost)) {
            this.localScripts.push(scriptName);
        }
    }

    get deployedScripts () { return this.localScripts }

    get raw () { return this.ns.getServer(this.hostname) }

    runScript(scriptName: string, threads: number, args?: string[]) {
        this.ns.exec(scriptName, this.hostname, threads, ...(args ?? []))
    }

    shouldBeWeakened(): boolean {
        return (this.ns.getServerSecurityLevel(this.hostname) - this.ns.getServerMinSecurityLevel(this.hostname)) >=  5;
    }

    shouldBeGrown() {
        return this.ns.getServerMoneyAvailable(this.hostname) / this.ns.getServerMaxMoney(this.hostname) < 0.90
    }

    killDeployedScripts() {
        let running: ProcessInfo[] = this.ns.ps(this.hostname);
        running.filter(p => {
            this.localScripts.includes(p.filename)
        }).map(p => {
            let result = this.ns.kill(p.filename, this.hostname);
        });
    }
}