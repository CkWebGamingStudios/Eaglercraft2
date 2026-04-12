import { scanContext } from "./contextScanner.js";
import { resolveIntent } from "./intentResolver.js";
import { scanCapabilities } from "./capabilityScanner.js";
import { setLoaderStatus } from "../ui/loader.js";
import { dispatch } from "./dispatcher.js";
import { startRuntime } from "../runtime/runtime.js";
import { advancementEvent } from "../advancements/events/advancementEvents.js";
import { ModLoader } from "./modding/ModLoader.ts";
import { RendererFactory } from "../victus/core/RendererFactory.ts";

advancementEvent("elge:engine_started");

(async function ELGE_BOOT() {
  try {
    // STEP 1: Environment scan
    setLoaderStatus("Scanning environment");
    const context = scanContext();

    // STEP 2: Capability detection
    setLoaderStatus("Detecting system capabilities");
    const capabilities = scanCapabilities();

    // STEP 3: Resolve intent
    setLoaderStatus("Resolving destination");
    const intent = resolveIntent(context, capabilities);

    // STEP 4: Browser Check
    const browserRec = RendererFactory.getBrowserRecommendation();
    if (browserRec.recommended !== browserRec.current) {
        console.warn(`[ELGE] Recommended browser: ${browserRec.recommended}`);
        console.warn(`[ELGE] Reason: ${browserRec.reason}`);
    }

    // STEP 5: Prepare runtime / module
    setLoaderStatus("Preparing runtime");
    await dispatch(intent, capabilities);

    // STEP 6: Initialize mod loader
    setLoaderStatus("Loading mods");
    await ModLoader.install('./modding/temp/mod.json');

    // STEP 7: Start engine runtime
    setLoaderStatus("Starting engine");
    startRuntime({ context, capabilities });

  } catch (err) {
    console.error("[ELGE BOOT FAILURE]", err);
    setLoaderStatus("Fatal error — cannot start");
  }
})(); // Added missing closing parenthesis to invoke the IIFE
