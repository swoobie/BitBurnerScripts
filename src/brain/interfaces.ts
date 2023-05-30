import { ServerBase } from "lib.serverbase";

export interface Action {
    target: string,
    delay: {
        grow: number,
        hack: number,
        weaken: number
    },
    threads: {
        grow: number,
        hack: number,
        weaken: number
    }
}


export interface Defense {
    isRooted: boolean,
    isBackdoorInstalled: boolean,
    minDifficulty: number,
	minDifficultyDelta: number,
    currentDifficulty: number,
	hackTime: number,
	growTime: number,
	weakenTime: number,
    ports: PortMap
}

export interface PortMap {
	openCount: number,
	requiredCount: number,
	requiredAmountIsOpen: boolean,
	ftpPortOpen: boolean,
	httpPortOpen: boolean,
	smtpPortOpen: boolean,
	sqlPortOpen: boolean
}

export interface Ram {
	free: number,
	max: number,
	used: number,
	reserved?: number,
	requiredToHack: number,
	requiredToGrow: number,
	requiredToWeaken: number,
    allocatedHackRam: number,
    allocatedGrowRam: number,
    allocatedWeakenRam: number
}

export interface Money {
	isFull: boolean,
	max: number,
	available: number,
	growthRate: number,
	percentToFull: number	
}