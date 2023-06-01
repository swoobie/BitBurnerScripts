import { NS, NetscriptPort } from "../../NetscriptDefinitions";

export class Logger {
    loggingPort: number;
    ns: NS;
    listenMode: boolean;
    port: NetscriptPort;
    hostname: string;
    date: Date;

    /**
     *
     */
    constructor(ns: NS, loggingPort: number = 20) {
        this.ns = ns;
        this.loggingPort = loggingPort; 
        this.listenMode = false;
        this.port = this.ns.getPortHandle(this.loggingPort);
        this.hostname = this.ns.getHostname();
        this.date = new Date();
        ns.atExit(() => {
            ns.closeTail();
        })
    }

    log(message: string) {
        this.date = new Date();
        let timestamp = `${this.date.getHours()}:${this.date.getMinutes()}::${this.date.getSeconds()}::${this.date.getMilliseconds()}`;
        this.ns.print(`[${timestamp}] :: ${message}`);
        let attempts = 3;
        
        while(!this.ns.tryWritePort(this.loggingPort, `[${this.hostname}: ${timestamp}]=> ${message}`) && attempts > 0) {
            this.ns.print(`ERROR: Unable to write to port!\nAttempted to send: "${message}"\nIs the port Full?\n${this.port.full()}\nOr maybe Empty?\n${this.port.empty()}\nWill make ${attempts} more attempts.`);
            attempts--;
        }
    }

    read() {
        let data = this.port.read();
        if (data != `NULL PORT DATA`) {
            return data;
        } else return "";
    }

    clear() {
        this.port.clear();
    }
}