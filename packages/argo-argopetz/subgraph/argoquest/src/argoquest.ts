import { BigInt } from '@graphprotocol/graph-ts';
import { ArgoQuest, QuestStarted, QuestEdited, QuestStopped } from '../generated/ArgoQuest/ArgoQuest';
import { Quest } from '../generated/schema';

export function handleQuestStarted(event: QuestStarted): void {
  let id = event.params.tokenId.toString();
  let quest = new Quest(id);
  quest.questStartedAt = event.params.questStartedAt;
  quest.crews = event.params.crews;
  quest.owner = event.params.owner.toHexString();
  quest.save();
}

export function handleQuestEdited(event: QuestEdited): void {
  let id = event.params.tokenId.toString();
  let quest = Quest.load(id);

  if (quest) {
    quest.questEditedAt = event.params.questEditedAt;
    quest.crews = event.params.crews;
    quest.save();
  }
}

export function handleQuestStopped(event: QuestStopped): void {
  let id = event.params.tokenId.toString();
  let quest = Quest.load(id);

  if (quest) {
    quest.questStoppedAt = event.params.questStoppedAt;
    quest.save();
  }
}
