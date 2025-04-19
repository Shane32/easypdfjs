import { EasyPdf } from "../src/index";
import { ScaleMode } from "../src/ScaleMode";

test("defaultsToPoints", async () => {
  expect((await EasyPdf.create()).scaleMode).toBe(ScaleMode.Points);
});
