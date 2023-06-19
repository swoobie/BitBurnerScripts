import { NS, NodeStats } from "../../NetscriptDefinitions";

/**
 * Upgrades the hacknet using the specified money limit.
 * @param ns Whatever NS is
 * @param moneyLimit Max amount of money to spend upgrading the hacknet
 */
export function upgradeHacknet(ns: NS, moneyLimit: number, nodeLimit: number = 12) {
    let remainder = moneyLimit;

    if (ns.hacknet.numNodes() < nodeLimit) {
        remainder -= buyNode(ns, remainder);
    }

    remainder -= upgradeNode(ns, remainder);

    return moneyLimit - remainder; // amount spent
}

function buyNode(ns: NS, moneyLimit: number): number {
    const nodePurchaseCost = ns.hacknet.getPurchaseNodeCost();
    if (nodePurchaseCost > moneyLimit) {
        return 0;
    }

    let remainder = ns.hacknet.purchaseNode() > 0 ? moneyLimit - nodePurchaseCost : moneyLimit;
    return moneyLimit - remainder + buyNode(ns, remainder);
}

function upgradeNode(ns: NS, moneyLimit: number): number {
    const numNodes = ns.hacknet.numNodes();
    let upgradeTargetIndex = 0;

    if (numNodes == 0) return 0;

    // loop through and take the lowest sum of stats as the target to increase
    for (let i = 0; i < numNodes; i++) {
        const currentNodeStats = ns.hacknet.getNodeStats(i);
        const targetNodeStats = ns.hacknet.getNodeStats(upgradeTargetIndex);
        if (sumStats(currentNodeStats) < sumStats(targetNodeStats)) {
            upgradeTargetIndex = i;
        }
    }

    const levelUpgradeCost = ns.hacknet.getLevelUpgradeCost(upgradeTargetIndex, 1);
    const ramUpgradeCost = ns.hacknet.getRamUpgradeCost(upgradeTargetIndex, 1);
    const coreUpgradeCost = ns.hacknet.getCoreUpgradeCost(upgradeTargetIndex, 1);

    const cheapestCost = Math.min(levelUpgradeCost, ramUpgradeCost, coreUpgradeCost);

    let remainder = moneyLimit;

    if (moneyLimit < cheapestCost) {
        return 0;
    }

    if (cheapestCost == levelUpgradeCost) {
        if (remainder >= levelUpgradeCost) {
            remainder = ns.hacknet.upgradeLevel(upgradeTargetIndex, 1) ? remainder - levelUpgradeCost : remainder;
        }
    } else if (cheapestCost == ramUpgradeCost) {
        if (remainder >= ramUpgradeCost) {
            remainder = ns.hacknet.upgradeRam(upgradeTargetIndex, 1) ? remainder - ramUpgradeCost : remainder;
        } 
    } else if (cheapestCost == coreUpgradeCost) {
        if (remainder >= coreUpgradeCost) {
            remainder = ns.hacknet.upgradeCore(upgradeTargetIndex, 1) ? remainder - coreUpgradeCost : remainder;
        }
    } else {
        ns.print(`ERROR: Couldn't match cheapest cost value: ${cheapestCost}. Level: ${levelUpgradeCost}, Ram: ${ramUpgradeCost}, Core: ${coreUpgradeCost}`);
    }

    return moneyLimit - remainder + upgradeNode(ns, remainder);
}

function sumStats(nodeStats: NodeStats) {
    return nodeStats.level + nodeStats.cores + nodeStats.ram;
}