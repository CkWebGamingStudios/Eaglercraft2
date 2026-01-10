export async function dispatch(intent, caps) {
  switch (intent) {
    case "PLAY":
      return import("../modules/play.js");

    case "EDITOR":
      return import("../modules/editor.js");

    case "ASSETS":
      return import("../modules/assets.js");

    default:
      return import("../modules/home.js");
  }
}
