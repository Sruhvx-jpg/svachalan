import { corsair, ensureCorsairSetup } from "../corsair/src/corsair";
import { buildCorsairToolDefs } from "@corsair-dev/mcp";

async function main() {
  await ensureCorsairSetup();
  // Get tenant
  const tenantCorsair = corsair.withTenant("c602893f-6023-47ec-96f4-67957079e266");
  
  // Let's mock a Proxy wrapper on tenantCorsair
  const createDeepProxy = (target: any, path: string[] = []): any => {
    return new Proxy(target, {
      get(target, prop, receiver) {
        const currentPath = [...path, String(prop)];
        console.log("PROXY GET:", currentPath.join("."));
        const value = Reflect.get(target, prop, receiver);

        if (typeof value === "function") {
          return function (this: any, ...args: any[]) {
            const pathStr = currentPath.join(".");
            console.log("PROXY CALL FUNCTION:", pathStr, "args:", JSON.stringify(args));
            const lowerPath = pathStr.toLowerCase();
            if (
              lowerPath.endsWith("messages.send") ||
              lowerPath.endsWith("drafts.create") ||
              lowerPath.endsWith("drafts.send")
            ) {
              console.log("INTERCEPTED PATH:", pathStr);
              throw new Error("ConfirmationRequired");
            }
            return value.apply(this, args);
          };
        }

        if (value && typeof value === "object") {
          return createDeepProxy(value, currentPath);
        }

        return value;
      },
    });
  };

  const proxyCorsair = createDeepProxy(tenantCorsair);
  
  // Try evaluating a typical script the AI might run
  const code = `
    const result = await corsair.gmail.api.messages.send({
      raw: "dGVzdA=="
    });
    return result;
  `;

  const fn = new Function("corsair", `return (async () => { ${code} })()`);
  try {
    await fn(proxyCorsair);
  } catch (err: any) {
    console.log("Caught Error:", err.message);
  }
}

main().catch(console.error);
