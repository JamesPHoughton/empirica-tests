import { test } from "@playwright/test";
import ExperimentPage from "../page-objects/main/ExperimentPage";
import BatchesAdminPage, {
  BatchStatus,
  GamesTypeTreatment,
} from "../page-objects/admin/BatchesAdminPage";
import EmpiricaTestFactory from "../setup/EmpiricaTestFactory";
import { createPlayer } from "../utils/playerUtils";

import { baseUrl } from "../setup/setupConstants";
import LobbiesAdminPage, {
  LobbyTimeoutKind,
  LobbyTimeoutStrategy,
} from "../page-objects/admin/LobbiesAdminPage";

const testFactory = new EmpiricaTestFactory();

test.beforeAll(async () => {
  await testFactory.init();
});

test.afterAll(async () => {
  await testFactory.teardown();
});

test.describe("Lobby timeouts in Empirica", () => {
  test("create configuration with a shared lobby timeout, fail strategy", async ({
    browser,
  }) => {
    const batchesPage = testFactory.createPage(BatchesAdminPage, {
      browser,
      baseUrl,
    });

    const lobbiesPage = testFactory.createPage(LobbiesAdminPage,{
      browser,
      baseUrl,
    });

    const player1 = createPlayer();
    const gamesCount = 1;
    const gameMode = GamesTypeTreatment.TwoPlayers;
    const lobbyConfigration = {
      name: "test",
      description: "Testing shared lobby timeout with a fail strategy",
      duration: "5s",
      kind: LobbyTimeoutKind.Shared,
      strategy: LobbyTimeoutStrategy.Fail,
    };

    await lobbiesPage.open();

    await lobbiesPage.createNewLobbyConfiguration(lobbyConfigration);

    await batchesPage.open();

    await batchesPage.createBatch({
      mode: gameMode,
      gamesCount,
      lobbyConfigrationName: LobbiesAdminPage.getLobbyName(lobbyConfigration),
    });

    await batchesPage.checkBatchStatus({
      batchNumber: 0,
      status: BatchStatus.Created,
    });

    await batchesPage.startGame();

    const player1Page = testFactory.createPage(ExperimentPage, {
      browser,
      baseUrl,
    });

    const player2Page = testFactory.createPage(ExperimentPage, {
      browser,
      baseUrl,
    });

    await player1Page.open();
    await player2Page.open();

    // Only player 1 logs in, player 2 stays in the instructions
    await player1Page.acceptConsent();

    await player1Page.login({ playerId: player1.id });

    await player1Page.passInstructions();

    // Here we'd wait for 5 seconds until the player gets kicked out because player 2 hasn't joined

    await player2Page.checkIfNoExperimentsVisible();

    await player1Page.fillExitSurvey({
      age: player1.age,
      gender: player1.gender,
    });

    await batchesPage.checkBatchStatus({
      batchNumber: 0,
      status: BatchStatus.Ended,
    });

    await player1Page.checkIfFinished();
  });
});
