import { NS } from "../NetscriptDefinitions";

export async function main(ns: NS) {
    const doc = document;

    // This does not work
    //const doc = eval("ns.bypass(document);");

    // Hook into game's overview
    const hook0 = doc.getElementById('overview-extra-hook-0');
    const hook1 = doc.getElementById('overview-extra-hook-1');

    while (true) {
        try {
            const headers = []
            const values = [];

            let hacknetTotalProduction: number = 0;
            let hacknetTotalProfit = 0;

            // Calculate total hacknet income & profit
            for (let index = 0; index <= ns.hacknet.numNodes() - 1; index++) {
                hacknetTotalProduction += ns.hacknet.getNodeStats(index).production;
                hacknetTotalProfit += ns.hacknet.getNodeStats(index).totalProduction;

                //ns.tprint("production for " + index + " " + ns.hacknet.getNodeStats(index).production.toPrecision(5));
            }

            headers.push("Hacknet Income: ");
            values.push(ns.formatNumber(hacknetTotalProduction, 2) + '/s');

            headers.push("Hacknet Profit: ");
            values.push(ns.formatNumber(hacknetTotalProfit, 2));

            headers.push("Script Income: ");
            values.push(ns.formatNumber(ns.getTotalScriptIncome()[1], 2) + '/s');

            headers.push("Script Experience: ");
            values.push(ns.formatNumber(ns.getTotalScriptExpGain(), 2) + '/s');

            headers.push("Share Power: ");
            values.push(ns.formatNumber(ns.getSharePower(), 2) + "");
            headers.push("People Killed: ");

            values.push(ns.getPlayer().numPeopleKilled);

            headers.push("City: ");
            values.push(ns.getPlayer().city);

            headers.push("Location: ");
            values.push(ns.getPlayer().location.substring(0, 10));

            headers.push("Local Time: ");
            values.push(new Date().toLocaleTimeString());

            hook0!.innerText = headers.join(" \n");
            hook1!.innerText = values.join("\n");
        } catch (error) {
            ns.print("ERROR- Update Skipped: " + String(error));
        }

        await ns.sleep(1000);
    }
}