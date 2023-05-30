import { NS, Server } from "../NetscriptDefinitions";
import { Money, Defense, Ram } from "brain/interfaces";

export class ServerBase
{
	private readonly HACK_SCRIPT_NAME: string = 'hack.js';
	private readonly GROW_SCRIPT_NAME: string = 'grow.js';
	private readonly WEAKEN_SCRIPT_NAME: string = 'weaken.js';
	private readonly MAX_RESERVED_RAM: number = 32;
	private ns: NS;
    private hostname: string;
	private allocatedHackThreadCount: number;
	private allocatedGrowThreadCount: number;
	private allocatedWeakenThreadCount: number;
	private _rawData: Server;

	constructor(ns: NS, hostname: string) {
		this.ns = ns;
		this.hostname = hostname;
		this.allocatedHackThreadCount = 0;
		this.allocatedGrowThreadCount = 0;
		this.allocatedWeakenThreadCount = 0;
		this._rawData = this.ns.getServer(hostname);
	}

	get id(): string { return this.hostname }
	get rawData(): Server { return this._rawData }
	get purchasedByPlayer(): boolean { return this.rawData.purchasedByPlayer }
	get isHome(): boolean { return this.rawData.hostname == 'home' }
	get money(): Money {
		return {
			isFull: this.rawData.moneyAvailable == this.rawData.moneyMax && this.rawData.moneyAvailable != undefined,
			max: this.rawData.moneyMax ?? 0,
			available: this.rawData.moneyAvailable ?? 0,
			growthRate: this.rawData.serverGrowth ?? 0,
			percentToFull: (this.rawData.moneyAvailable ?? 0) / (this.rawData.moneyMax ?? 1 ) * 100
		}
	}
	get defense(): Defense { 
		return {
			isRooted: this.rawData.hasAdminRights,
			isBackdoorInstalled: this.rawData.backdoorInstalled ?? false,
			minDifficulty: this.rawData.minDifficulty ?? 0,
			minDifficultyDelta: (this.rawData.hackDifficulty ?? 0) - (this.rawData.minDifficulty ?? 0),
			currentDifficulty: this.rawData.hackDifficulty ?? 0,
			hackTime: this.ns.getHackTime(this.id),
			growTime: this.ns.getGrowTime(this.id),
			weakenTime: this.ns.getWeakenTime(this.id),
			ports: {
				openCount: this.rawData.openPortCount ?? 0,
				requiredCount: this.rawData.numOpenPortsRequired ?? 99,
				requiredAmountIsOpen: (
					this.rawData.openPortCount != undefined && 
					this.rawData.numOpenPortsRequired != undefined &&
					this.rawData.openPortCount >= this.rawData.numOpenPortsRequired
					),
				ftpPortOpen: this.rawData.ftpPortOpen,
				httpPortOpen: this.rawData.httpPortOpen,
				smtpPortOpen:	this.rawData.smtpPortOpen,
				sqlPortOpen: this.rawData.sshPortOpen
			}
		}
	}
	get ram(): Ram { 
		return {
			max: this.rawData.maxRam,
			used: this.rawData.ramUsed + 
				this.allocatedHackThreadCount * this.ns.getScriptRam(this.HACK_SCRIPT_NAME, this.id) +
				this.allocatedGrowThreadCount * this.ns.getScriptRam(this.GROW_SCRIPT_NAME, this.id) +
				this.allocatedWeakenThreadCount * this.ns.getScriptRam(this.WEAKEN_SCRIPT_NAME, this.id), 
			free: this.id == `home` ? 
				Math.max(0, this.rawData.maxRam - this.calculateReservedRam(this.MAX_RESERVED_RAM)) - 
				(this.rawData.ramUsed + 
					this.allocatedHackThreadCount * this.ns.getScriptRam(this.HACK_SCRIPT_NAME, this.id) +
					this.allocatedGrowThreadCount * this.ns.getScriptRam(this.GROW_SCRIPT_NAME, this.id) +
					this.allocatedWeakenThreadCount * this.ns.getScriptRam(this.WEAKEN_SCRIPT_NAME, this.id))
				: this.rawData.maxRam - (this.rawData.ramUsed + 
					this.allocatedHackThreadCount * this.ns.getScriptRam(this.HACK_SCRIPT_NAME, this.id) +
					this.allocatedGrowThreadCount * this.ns.getScriptRam(this.GROW_SCRIPT_NAME, this.id) +
					this.allocatedWeakenThreadCount * this.ns.getScriptRam(this.WEAKEN_SCRIPT_NAME, this.id)),
			reserved: this.calculateReservedRam(this.MAX_RESERVED_RAM),
			requiredToHack: this.ns.getScriptRam(this.HACK_SCRIPT_NAME, this.id),
			requiredToGrow: this.ns.getScriptRam(this.GROW_SCRIPT_NAME, this.id),
			requiredToWeaken: this.ns.getScriptRam(this.WEAKEN_SCRIPT_NAME, this.id),
			allocatedHackRam: this.allocatedHackThreadCount * this.ns.getScriptRam(this.HACK_SCRIPT_NAME, this.id),
			allocatedGrowRam: this.allocatedGrowThreadCount * this.ns.getScriptRam(this.GROW_SCRIPT_NAME, this.id),
			allocatedWeakenRam:this.allocatedWeakenThreadCount * this.ns.getScriptRam(this.WEAKEN_SCRIPT_NAME, this.id), 
			
		}
	}

	// set aside hack threads if available, returns the amount allocated
	public requestHackThreads(threadCount: number): number {
		let available = this.getMaxAvailableThreadCountForRamCost(this.ram.requiredToHack);
		let difference = available - threadCount;
		// if we would go over the available thread count, set to max
		if (difference <= 0) {
			this.allocatedHackThreadCount = available
			return threadCount + difference;
		} else {
			// the request is less than what's available
			this.allocatedHackThreadCount += threadCount;
			return threadCount;
		}
	}

	// set aside hack threads if available, returns the amount allocated
	public requestGrowThreads(threadCount: number): number {
		let available = this.getMaxAvailableThreadCountForRamCost(this.ram.requiredToGrow);
		let difference = available - threadCount;
		// if we would go over the available thread count, set to max
		if (difference <= 0) {
			this.allocatedGrowThreadCount = available
			return threadCount + difference;
		} else {
			// the request is less than what's available
			this.allocatedGrowThreadCount += threadCount;
			return threadCount;
		}
	}

	// set aside hack threads if available, returns the amount allocated
	public requestWeakenThreads(threadCount: number): number {
		let available = this.getMaxAvailableThreadCountForRamCost(this.ram.requiredToWeaken);
		let difference = available - threadCount;
		// if we would go over the available thread count, set to max
		if (difference <= 0) {
			this.allocatedWeakenThreadCount = available
			return threadCount + difference;
		} else {
			// the request is less than what's available
			this.allocatedWeakenThreadCount += threadCount;
			return threadCount;
		}
	}

	private calculateReservedRam(reserveMax: number): number {
		return Math.max(this.rawData.maxRam * 0.2, reserveMax);
	}

	getMaxThreadCountForScript(scriptname: string) {
		let scriptRam = this.ns.getScriptRam(scriptname);

		return Math.floor(this.ram.free / scriptRam);
	}

	getMaxAvailableThreadCountForRamCost(ram: number): number {
		return Math.floor(this.ram.free / ram);
	}

	hasFile(filename: string): boolean {
		return this.ns.fileExists(filename, this.id);
	}

}