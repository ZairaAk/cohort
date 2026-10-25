import { User } from '../models/User.js';
import { badRequest, forbidden, notFound } from '../utils/errors.js';

// Reputation only comes from answers the asker accepted, so it measures helpfulness, not popularity.
export const ACCEPTED_ANSWER_POINTS = 10;

// Works for both raw ObjectIds and populated documents.
const idOf = (ref) => String(ref?._id ?? ref);

export async function acceptAnswer(question, answerId, actorId) {
  if (idOf(question.author) !== String(actorId)) {
    throw forbidden('Only the person who asked can accept an answer');
  }
  const answer = question.answers.id(answerId);
  if (!answer) throw notFound('Answer not found');
  if (idOf(answer.author) === idOf(question.author)) {
    throw badRequest('You cannot accept your own answer');
  }
  if (question.acceptedAnswer && idOf(question.acceptedAnswer) === idOf(answer)) return question;

  const previous = question.acceptedAnswer ? question.answers.id(question.acceptedAnswer) : null;

  question.acceptedAnswer = answer._id;
  await question.save();

  // Move the points: take them back from the previously accepted answer, award the new one.
  if (previous) {
    await User.updateOne({ _id: idOf(previous.author) }, { $inc: { reputation: -ACCEPTED_ANSWER_POINTS } });
  }
  await User.updateOne({ _id: idOf(answer.author) }, { $inc: { reputation: ACCEPTED_ANSWER_POINTS } });
  return question;
}
