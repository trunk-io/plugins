// github secret on line 587 and 592 - ctrl+F "ghs_"
import "reflect-metadata";

import { faker } from "@faker-js/faker";
import chai, { expect } from "chai";
import chaiExclude from "chai-exclude";
import dayjs from "dayjs";
import { LDClient } from "launchdarkly-node-server-sdk";
import range from "lodash.range";
import { rest } from "msw";
import { App } from "trunk/trunk/base/ts/di";
import logger from "trunk/trunk/base/ts/logger";
import {
  awsPassThroughHandler,
  createServer,
  ldPassThroughHandler,
  ServerApi,
} from "trunk/trunk/base/ts/testing/msw";
import * as github from "trunk/trunk/services/common/source_control_clients/github";
import { createGithubClientFactoryWithGithubMock } from "trunk/trunk/services/common/source_control_clients/github/testing";
import * as prismaTypes from "trunk/trunk/services/prisma/client";
import PrismaClientFactory from "trunk/trunk/services/prisma/factory";
import * as synth from "trunk/trunk/services/prisma/synth";
import { ORGS_TO_NOT_SYNC_REPOKEYS_FOR } from "trunk/trunk/services/repo/cluster_job/constants";
import ApiTokenFixer from "trunk/trunk/services/repo/cluster_job/fix_api_token";
import DefaultBranchFixer from "trunk/trunk/services/repo/cluster_job/fix_default_branch";
import SyncRepoCommand, { SyncRepoOptions } from "trunk/trunk/services/repo/cluster_job/sync_repo";
import SyncRepoKeyCommand, {
  SyncRepoKeyOptions,
} from "trunk/trunk/services/repo/cluster_job/sync_repokey";
import * as aws from "trunk/trunk/services/third-party/aws/module";
import * as ld from "trunk/trunk/services/third-party/launchdarkly/module";
import { MODULE as PRISMA_MODULE } from "trunk/trunk/services/third-party/prisma/module";
import { anything, reset, when } from "ts-mockito";
import { DependencyContainer } from "tsyringe";
import { v4 as uuidv4 } from "uuid";

chai.use(chaiExclude);

