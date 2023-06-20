import { NS, NodeStats } from "../../NetscriptDefinitions";


export class HacknetBot {

    private previousTime: number = 0;
    private availableMoney: number = 0;

    /**
     * Upgrades the hacknet using only the spare amount of money generated from hacknet
     * @param ns Whatever NS is
     */
    upgradeHacknet(ns: NS) {
        const now = Date.now();
        const previousDuration = now - this.previousTime;
        this.previousTime = now;

        let hacknetProductionAmount = 0;
        for (let i = 0; i < ns.hacknet.numNodes(); i++) {
            hacknetProductionAmount += ns.hacknet.getNodeStats(i).production;
        }
        

        let amountEarnedSinceLastRun = hacknetProductionAmount * previousDuration; // It's $/sec * seconds elapsed
        this.availableMoney += amountEarnedSinceLastRun

        let remainder = this.availableMoney;
        if (ns.hacknet.numNodes() < ns.hacknet.maxNumNodes()) {
            remainder -= this.buyNode(ns);
        }

        remainder -= this.upgradeNode(ns);

        return this.availableMoney - remainder; // amount spent
    }


    buyNode(ns: NS): number {
        const nodePurchaseCost = ns.hacknet.getPurchaseNodeCost();

        if (ns.hacknet.purchaseNode() > 0) {
            this.availableMoney -= nodePurchaseCost;
            return nodePurchaseCost + this.buyNode(ns);
        } else {
            return 0;
        }
    }

    upgradeNode(ns: NS): number {
        const numNodes = ns.hacknet.numNodes();
        let upgradeTargetIndex = 0;

        if (numNodes == 0) return 0;

        // loop through and take the lowest sum of stats as the target to increase
        for (let i = 0; i < numNodes; i++) {
            const currentNodeStats = ns.hacknet.getNodeStats(i);
            const targetNodeStats = ns.hacknet.getNodeStats(upgradeTargetIndex);
            if (this.sumStats(currentNodeStats) < this.sumStats(targetNodeStats)) {
                upgradeTargetIndex = i;
            }
        }

        const levelUpgradeCost = ns.hacknet.getLevelUpgradeCost(upgradeTargetIndex, 1);
        const ramUpgradeCost = ns.hacknet.getRamUpgradeCost(upgradeTargetIndex, 1);
        const coreUpgradeCost = ns.hacknet.getCoreUpgradeCost(upgradeTargetIndex, 1);

        const cheapestCost = Math.min(levelUpgradeCost, ramUpgradeCost, coreUpgradeCost);

        if (this.availableMoney < cheapestCost) {
            return 0;
        }

        if (cheapestCost == levelUpgradeCost) {
            if (this.availableMoney >= levelUpgradeCost && ns.hacknet.upgradeLevel(upgradeTargetIndex, 1)) {
                this.availableMoney -= levelUpgradeCost;
                return levelUpgradeCost + this.upgradeNode(ns);
            }
            return 0;
        } else if (cheapestCost == ramUpgradeCost) {
            if (this.availableMoney >= ramUpgradeCost && ns.hacknet.upgradeRam(upgradeTargetIndex, 1)) {
                this.availableMoney -= ramUpgradeCost;
                return ramUpgradeCost + this.upgradeNode(ns);
            } 
            return 0;
        } else if (cheapestCost == coreUpgradeCost) {
            if (this.availableMoney >= coreUpgradeCost && ns.hacknet.upgradeCore(upgradeTargetIndex, 1)) {
                this.availableMoney -= coreUpgradeCost;
                return coreUpgradeCost + this.upgradeNode(ns);
            }
            return 0;
        } else {
            ns.print(`ERROR: Couldn't match cheapest cost value: ${cheapestCost}. Level: ${levelUpgradeCost}, Ram: ${ramUpgradeCost}, Core: ${coreUpgradeCost}`);
            return 0;
        }
    }

    sumStats(nodeStats: NodeStats) {
        return nodeStats.level + nodeStats.cores + nodeStats.ram;
    }
}