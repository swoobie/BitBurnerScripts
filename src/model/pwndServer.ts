import { BasicServer } from "model/basicServer";
import { NS, ProcessInfo } from "../../NetscriptDefinitions";

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
            this.ns.tprint(`Deployed '${scriptName}' on '${this.hostname}'`);
        }
    }

    get deployedScripts () { return this.localScripts }

    runScript(scriptName: string, threads: number, args?: string[]) {
        this.ns.exec(scriptName, this.hostname, threads, ...(args ?? []))
    }

    killDeployedScripts() {
        let running: ProcessInfo[] = this.ns.ps(this.hostname);
        this.ns.print(`${running.length} processes on ${this.hostname}`);
        running.filter(p => {
            this.localScripts.includes(p.filename)
        }).map(p => {
            let result = this.ns.kill(p.filename, this.hostname);
            
            this.ns.print(`${result ? `SUCCESS: Killed` : `WARN: Failed to kill`} script ${p.filename} on ${this.hostname}`);
        });
    }
}