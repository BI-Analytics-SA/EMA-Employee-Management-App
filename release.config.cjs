/** @type {import('semantic-release').GlobalConfig} */
module.exports = {
  branches: ["main"],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      { preset: "conventionalcommits" },
    ],
    [
      "@semantic-release/release-notes-generator",
      { preset: "conventionalcommits" },
    ],
    [
      "@semantic-release/npm",
      {
        npmPublish: false,
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["package.json", "package-lock.json"],
        message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
    // Publishes a GitHub Release with the generated notes and comments
    // "released in vX" on the shipped PRs. Runs after @semantic-release/git
    // so the release points at the bump commit.
    "@semantic-release/github",
  ],
};
