import { NS, NetscriptPort } from "../../NetscriptDefinitions";

export class PortLog {
    loggingPort: number;
    ns: NS;
    listenMode: boolean;
    port: NetscriptPort;
    hostname: string;

    /**
     *
     */
    constructor(ns: NS, loggingPort: number = 20) {
       this.ns = ns;
       this.loggingPort = loggingPort; 
       this.listenMode = false;
       this.port = this.ns.getPortHandle(this.loggingPort);
       this.hostname = this.ns.getHostname();

    }

    log(message: string) {
        if(!this.ns.tryWritePort(this.loggingPort, `[${this.hostname}]=> ${message}`)) {
            this.ns.tail();
            this.ns.print(`ERROR: Unable to write to port!\nAttempted to send: "${message}"\n\nIs the port Full?\n'''\n${this.port.full()}\n'''\nOr maybe Empty?\n'''${this.port.empty()}\n'''`);
        }
    }

    async listen() {
        this.listenMode = true;
        this.ns.tail();

        while (this.listenMode) {
            await this.port.nextWrite();

            let msg: string = this.port.read().valueOf().toString();

            this.ns.print(msg);
        }
    }

    clear() {
        this.port.clear();
    }

    stop() {
        this.listenMode = false;
    }
}