describe("repo/cluster_job", function () {
  this.timeout(5000);

  const prisma = new PrismaClientFactory({ verbose: false, unsanitized: false }).create();
  const { githubClientFactory, mockedGithubClient } = createGithubClientFactoryWithGithubMock();
  const provider = "Github";

  const createRepos = async (numRepos: number, repoFields: Partial<prismaTypes.Repo>) => {
    const { id: repoKeyId } = await prisma.repoKey.create({
      data: {
        id: uuidv4(),
        provider,
        // NOTE(sam): I'm not sure what repoKey.key actually maps to. I think it's the github org
        // ID, but don't have a prod DB pulled up right now.
        key: uuidv4(),
      },
    });
    const orgName = faker.lorem.words(3).replace(/ /g, "-");
    logger.info(`Creating ${numRepos} repos for ${provider} organization '${orgName}'`);
    const repos = range(numRepos).map((i) => ({
      id: uuidv4(),
      provider,
      providerId: `github-${uuidv4()}`,
      name: `${orgName}/repo${i}`,
      mainHead: "asdf1234",
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      repoKeyId,
      ...repoFields,
    }));
    await prisma.repo.createMany({ data: repos });

    logger.info(`Created ${numRepos} repos for ${provider} organization '${orgName}'`);
  };

  beforeEach(async function () {
    reset(mockedGithubClient);
    when(mockedGithubClient.getToken(anything())).thenResolve("fake-github-token");
    await synth.reset();
  });

  describe("ApiTokenFixer", function () {
    it("dry runs missing api tokens", async function () {
      await createRepos(7, { apiToken: null });
      await createRepos(4, { apiToken: "" });
      const beforeRepos = await prisma.repo.findMany({ orderBy: { id: "asc" } });

      const stats = await new ApiTokenFixer(prisma, githubClientFactory).run({
        all: true,
        applyChanges: false,
        pageSize: 3,
      });

      expect(stats).to.deep.equal({
        repoCount: 11,
        repoFixedCount: 11,
        repoFailedCount: 0,
      });
      const afterRepos = await prisma.repo.findMany({ orderBy: { id: "asc" } });
      expect(afterRepos).to.deep.equal(beforeRepos);
    });

    it("sets missing api tokens", async function () {
      await createRepos(7, { apiToken: null });
      await createRepos(4, { apiToken: "" });
      const beforeRepos = await prisma.repo.findMany({ orderBy: { id: "asc" } });

      const stats = await new ApiTokenFixer(prisma, githubClientFactory).run({
        all: true,
        applyChanges: true,
        pageSize: 3,
      });

      expect(stats).to.deep.equal({
        repoCount: 11,
        repoFixedCount: 11,
        repoFailedCount: 0,
      });
      const afterRepos = await prisma.repo.findMany({ orderBy: { id: "asc" } });
      expect(afterRepos).excluding(["apiToken", "updatedAt"]).to.deep.equal(beforeRepos);
      afterRepos.forEach(({ apiToken }) => {
        expect(apiToken).to.have.lengthOf.at.least(1);
      });
    });

    it("does not rotate existing api tokens", async function () {
      await createRepos(5, { apiToken: "super-duper-secret" });
      const beforeRepos = await prisma.repo.findMany({ orderBy: { id: "asc" } });

      const stats = await new ApiTokenFixer(prisma, githubClientFactory).run({
        all: true,
        applyChanges: true,
        pageSize: 3,
      });

      expect(stats).to.deep.equal({
        repoCount: 0,
        repoFixedCount: 0,
        repoFailedCount: 0,
      });
      const afterRepos = await prisma.repo.findMany({ orderBy: { id: "asc" } });
      expect(afterRepos).excluding(["updatedAt"]).to.deep.equal(beforeRepos);
    });
  });

  describe("DefaultBranchFixer", function () {
    it("dry runs missing default branches", async function () {
      when(mockedGithubClient.getDefaultBranch(anything())).thenResolve("some-github-branch");
      await createRepos(7, { defaultBranch: null });
      await createRepos(4, { defaultBranch: "" });
      await createRepos(4, { defaultBranch: "fake" });
      const beforeRepos = await prisma.repo.findMany({ orderBy: { id: "asc" } });

      const stats = await new DefaultBranchFixer(prisma, githubClientFactory).run({
        all: true,
        applyChanges: false,
        pageSize: 5,
      });

      expect(stats).to.deep.equal({
        repoCount: 15,
        repoFixedCount: 15,
        repoFailedCount: 0,
      });
      const afterRepos = await prisma.repo.findMany({ orderBy: { id: "asc" } });
      expect(afterRepos).to.deep.equal(beforeRepos);
    });

    it("updates missing default branches", async function () {
      when(mockedGithubClient.getDefaultBranch(anything())).thenResolve("some-github-branch");
      await createRepos(7, { defaultBranch: null });
      await createRepos(4, { defaultBranch: "" });
      const beforeRepos = await prisma.repo.findMany({ orderBy: { id: "asc" } });

      const stats = await new DefaultBranchFixer(prisma, githubClientFactory).run({
        all: true,
        applyChanges: true,
        pageSize: 5,
      });

      expect(stats).to.deep.equal({
        repoCount: 11,
        repoFixedCount: 11,
        repoFailedCount: 0,
      });
      const afterRepos = await prisma.repo.findMany({ orderBy: { id: "asc" } });
      expect(afterRepos).excluding(["defaultBranch", "updatedAt"]).to.deep.equal(beforeRepos);
      afterRepos.forEach(({ defaultBranch }) => {
        expect(defaultBranch).to.equal("some-github-branch");
      });
    });

    it("updates incorrect default branches", async function () {
      when(mockedGithubClient.getDefaultBranch(anything())).thenResolve("some-github-branch");
      await createRepos(7, { defaultBranch: "some-github-branch" });
      await createRepos(4, { defaultBranch: "wrong-branch" });
      const beforeRepos = await prisma.repo.findMany({ orderBy: { id: "asc" } });

      const stats = await new DefaultBranchFixer(prisma, githubClientFactory).run({
        all: true,
        applyChanges: true,
        pageSize: 5,
      });

      expect(stats).to.deep.equal({
        repoCount: 11,
        repoFixedCount: 11,
        repoFailedCount: 0,
      });
      const afterRepos = await prisma.repo.findMany({ orderBy: { id: "asc" } });
      expect(afterRepos).excluding(["defaultBranch", "updatedAt"]).to.deep.equal(beforeRepos);
      afterRepos.forEach(({ defaultBranch }) => {
        expect(defaultBranch).to.equal("some-github-branch");
      });
    });

    it("default branch should have no changes", async function () {
      when(mockedGithubClient.getDefaultBranch(anything())).thenResolve("trunk");
      await createRepos(8, { defaultBranch: "trunk" });
      const beforeRepos = await prisma.repo.findMany({ orderBy: { id: "asc" } });

      const stats = await new DefaultBranchFixer(prisma, githubClientFactory).run({
        all: true,
        applyChanges: true,
        pageSize: 9,
      });

      expect(stats).to.deep.equal({
        repoCount: 8,
        repoFixedCount: 8,
        repoFailedCount: 0,
      });
      const afterRepos = await prisma.repo.findMany({ orderBy: { id: "asc" } });
      expect(afterRepos).excluding(["updatedAt"]).to.deep.equal(beforeRepos);
    });
  });

  describe("SyncRepoKeyCommand", function () {
    const appInstallationsHandler = ({
      installationIds,
      account,
      repositorySelection,
    }: {
      installationIds: number[];
      account?: { login: string };
      repositorySelection: "selected" | "all";
    }) =>
      rest.get("https://api.github.com/app/installations", (req, res, ctx) =>
        res(
          ctx.json(
            installationIds.map((installationId) => ({
              id: installationId,
              account: account ?? {
                login: "octoprawn",
              },
              html_url: `https://github.example/organizations/github/settings/installations/${installationId}`,
              app_id: 10101,
              target_id: `${faker.datatype.number(5000)}`,
              target_type: "Organization",
              repository_selection: repositorySelection,
              created_at: "2017-07-08T16:18:44-04:00",
              updated_at: "2017-07-08T16:18:44-04:00",
              app_slug: "github-actions",
              suspended_at: null,
              suspended_by: null,
            })),
          ),
        ),
      );

    const runSyncRepoKeyCommand = async (options: SyncRepoKeyOptions) => {
      const app = App.uses(ld.MODULE, aws.MODULE, PRISMA_MODULE, github.MODULE);
      return await app.run(async (deps: DependencyContainer) => {
        try {
          return await deps.resolve(SyncRepoKeyCommand).run(options);
        } catch (err) {
          logger.error("wrap error", err);
          return { runFailed: 1 };
        } finally {
          const ldClient = deps.resolve<LDClient>("LDClient");
          if (ldClient) {
            await ldClient.close();
          }
        }
      });
    };

    const nonGithubFields = ["id", "createdAt", "updatedAt", "ownerOrganizationId", "ownerUserId"];

    let testServer: ServerApi;

    before(function () {
      testServer = createServer([]);
      testServer.start();
    });

    after(function () {
      testServer.close();
    });

    beforeEach(function () {
      testServer.reset();
    });

    describe("prisma.RepoKey is missing records for GitHub app installs", function () {
      const installationIds = [111, 222, 333];
      const preInstalledRepoKey = {
        id: faker.datatype.uuid(),
        provider: "Github",
        key: "1234",
        githubAppInstallationUrl: "https://not.github/",
        githubAppInAllRepos: true,
      };

      [
        {
          testCaseName:
            "by default, reports intent to create prisma.RepoKey records for missing installs",
          applyChanges: false,
          expected: {
            wouldCreate: installationIds.length,
          },
          expectFinalDbState: async () =>
            expect(await prisma.repoKey.findMany())
              .to.excluding(nonGithubFields)
              .deep.equal([preInstalledRepoKey]),
        },
        {
          testCaseName: "with --apply-changes, creates prisma.RepoKey records for missing installs",
          applyChanges: true,
          expected: {
            created: installationIds.length,
          },
          expectFinalDbState: async () =>
            expect(await prisma.repoKey.findMany({ orderBy: [{ key: "asc" }] }))
              .to.excluding(nonGithubFields)
              .deep.equal([
                {
                  githubAppInAllRepos: false,
                  githubAppInstallationUrl:
                    "https://github.example/organizations/github/settings/installations/111",
                  key: "111",
                  provider: "Github",
                },
                preInstalledRepoKey,
                {
                  githubAppInAllRepos: false,
                  githubAppInstallationUrl:
                    "https://github.example/organizations/github/settings/installations/222",
                  key: "222",
                  provider: "Github",
                },
                {
                  githubAppInAllRepos: false,
                  githubAppInstallationUrl:
                    "https://github.example/organizations/github/settings/installations/333",
                  key: "333",
                  provider: "Github",
                },
              ]),
        },
      ].map(({ testCaseName, applyChanges, expected, expectFinalDbState }) =>
        it(testCaseName, async function () {
          testServer.overrideHandlers([
            ldPassThroughHandler,
            awsPassThroughHandler,
            () =>
              appInstallationsHandler({
                installationIds,
                repositorySelection: "selected",
              }),
          ]);
          await prisma.repoKey.create({ data: preInstalledRepoKey });
          expect(await prisma.repoKey.findMany())
            .to.excluding(nonGithubFields)
            .deep.equal([preInstalledRepoKey]);

          expect(
            await runSyncRepoKeyCommand({ all: true, applyChanges, pageSize: 1 }),
          ).to.deep.equal(expected);

          await expectFinalDbState();
        }),
      );
    });

    describe("prisma.RepoKey records correspond to GitHub app installs but are out-of-sync", function () {
      const installationIds = [1234];
      const preInstalledRepoKey = {
        id: faker.datatype.uuid(),
        provider: "Github",
        key: "1234",
        githubAppInstallationUrl: "https://not.github/",
        githubAppInAllRepos: true,
      };

      [
        {
          testCaseName:
            "by default, reports intent to update prisma.RepoKey records to match GitHub",
          applyChanges: false,
          expected: {
            wouldUpdate: installationIds.length,
          },
          expectFinalDbState: async () =>
            expect(await prisma.repoKey.findMany())
              .to.excluding(nonGithubFields)
              .deep.equal([preInstalledRepoKey]),
        },
        {
          testCaseName: "with --apply-changes, updates prisma.RepoKey records to match GitHub",
          applyChanges: true,
          expected: {
            updated: installationIds.length,
          },
          expectFinalDbState: async () =>
            expect(await prisma.repoKey.findMany())
              .to.excluding(nonGithubFields)
              .deep.equal([
                {
                  ...preInstalledRepoKey,
                  githubAppInstallationUrl:
                    "https://github.example/organizations/github/settings/installations/1234",
                  githubAppInAllRepos: false,
                },
              ]),
        },
      ].map(({ testCaseName, applyChanges, expected, expectFinalDbState }) =>
        it(testCaseName, async function () {
          testServer.overrideHandlers([
            ldPassThroughHandler,
            awsPassThroughHandler,
            () => appInstallationsHandler({ installationIds, repositorySelection: "selected" }),
          ]);
          await prisma.repoKey.create({
            data: preInstalledRepoKey,
          });
          expect(await prisma.repoKey.findMany())
            .to.excluding(nonGithubFields)
            .deep.equal([preInstalledRepoKey]);

          expect(
            await runSyncRepoKeyCommand({ all: true, applyChanges, pageSize: 1 }),
          ).to.deep.equal(expected);

          await expectFinalDbState();
        }),
      );
    });

    describe("prisma.RepoKey is up-to-date w.r.t. GitHub", function () {
      const installationIds = [1234];
      const preInstalledRepoKey = {
        provider: "Github",
        key: "1234",
        githubAppInstallationUrl:
          "https://github.example/organizations/github/settings/installations/1234",
        githubAppInAllRepos: false,
      };

      [
        {
          testCaseName: "by default, reports prisma.RepoKey records are up-to-date",
          applyChanges: false,
        },
        {
          testCaseName: "with --apply-changes, reports prisma.RepoKey records are up-to-date",
          applyChanges: true,
        },
      ].map(({ testCaseName, applyChanges }) =>
        it(testCaseName, async function () {
          testServer.overrideHandlers([
            ldPassThroughHandler,
            awsPassThroughHandler,
            () => appInstallationsHandler({ installationIds, repositorySelection: "selected" }),
          ]);
          await prisma.repoKey.create({
            data: { id: faker.datatype.uuid(), ...preInstalledRepoKey },
          });
          expect(await prisma.repoKey.findMany())
            .to.excluding(nonGithubFields)
            .deep.equal([preInstalledRepoKey]);

          expect(
            await runSyncRepoKeyCommand({ all: true, applyChanges, pageSize: 1 }),
          ).to.deep.equal({ isUpToDate: installationIds.length });

          expect(await prisma.repoKey.findMany())
            .to.excluding(nonGithubFields)
            .deep.equal([preInstalledRepoKey]);
        }),
      );
    });

    describe("RepoKey corresponds to an app install used for internal testing", function () {
      const installationIds = [111, 222, 333];
      const preInstalledRepoKey = {
        id: faker.datatype.uuid(),
        provider: "Github",
        key: "1234",
        githubAppInstallationUrl: "https://not.github/",
        githubAppInAllRepos: true,
      };

      [
        {
          testCaseName: "by default, reports install skipped",
          applyChanges: false,
        },
        {
          testCaseName: "with --apply-changes, reports install skipped",
          applyChanges: true,
        },
      ].map(({ testCaseName, applyChanges }) =>
        it(testCaseName, async function () {
          testServer.overrideHandlers([
            ldPassThroughHandler,
            awsPassThroughHandler,
            () =>
              appInstallationsHandler({
                installationIds,
                account: { login: ORGS_TO_NOT_SYNC_REPOKEYS_FOR.at(-2) as string },
                repositorySelection: "selected",
              }),
          ]);
          await prisma.repoKey.create({ data: preInstalledRepoKey });
          expect(await prisma.repoKey.findMany())
            .to.excluding(nonGithubFields)
            .deep.equal([preInstalledRepoKey]);

          expect(
            await runSyncRepoKeyCommand({ all: true, applyChanges, pageSize: 1 }),
          ).to.deep.equal({ skipped: installationIds.length });

          await expect(await prisma.repoKey.findMany())
            .to.excluding(nonGithubFields)
            .deep.equal([preInstalledRepoKey]);
        }),
      );
    });
  });

  describe("SyncRepoCommand", function () {
    const installationId = 1234;
    const appInstallation = {
      id: installationId,
      account: {
        login: "octoprawn",
      },
      html_url: `https://github.example/organizations/octoprawn/settings/installations/${installationId}`,
      app_id: 10101,
      target_id: `${faker.datatype.number(5000)}`,
      target_type: "Organization",
      repository_selection: "all",
      created_at: "2017-07-08T16:18:44-04:00",
      updated_at: "2017-07-08T16:18:44-04:00",
      app_slug: "github-actions",
      suspended_at: null,
      suspended_by: null,
    };
    const repoKeyId = faker.datatype.uuid();

    const preInstalledRepoKey = {
      id: repoKeyId,
      provider: "Github",
      key: `${installationId}`,
      githubAppInstallationUrl: "https://not.github/",
      githubAppInAllRepos: true,
    };

    const handlers = [
      ldPassThroughHandler,
      awsPassThroughHandler,
      () =>
        rest.get("https://api.github.com/app/installations/:installationId", (req, res, ctx) =>
          res(ctx.json(appInstallation)),
        ),
      () =>
        rest.get("https://api.github.com/repos/:owner/:repo/installation", (req, res, ctx) =>
          res(ctx.json(appInstallation)),
        ),
      () =>
        rest.post(
          "https://api.github.com/app/installations/:installationId/access_tokens",
          (req, res, ctx) =>
            res(
              ctx.json({
                token: "ghs_111111111111111111111111111111111111",
                expires_at: dayjs().add(1, "days").toISOString(),
                permissions: { contents: "read" },
                repository_selection: "selected",
                // again to make sure we can report it multiple times
                moreToken: "ghs_111111111111111111111111111111111111",
              }),
            ),
        ),
    ];
  });
});
