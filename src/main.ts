import { mount } from "svelte";
import App from "./App.svelte";
import "./lib/styles/global.css";
import "./lib/styles/markdown-body.css";
import "./lib/styles/themes/light.css";
import "./lib/styles/themes/dark.css";
import "./lib/styles/themes/sepia.css";

const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;
