import { scanContext } from "./contextScanner.js";
import { resolveIntent } from "./intentResolver.js";
import { scanCapabilities } from "./capabilityScanner.js";

import { setLoaderStatus } from "../ui/loader.js";
import { dispatch } from "./dispatcher.js";

import { startRuntime } from "../runtime/runtime.js";
import { advancementEvent } from "../advancements/events/advancementEvents.js";

advancementEvent("elge:engine_started");

(async function ELGE_BOOT() {
  try {
    // STEP 1: Environment scan
    setLoaderStatus("Scanning environment");
    const context = scanContext();

    // STEP 2: Capability detection
    setLoaderStatus("Detecting system capabilities");
    const capabilities = scanCapabilities();

    // STEP 3: Resolve intent (where user is going)
    setLoaderStatus("Resolving destination");
    const intent = resolveIntent(context, capabilities);

    // STEP 4: Prepare runtime / module
    setLoaderStatus("Preparing runtime");
    await dispatch(intent, capabilities);

    // STEP 5: Start engine runtime
    setLoaderStatus("Starting engine");
    startRuntime({ context, capabilities });

    console.log('[ELGE BOOT] Success');
  } catch (err) {
    console.error("[ELGE BOOT FAILURE]", err);
    setLoaderStatus("Fatal error — cannot start");
  }
})();
