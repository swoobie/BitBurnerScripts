import { NS } from "@ns";
import { ServerBase } from "lib.serverbase";

export async function main(ns: NS): Promise<void> {
  ns.tprint("Hello Remote API! With A Change@##!");

  const home = new ServerBase(ns, "home");
  ns.tprint(`Server: ${home.id}; Money: ${home.money.available}`);
}
