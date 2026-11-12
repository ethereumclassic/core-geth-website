/**
 * Recordings of the Linux steps that watching makes clearer than a block and its note can: a first
 * start, a clean stop, and the start from the node records `ethereumclassic/discv4-dns-lists` commits
 * (maintainer, 2026-11-08). A step that prints a line or two, or nothing, carries none: a recording of
 * it adds nothing, and too many recordings overwhelm a reader. Each sits under the step it records,
 * matched by that step's title in the Linux tab, and a title the tab no longer has fails the build.
 *
 * public/recordings/install-v1-13/ and public/recordings/discovery-v1-12/ hold recordings made for this
 * site. The move recordings in public/recordings/v1-12-to-v1-13/ are copies of two of those published
 * with https://ethereumclassic.com/news/core-geth-v1-12-to-v1-13-migration. Each is a WebM and an MP4,
 * with a PNG of its last frame as the poster. Every node advertised 203.0.113.10, an address reserved
 * for documentation, in place of its own. A `v1.12` recording runs `v1.12.20`, the last release
 * `etclabscore/core-geth` published before the client moved to `ethereumclassic/core-geth`.
 */
import type { PanelStep, PlatformPanel, StepRecording } from "@/components/PlatformTabs.astro";
import { RECOMMENDED_LINE } from "@/data/site";
import { DARK_PANELS, DISCOVERY_PANELS, IN_TERMINAL, MOVE_PANELS, PANELS } from "@/data/steps";

/** The releases the recordings show, which the steps around them may have moved past. */
export const RECORDED_INSTALL = { release: "v1.13.0" } as const;
export const RECORDED_MOVE = { from: "v1.12.20", to: "v1.13.0" } as const;
export const RECORDED_DISCOVERY = { release: "v1.12.20" } as const;

const clip =
  (dir: string, label: string) =>
  (id: string, caption: string): StepRecording => ({
    webm: `${dir}/${id}.webm`,
    mp4: `${dir}/${id}.mp4`,
    poster: `${dir}/${id}.png`,
    width: 1200,
    height: 816,
    label,
    caption,
  });

const installClip = clip(
  "/recordings/install-v1-13",
  `Recorded on Linux, installing \`${RECORDED_INSTALL.release}\``,
);
const moveClip = clip(
  "/recordings/v1-12-to-v1-13",
  `Recorded on Linux, moving \`${RECORDED_MOVE.from}\` to \`${RECORDED_MOVE.to}\``,
);
const discoveryClip = clip(
  "/recordings/discovery-v1-12",
  `Recorded on Linux, on \`${RECORDED_DISCOVERY.release}\``,
);

/**
 * A step with its recording: under the step, or, where the step offers a way per how the node runs,
 * in its terminal tab, because every recording was made in a terminal. A step whose ways have no
 * terminal tab fails the build rather than placing the recording under a way it does not show.
 */
const recorded = (step: PanelStep, recording: StepRecording): PanelStep => {
  if (!step.variants) return { ...step, recording };
  if (!step.variants.some((variant) => variant.label === IN_TERMINAL)) {
    throw new Error(`a recording names "${step.title}", whose ways have no "${IN_TERMINAL}" tab`);
  }
  return {
    ...step,
    variants: step.variants.map((variant) =>
      variant.label === IN_TERMINAL ? { ...variant, recording } : variant,
    ),
  };
};

/** Each panel set with its recordings under the Linux steps they record, by step title. */
const withRecordings = (
  panels: readonly PlatformPanel[],
  byStep: ReadonlyMap<string, StepRecording>,
): readonly PlatformPanel[] => {
  const linux = panels.find((panel) => panel.id === "linux");
  for (const step of byStep.keys()) {
    if (!linux?.steps.some((candidate) => candidate.title === step)) {
      throw new Error(`a recording names "${step}", which its Linux tab no longer has`);
    }
  }
  return panels.map((panel) =>
    panel.id !== "linux"
      ? panel
      : {
          ...panel,
          steps: panel.steps.map((step) => {
            const recording = byStep.get(step.title);
            return recording ? recorded(step, recording) : step;
          }),
        },
  );
};

/** The install tabs, with the Linux first start recorded. */
export const RECORDED_INSTALL_PANELS = withRecordings(
  PANELS,
  new Map([
    [
      "Start a node on Ethereum Classic",
      installClip(
        "start-node",
        "`geth --classic` starts the node with snap sync. It advertises `203.0.113.10`, an address reserved for documentation, set with `GETH_NAT` for this recording in place of the node's own. It opens its IPC endpoint, logs `Block synchronisation started` as it finds peers, and begins downloading the chain.",
      ),
    ],
  ]),
);

/** The move tabs, with the Linux clean stop and the first start on the new key recorded. */
export const RECORDED_MOVE_PANELS = withRecordings(
  MOVE_PANELS,
  new Map([
    [
      "Stop the node cleanly",
      moveClip(
        "stop-cleanly",
        "One Ctrl-C in the node's terminal: the node writes its state to disk and logs `Blockchain stopped`, and the prompt returns once the process exits.",
      ),
    ],
    [
      "Start the node",
      moveClip(
        "start-node",
        "Started from a terminal with `geth --classic --syncmode full --mess=false`, which sets MESS explicitly, as the flags step asks. The node starts on its new key, opens its IPC endpoint and goes on importing blocks.",
      ),
    ],
  ]),
);

/** The discovery guide's steps, with the Linux clean stop and the start on the new lists recorded. */
export const RECORDED_DISCOVERY_PANELS = withRecordings(
  DISCOVERY_PANELS,
  new Map([
    [
      "Stop the node cleanly",
      discoveryClip(
        "stop-cleanly",
        "One Ctrl-C in the node's terminal: the node writes its state to disk and logs `Blockchain stopped`.",
      ),
    ],
    [
      `Start it with the ${RECOMMENDED_LINE} line's lists and bootnodes`,
      discoveryClip(
        "start-with-lists",
        "Started from a terminal with the step's line and `--syncmode full`, the node's other flag. It advertises `203.0.113.10`, an address reserved for documentation, set with `GETH_NAT` for this recording in place of the node's own, and logs `Block synchronisation started` 8 seconds after its P2P networking starts, then imports blocks.",
      ),
    ],
  ]),
);

/** The dark-lists steps, with the Linux start from the committed records recorded. */
export const RECORDED_DARK_PANELS = withRecordings(
  DARK_PANELS,
  new Map([
    [
      "Start the node once from the committed records",
      discoveryClip(
        "start-from-records",
        "One Ctrl-C stops the node, which logs `Blockchain stopped`. The step's command, with `--syncmode full` added, then starts it from the twenty node records committed in `ethereumclassic/discv4-dns-lists`. It advertises `203.0.113.10`, set with `GETH_NAT` for this recording, and logs `Block synchronisation started` 7 seconds after its P2P networking starts.",
      ),
    ],
  ]),
);
