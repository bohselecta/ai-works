# Adapt the Router to Another Country, Society, or Organization

The software is reusable. The U.S. records are not universal.

A fork should preserve the constrained architecture while replacing the jurisdiction, official source map, language, escalation rules, record set, and society-driven initiative.

## Start with four answers

Before changing code, ask the adopter:

1. **What is the jurisdiction or organization?** Country, state, tribe, city, university, union, nonprofit, company, or other body.
2. **What is the initiative?** Leave this blank until the adopter states the public or organizational goal in their own words.
3. **What sources count as official?** Domains, directories, departments, policy repositories, phone channels, and offline handoffs.
4. **Who owns maintenance?** Name the person or role responsible for reviews and emergency changes.

Do not infer an initiative for another society. The tool should serve a goal chosen by that society or organization.

## Research before coding records

Use primary sources. Build an authority map before writing aliases.

For a government, identify:

- national or federal portals;
- ministries, departments, agencies, and independent bodies;
- services run by states, provinces, regions, counties, municipalities, or tribes;
- official locator pages that already route among lower levels;
- life events that cross agency lines;
- emergency and crisis paths that must bypass the model;
- official languages and common vernacular terms;
- services operated by a private party under public mandate.

For an organization, identify:

- authoritative systems and policy owners;
- teams and escalation paths;
- employee, member, customer, student, or resident tasks;
- protected or confidential workflows that must not enter a model;
- cases where the correct response is a person, not a webpage.

## Build in this order

1. Copy `config/society.template.json` and fill it only from adopter answers.
2. Replace `data/records.us.json` with a new jurisdiction record file.
3. Keep stable namespaced IDs.
4. Add at least three real-world aliases per record, including misspellings and supported languages.
5. Write simple service descriptions with no eligibility claims.
6. Use official locator pages instead of maintaining fifty local links when possible.
7. Create journey records where more than one destination is correct.
8. Add deterministic escalation patterns before any model call.
9. Run the linter.
10. Build an evaluation set weighted toward confusable, out-of-scope, vernacular, and escalation cases.
11. Run at least two models and publish the receipts.
12. Do not call the result production-ready until human reviewers accept the records and gates.

## Rebrand safely

The visual system separates brand color from semantic state colors. Change only the brand tokens in `styles.css`:

```css
--brand-vivid
--brand-deep
--brand-wash
--brand-font-display
--brand-font-data
```

Do not repurpose green, amber, orange, or red as decoration; those colors carry verification and error meaning.

## Required disclosures in every fork

The interface must say:

- who operates the project;
- that it is or is not an official service;
- what the model may and may not do;
- whether requests are stored;
- which model provider receives the text;
- when each result was last reviewed;
- why the linked destination is relevant;
- that the directory is incomplete;
- how to report an incorrect or unsafe route.
