import { NS } from '../../NetscriptDefinitions'
import { PortLog } from 'log/portLog'

export async function main(ns: NS) {
    let portLog: PortLog = new PortLog(ns);
    portLog.clear();

    while (true) {
        await portLog.listen();
    }
}