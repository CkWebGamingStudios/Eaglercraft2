export function start({ context, capabilities }) {
  import { startRuntime } from "../runtime/runtime.js"; // ERROR: This is inside the function
  
  startRuntime({ context, capabilities });
}
