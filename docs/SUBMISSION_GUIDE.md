# Congressional App Challenge: RushTwin submission guide

This is a preparation checklist, not a substitute for the current competition rules. Publishing a GitHub repository or website does not submit an entry to the Congressional App Challenge.

## Current-rule verification comes first

The official competition and House websites were blocked by the research environment's network policy when this guide was prepared. **The 2026 deadline, district participation, eligibility, AI policy, video requirements, and submission-form fields have not been verified here.** Do not use an earlier year's deadline or rely on this guide as an eligibility determination.

Use these official starting points:

- [Congressional App Challenge](https://www.congressionalappchallenge.us/) — navigate to the current year's student rules and registration/submission instructions.
- [Student information](https://www.congressionalappchallenge.us/students/) — verify the current cycle before following a form link.
- [House representative lookup](https://www.house.gov/representatives/find-your-representative) — confirm the district using the official lookup. Enter an address there if required, not in a public repository.
- Your representative's official `.house.gov` website — confirm participation and any district instructions or contact details.

## 1. Confirm eligibility and the deadline

Record the official source and the date you checked each item:

| Item to confirm | What to record |
| --- | --- |
| Competition cycle | The year shown by the rules and submission form |
| Participating district | The district you qualify for and confirmation that it participates |
| Student eligibility | Current age/grade, residency/school, and any other requirements |
| Team rules | Allowed team size, membership requirements, and required registration |
| Development period | Any restrictions on when the app was created or substantially updated |
| Originality and AI | Permitted assistance, required attribution, and what work must be your own |
| Deadline | Exact date, time, and time zone, plus any separate registration cutoff |
| Video | Maximum length, required content, permitted hosts, and visibility settings |
| Submission contents | Exact questions, required links/files, permissions, and consent fields |

If anything is unclear, contact the district office through its official website before submitting. Do not assume that understanding AI-generated code is sufficient to satisfy an originality rule. RushTwin's substantial AI assistance needs to be evaluated honestly against the actual rules.

## 2. Prepare the project links

- App: https://tgpatel-tech.github.io/RushTwin/
- Public café demo: https://tgpatel-tech.github.io/RushTwin/#/demo
- Source: https://github.com/tgpatel-tech/RushTwin
- Technical explanation: [SIMULATION_ENGINE.md](../SIMULATION_ENGINE.md)
- AI disclosure: [AI_USAGE.md](../AI_USAGE.md)

Open the app and repository in a signed-out/private browser window. Confirm they work without access to the owner's GitHub account. Use the public café demo for reviewers: a custom project URL alone cannot transfer browser-local project data.

The repository documents a working app; it is not an official submission confirmation.

## 3. Personally test and understand it

Complete this yourself and record the browser, date, and observed results:

- [ ] Run the café baseline and observe the Drinks queue.
- [ ] Pause, resume, seek, and change playback speed.
- [ ] Inspect one customer's tasks and waiting time.
- [ ] Apply the five-worker reallocation and replay the same rush.
- [ ] Explain both improvements and any worsened metrics.
- [ ] Import the sample CSV and handle the invalid sample.
- [ ] Refresh a project and verify that it persists.
- [ ] Export a project and reimport it.
- [ ] Try the site on a phone and on the computer used for recording.
- [ ] Run the automated checks yourself, or accurately state that only the assistant ran them.

Be able to walk through one actual customer from arrival to completion, explain the heap's tie ordering, demonstrate the parallel join, and explain why frame rate cannot change the answer. Know the distinction between cumulative queue delay and elapsed time.

## 4. Write your own submission answers

Use the [worksheet](SUBMISSION_WORKSHEET.md) to record:

- What you personally noticed that motivated the idea.
- Who the tool is intended to help and what problem it models.
- What the app currently does, without presenting future ideas as finished features.
- What you personally wrote, changed, reviewed, tested, and learned.
- What AI and third-party libraries contributed.
- The hardest problem you actually worked through and how you resolved it.
- The limitations and a realistic next improvement.

Use the live form's exact questions and limits. Do not paste invented personal experiences or replace an honest AI disclosure with a claim of unaided authorship.

## 5. Record a clear demonstration

The following is a suggested sequence, **not a verified official video specification**. Adjust it to the current required length and content.

1. Introduce RushTwin and the operational problem briefly.
2. Show the workflow: Customers → Order → Drinks/Food → Pickup → Complete.
3. Run the baseline and show the growing queue. Use Max where needed to save recording time.
4. Explain the measured bottleneck with actual results.
5. Move one worker from Order to Drinks; point out that total staffing remains five.
6. Replay the same demand and show the comparison, including tradeoffs.
7. Briefly explain one real technical mechanism, such as the parallel join or seeded replay.
8. State a limitation and your actual role in the project. Include disclosures wherever the official rules require them.

Record the actual app and actual results. Make sure text is readable and audio is clear. Open the final video link while signed out using the visibility setting required by the competition; a link that requires your account will not work for reviewers.

## 6. Submit through the official current-year form

Navigate to the submission form from the official competition site. Do not assume a GitHub link, repository push, district email, or video upload alone counts as a submission.

Complete every required registration, team, app, written-answer, consent, and link field shown by that form. Keep personal student information out of GitHub issues and public documentation. Review the entry with a parent/guardian or teacher where the form or rules require it.

Submit before the verified deadline with time to resolve errors. Save the actual confirmation page/email or submission ID. If the portal supports later edits, confirm the final saved/submitted status after editing; do not assume a draft is submitted.

## 7. Keep the submitted version stable

Record the Git commit SHA used in the video and submission. Recheck the website and video links before the deadline. Keep the app available for judging and avoid major behavior changes that would make the live demo inconsistent with the submitted explanation. Follow the official rules on post-deadline updates.

## Final packet

Keep these together outside the public repository: official-rule notes, district confirmation, submission answers, video link, app/source links, personal test record, AI/contribution disclosure, submitted commit SHA, and submission confirmation.
