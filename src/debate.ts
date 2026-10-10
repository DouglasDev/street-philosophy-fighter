import type { FighterId, MoveId } from "./dialogue.ts";
export type Zone = "high" | "middle" | "low";
export const TOPIC = "Does ambition help us flourish, or make us suffer?";
export const ZONES: Record<
  Zone,
  { label: string; part: string; attack: string }
> = {
  high: { label: "HIGH", part: "Conclusion", attack: "Overhead strike" },
  middle: { label: "MIDDLE", part: "Inference", attack: "Argument thrust" },
  low: { label: "LOW", part: "Premise", attack: "Low kick" },
};
export interface Answer {
  text: string;
  quality: number;
  kind: "defend" | "concede" | "evade";
  next: string;
  explanation: string;
}
export interface Rebuttal {
  id: string;
  text: string;
  target: Zone;
  technique: string;
  move: MoveId;
  strength: number;
  explanation: string;
  answers: Answer[];
}
export interface DebateNode {
  id: string;
  claimant: FighterId;
  argument: string;
  claim: Record<Zone, string>;
  choices: Rebuttal[];
}
function response(
  id: string,
  text: string,
  target: Zone,
  technique: string,
  move: MoveId,
  strength: number,
  explanation: string,
  next: string,
  replies: [string, string, string],
  alternate?: string,
): Rebuttal {
  return {
    id,
    text,
    target,
    technique,
    move,
    strength,
    explanation,
    answers: [
      {
        text: replies[0],
        quality: 3,
        kind: "defend",
        next,
        explanation:
          "This answer addresses the objection and preserves a narrower, defensible claim.",
      },
      {
        text: replies[1],
        quality: 2,
        kind: "concede",
        next: alternate ?? next,
        explanation:
          "A useful concession: revise the claim instead of defending more than it establishes.",
      },
      {
        text: replies[2],
        quality: 0,
        kind: "evade",
        next,
        explanation:
          "This answer sidesteps the challenged claim. Argument pressure increases.",
      },
    ],
  };
}
export const DEBATE: Record<string, DebateNode> = {
  purpose: {
    id: "purpose",
    argument: "We can revise our goals through reason. Ambition can guide our lives without enslaving us.",
    claimant: "rand",
    claim: {
      low: "We can choose and revise our purposes.",
      middle: "A purpose chosen through reason can be compatible with freedom.",
      high: "Therefore, ambition need not enslave us.",
    },
    choices: [
      response(
        "identity-cost",
        "Can you revise a goal when abandoning it threatens your identity?",
        "low",
        "Test the premise",
        "aggregates",
        3,
        "Challenges whether the claimed freedom survives a concrete obstacle.",
        "attachment",
        [
          "Revision may be difficult without being impossible. Reason can examine that cost.",
          "Yes, attachment to an identity can obstruct revision. My claim must allow for that.",
          "Successful people never question who they are.",
        ],
        "practice",
      ),
      response(
        "choice-craving",
        "Choosing a goal does not establish freedom from craving its outcome.",
        "middle",
        "Draw a distinction",
        "cause",
        3,
        "Distinguishes choosing a purpose from freedom from attachment; the inference needs support.",
        "attachment",
        [
          "Agreed. I defend rational pursuit, not the claim that every chosen goal is free of craving.",
          "Then I narrow my conclusion: ambition can be free when its pursuit remains rational.",
          "If a goal is chosen, it cannot involve craving.",
        ],
        "practice",
      ),
      response(
        "all-selfish",
        "All ambition is selfish, so every ambition enslaves us.",
        "high",
        "Universal challenge",
        "cause",
        0,
        "Equates self-interest with enslavement without establishing the connection.",
        "attachment",
        [
          "Self-interest does not establish enslavement. You need an argument connecting them.",
          "Some ambitions are compulsive. That does not establish your universal claim.",
          "Your philosophy is too passive to understand success.",
        ],
      ),
    ],
  },
  attachment: {
    id: "attachment",
    argument: "If peace depends on success, failure threatens it. Ambition with clinging can bring suffering.",
    claimant: "buddha",
    claim: {
      low: "A person may make their peace depend on achieving a goal.",
      middle: "When peace depends on success, failure threatens that peace.",
      high: "Ambition joined to clinging can therefore bring suffering.",
    },
    choices: [
      response(
        "not-all",
        "That concerns clinging. Why extend the objection to ambition itself?",
        "middle",
        "Separate the concepts",
        "premises",
        3,
        "Prevents a claim about attached ambition from becoming a claim about all ambition.",
        "revision",
        [
          "I do not extend it to every ambition. The attachment is what I ask us to examine.",
          "Then we agree that purposeful action and clinging must be distinguished.",
          "Every ambitious person secretly clings.",
        ],
        "value",
      ),
      response(
        "worthwhile-cost",
        "Can meaningful work be worth pursuing despite disappointment?",
        "high",
        "Limit the conclusion",
        "achievement",
        2,
        "Challenges a possible practical implication, while allowing that suffering can occur.",
        "revision",
        [
          "Yes. Recognizing suffering need not require abandoning meaningful work.",
          "The possibility of disappointment alone does not settle whether to pursue the work.",
          "Anything that disappoints us should be abandoned.",
        ],
        "value",
      ),
      response(
        "no-agency",
        "You think people cannot choose anything at all.",
        "low",
        "Challenge the claim",
        "identity",
        0,
        "The premise describes a possible attachment, not the absence of human agency.",
        "revision",
        [
          "I describe a condition people can examine, not a denial of choice.",
          "Choice matters; it does not by itself remove attachment.",
          "Your insistence on choice proves you are attached.",
        ],
      ),
    ],
  },
  revision: {
    id: "revision",
    argument: "Examining goals can loosen attachment. Rational revision can make ambition less enslaving.",
    claimant: "rand",
    claim: {
      low: "People can examine their goals and change mistaken judgments.",
      middle: "Examining a goal can loosen an unexamined attachment to it.",
      high: "Rational revision can make ambition less enslaving.",
    },
    choices: [
      response(
        "habit-gap",
        "Knowing a goal is mistaken does not guarantee release from it.",
        "middle",
        "Challenge sufficiency",
        "mindful",
        3,
        "Exposes the gap between recognizing an error and changing an ingrained response.",
        "habit",
        [
          "I claim revision can help, not that knowledge alone guarantees release.",
          "Then deliberate judgment may need practice to change entrenched habits.",
          "Once people know better, they always act better.",
        ],
        "practice",
      ),
      response(
        "loss-test",
        "Would you remain willing to revise a goal after years of work?",
        "low",
        "Counterexample test",
        "aggregates",
        2,
        "Tests willingness under sunk costs without proving revision impossible.",
        "habit",
        [
          "Past effort matters as context; it cannot make a mistaken goal correct.",
          "Years of effort can bias judgment. That difficulty belongs in our account.",
          "Years of work make a goal worth pursuing forever.",
        ],
      ),
      response(
        "reason-fails",
        "Reason sometimes fails, so it cannot help with attachment.",
        "high",
        "Test the conclusion",
        "cause",
        0,
        "An imperfect capacity can still be useful; occasional failure does not prove uselessness.",
        "habit",
        [
          "Fallibility does not establish uselessness. Compare careful judgment with its absence.",
          "Reason has limits. That is a reason to use it carefully, not discard it.",
          "My reasoning can never fail.",
        ],
      ),
    ],
  },
  habit: {
    id: "habit",
    argument: "Craving can outlast insight. Practicing attention can help us act without obeying every impulse.",
    claimant: "buddha",
    claim: {
      low: "Habits of craving can persist after we recognize them.",
      middle:
        "Repeated attention can help us notice impulses without obeying them.",
      high: "Freedom from clinging may require practice as well as judgment.",
    },
    choices: [
      response(
        "attention-action",
        "How does noticing an impulse establish that you can change your response?",
        "middle",
        "Ask for the missing step",
        "premises",
        3,
        "Asks how observation becomes an opportunity to act differently.",
        "agency",
        [
          "Noticing creates an opportunity, not a guarantee. Repeated practice develops that capacity.",
          "Attention alone is insufficient; practice must include responding differently.",
          "Every impulse disappears as soon as it is observed.",
        ],
        "value",
      ),
      response(
        "purpose-practice",
        "Is practicing release itself a purposeful pursuit?",
        "high",
        "Consistency test",
        "achievement",
        2,
        "Tests whether the proposed practice is compatible with a qualified form of ambition.",
        "agency",
        [
          "Yes. Purposeful effort need not require clinging to its result.",
          "Then purposeful pursuit is compatible with my account when attachment is examined.",
          "Practice has no purpose and requires no effort.",
        ],
        "value",
      ),
      response(
        "just-drifting",
        "Your practice is just an excuse to drift without doing anything.",
        "low",
        "Challenge the practice",
        "identity",
        0,
        "Dismisses the practice without addressing its premise or effects.",
        "agency",
        [
          "Practice is an activity. You have not shown it amounts to drifting.",
          "It can be misused to avoid action; that does not define the practice.",
          "Everyone who works hard is merely confused.",
        ],
      ),
    ],
  },
  agency: {
    id: "agency",
    argument: "Choosing a purpose organizes our actions. Ambition can express our agency rather than destroy it.",
    claimant: "rand",
    claim: {
      low: "Acting requires choosing among possible courses of action.",
      middle: "Choosing a considered purpose can organize those actions.",
      high: "Purposeful ambition can express agency rather than destroy it.",
    },
    choices: [
      response(
        "agency-attachment",
        "Expressing agency does not show that the outcome is held without attachment.",
        "middle",
        "Draw a distinction",
        "release",
        3,
        "Agency and non-attachment answer different questions. One does not establish the other.",
        "practice",
        [
          "Correct. Agency supports purposeful action, not immunity from attachment.",
          "My conclusion should concern agency; attachment requires a separate examination.",
          "Anyone who acts freely must be free of craving.",
        ],
      ),
      response(
        "abandon-purpose",
        "Can agency also be expressed by abandoning an ambition?",
        "high",
        "Broaden the alternatives",
        "mindful",
        2,
        "Adds a neglected expression of agency without denying that ambition can express it.",
        "practice",
        [
          "Yes, when reasons support abandonment. Agency does not require pursuing every goal.",
          "Then agency includes both pursuit and deliberate release.",
          "Abandoning any goal is always a surrender of agency.",
        ],
      ),
      response(
        "choice-unreal",
        "There is no permanent self, so no choices occur.",
        "low",
        "Question the premise",
        "aggregates",
        0,
        "A claim about a permanent self does not establish that choosing never occurs.",
        "practice",
        [
          "Whether a self is permanent does not settle whether people make choices.",
          "We can investigate the chooser without denying the activity of choosing.",
          "A self must be eternal for action to exist.",
        ],
      ),
    ],
  },
  practice: {
    id: "practice",
    argument: "We can work toward goals while observing attachment. Purposeful effort need not mean clinging.",
    claimant: "buddha",
    claim: {
      low: "A person can pursue a goal while observing attachment to its outcome.",
      middle:
        "Observing attachment can allow action without treating success as a refuge.",
      high: "Purposeful effort and non-clinging can coexist.",
    },
    choices: [
      response(
        "failure-choice",
        "When a project fails, what distinguishes release from giving up too soon?",
        "low",
        "Test application",
        "premises",
        3,
        "Asks for a practical criterion distinguishing wise release from avoidance.",
        "value",
        [
          "Examine the reasons for continuing or stopping, rather than deciding from fear of loss.",
          "Non-clinging alone does not decide when to stop; judgment still matters.",
          "Stopping is always wiser than continuing.",
        ],
      ),
      response(
        "shared-ground",
        "Then some forms of ambition are compatible with your account.",
        "high",
        "Secure a concession",
        "achievement",
        2,
        "Establishes genuine common ground, but does not refute the warning about clinging.",
        "value",
        [
          "Yes, if purposeful pursuit is not made a condition of lasting peace.",
          "I concede that point. The remaining question is how attachment is recognized.",
          "No ambition could ever coexist with purposeful effort.",
        ],
      ),
      response(
        "no-feelings",
        "If you release attachment, you cannot care about your work.",
        "middle",
        "Test equivalence",
        "identity",
        0,
        "Equates caring with clinging without explaining why one requires the other.",
        "value",
        [
          "Caring about work need not mean treating its result as an unchanging refuge.",
          "We should distinguish care from a demand that success secure our peace.",
          "I cannot care about anything at all.",
        ],
      ),
    ],
  },
  value: {
    id: "value",
    argument: "Difficult work can help us flourish. A risk of disappointment need not make ambition worthless.",
    claimant: "rand",
    claim: {
      low: "Some difficult projects contribute to a person’s flourishing.",
      middle:
        "A risk of disappointment does not by itself cancel that contribution.",
      high: "Ambition can be worthwhile even when its pursuit carries risk.",
    },
    choices: [
      response(
        "hidden-cost",
        "Have you counted the suffering caused by needing the project to succeed?",
        "low",
        "Expose an omitted cost",
        "cause",
        3,
        "Adds attachment-related costs to the assessment of a difficult project.",
        "ends",
        [
          "Those costs belong in the assessment. They may change which project or method is rational.",
          "Then some worthwhile goals need a less attached way of pursuing them.",
          "Any cost is justified if the project succeeds.",
        ],
      ),
      response(
        "not-sufficient",
        "Worthwhile work does not prove that craving its reward is worthwhile.",
        "middle",
        "Separate ends and means",
        "release",
        3,
        "Prevents the value of the project from justifying every attitude toward its reward.",
        "ends",
        [
          "Agreed. The value of work does not validate every desire attached to it.",
          "Then I defend the project while conceding that its pursuit may need revision.",
          "A valuable end makes every means and desire valuable.",
        ],
      ),
      response(
        "risk-bad",
        "If a project might disappoint, it should never be attempted.",
        "high",
        "Universal challenge",
        "cause",
        0,
        "Treats the presence of risk as decisive without weighing other consequences.",
        "ends",
        [
          "That would rule out worthwhile projects merely because their outcomes are uncertain.",
          "Risk should matter, but it cannot be the only consideration.",
          "Risk never matters when a person has ambition.",
        ],
      ),
    ],
  },
  ends: {
    id: "ends",
    argument: "Success and failure change. Pursue what matters without making lasting peace depend on success.",
    claimant: "buddha",
    claim: {
      low: "Success, failure, and the feelings they bring can change.",
      middle:
        "Making lasting peace depend on them leaves that peace vulnerable.",
      high: "Pursue what matters without asking achievement to secure permanent peace.",
    },
    choices: [
      response(
        "no-promise",
        "What if ambition promises meaningful activity, not permanent peace?",
        "middle",
        "Narrow the dispute",
        "premises",
        3,
        "Removes a stronger promise that a qualified account of ambition need not make.",
        "purpose",
        [
          "Then that ambition avoids the specific promise I challenge. Attachment still deserves attention.",
          "We agree on that limit. Purpose can guide action without promising permanent peace.",
          "Every purpose must secretly promise permanent peace.",
        ],
      ),
      response(
        "care-change",
        "Can I care deeply about success while acknowledging that it will change?",
        "low",
        "Test compatibility",
        "achievement",
        2,
        "Explores the boundary between care and clinging rather than assuming they are identical.",
        "purpose",
        [
          "Yes. The question is whether care becomes a demand that success be your refuge.",
          "Then acknowledging change and examining attachment can coexist with committed effort.",
          "Deep care always requires believing success is permanent.",
        ],
      ),
      response(
        "deny-world",
        "You deny that success or failure is real.",
        "high",
        "Challenge the claim",
        "identity",
        0,
        "The claim concerns dependence on changing outcomes, not their nonexistence.",
        "purpose",
        [
          "I describe changing outcomes, not nonexistent ones.",
          "Outcomes are real; they need not provide an unchanging refuge.",
          "Nothing that happens has any consequence.",
        ],
      ),
    ],
  },
};
export const ENTRY = "purpose";
export const MAX_EXCHANGES = 12;
