import { ScriptCommand } from "haelforge/model/scriptCommand";


export class ScriptCommandBatch {
    public scripts: ScriptCommand[];

    /** 
     * Amount of time in-between running the scripts for this batch
     */
    private executionDelay: number;

    constructor(executionDelay: number = 50) {
        this.scripts = [];
        this.executionDelay = executionDelay;
    }

    public addScript(scriptName: string, threads: number, args?: string[]) {

        this.scripts.push(new ScriptCommand(this.scripts.length, scriptName, threads, args))
        

    }

    public get batchDuration(): number {
        let duration = 0;
        this.scripts.forEach(s => {
            
        })
        return duration;
    }
}
