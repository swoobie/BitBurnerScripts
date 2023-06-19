
export class ScriptCommand {
    public id: number;
    public scriptName: string;
    public threads: number;
    public args?: string[];

    constructor(id: number, name: string, threads: number, args?: string[]) {
        this.id = id;
        this.scriptName = name;
        this.threads = threads;
        this.args = args;
    }
}