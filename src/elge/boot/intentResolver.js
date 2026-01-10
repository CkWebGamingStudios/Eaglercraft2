export function resolveIntent(ctx) {
  if (ctx.path.startsWith("/play")) return "PLAY";
  if (ctx.path.startsWith("/editor")) return "EDITOR";
  if (ctx.path.startsWith("/assets")) return "ASSETS";
  return "HOME";
}
