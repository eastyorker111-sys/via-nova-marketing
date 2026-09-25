const unsure = 'I need guidance';
const q = (id, title, help, choices, when = () => true, required = false) => ({ id, title, help, choices, when, required });
export const serviceChoices = ['Strategy', 'Logo & brand identity', 'Website', 'Marketing materials', 'Video', 'Content & social media', 'Campaigns', 'Full journey', 'Help me decide'];
const selected = a => a.Services || [];
const guidance = a => selected(a).includes('Help me decide');
export function hasService(a, service) {
  return selected(a).includes(service) || selected(a).includes('Full journey') ||
    (guidance(a) && a['Confirm suggested support'] === 'Yes, include this support' && a['Support direction'] === service);
}
const launch = a => a['Project goal'] === 'Launch a product';
const strategy = a => hasService(a, 'Strategy');
const brand = a => hasService(a, 'Logo & brand identity');
const website = a => hasService(a, 'Website');
const video = a => hasService(a, 'Video');
const content = a => hasService(a, 'Content & social media');
export const questions = [
  q('Project goal', 'What brings you here?', 'Choose the closest fit. You can change any answer later.', ['Start something new', 'Improve my current presence', 'Get ongoing support', 'Launch a product', unsure], undefined, true),
  q('Product stage', 'Where is your product today?', 'This helps us tailor the conversation; it does not commit you to a package.', ['An idea', 'In development', 'Ready to launch', unsure], launch, true),
  { ...q('Services', 'What would you like help with?', 'Choose one or several. A product launch can need just a video, logo or website.', serviceChoices, undefined, true), multiple: true },
  q('Business', 'What is your business or product called?', 'Optional. A working name is fine. Leave this blank if you have not decided.'),
  q('Goals and audience', 'What would you like this work to achieve?', 'For example: explain a new offer, improve the brand, attract enquiries or support a launch. “I need guidance” is a useful answer.', undefined, undefined, true),
  q('Audience', 'Who do you want to reach?', 'For example: local families or Canadian business owners. Say “not sure” if you need help defining this.'),
  q('Current challenge', 'What is making that difficult right now?', 'For example: an unclear message, inconsistent visuals or uncertainty about the next step.', undefined, guidance),
  q('Support direction', 'Which kind of help sounds closest?', 'These are possible starting points, not a diagnosis. Choose one to consider, or discuss it with us. Financing, manufacturing and regulatory work may need other providers.', ['Strategy', 'Logo & brand identity', 'Website', 'Marketing materials', 'Video', 'Content & social media', 'Campaigns', 'Discuss with Nabil'], guidance),
  q('Confirm suggested support', 'Would you like questions about that support?', 'Yes adds your chosen direction to this brief. Otherwise, we will keep it as a discussion point without expanding your scope.', ['Yes, include this support', 'Keep it for discussion'], a => guidance(a) && !!a['Support direction'] && a['Support direction'] !== 'Discuss with Nabil'),
  q('Existing assets', 'What materials do you already have?', 'For example: a logo, website copy, product photos, video footage or social accounts. Starting from scratch is fine.'),
  q('Existing links', 'Are there links you would like us to review?', 'Optional: your website, social profile or a view-only asset link. Do not share passwords or private customer information.'),
  q('Product problem and evidence', 'What problem would your product solve, and what have you learned so far?', 'Briefly share any conversations or tests, or say it is still an assumption. We do not need confidential product details.', undefined, a => launch(a) && strategy(a) && a['Product stage'] === 'An idea'),
  q('Discovery next step', 'Would you like to discuss customer discovery first?', 'Research may help test assumptions. This is a possible next step, not a promise that the product will succeed.', ['Yes, discuss discovery', 'No, focus on my selected work', unsure], a => launch(a) && strategy(a) && a['Product stage'] === 'An idea'),
  q('Product readiness', 'What readiness details affect the marketing work?', 'For example: prototype photos, approved claims, customer feedback, available stock or a date still to be confirmed. Separate what is ready from what you expect.', undefined, a => launch(a) && a['Product stage'] !== 'An idea'),
  q('Strategy needs', 'Where would a clearer plan help?', 'For example: positioning, customer research, launch priorities or your marketing direction.', undefined, strategy),
  q('Alternatives and differences', 'What alternatives do customers use, and how might your offer differ?', 'Share competitors, strengths, gaps or risks you already know. “Not sure” is fine; these are your observations, not verified research.', undefined, a => launch(a) && strategy(a)),
  q('Commercial context', 'How do you expect to sell and deliver your product?', 'For example: an online store or retail partners. Share pricing assumptions, main cost constraints or dependencies if useful. Marketing support does not include manufacturing, distribution or regulatory approval unless separately agreed with qualified providers.', undefined, a => launch(a) && strategy(a)),
  q('Launch measures', 'What would you like to measure after launch?', 'For example: enquiries, qualified leads or purchases. We will agree realistic measures; these are goals, not guaranteed results.', undefined, a => launch(a) && (strategy(a) || hasService(a, 'Campaigns'))),
  q('Brand starting point', 'Is this a new identity or a refresh?', 'Choose the closest fit for the logo and brand work.', ['A new logo or identity', 'Refresh an existing identity', unsure], brand),
  q('Brand to preserve', 'What should stay from your current identity?', 'For example: the logo symbol, colours or something customers recognise.', undefined, a => brand(a) && a['Brand starting point'] === 'Refresh an existing identity'),
  q('Brand preferences', 'How should your brand feel?', 'For example: approachable, refined or bold. Share references, purpose or principles if useful, or ask us for guidance.', undefined, brand),
  q('Brand uses', 'Where will the identity appear?', 'For example: packaging, signage, social profiles, a website or printed materials.', undefined, brand),
  q('Website starting point', 'Are we creating a new website or improving one?', 'We will reuse the website link and materials you have already shared.', ['A new website', 'Improve an existing website', unsure], website),
  q('Website challenge', 'What needs improving on the current website?', 'For example: confusing navigation, outdated information or difficulty making an enquiry.', undefined, a => website(a) && a['Website starting point'] === 'Improve an existing website'),
  q('Website action', 'What should visitors be able to do?', 'Choose the main action. You can describe additional needs next.', ['Make an enquiry', 'Book an appointment', 'Buy online', 'Learn about the business', unsure], website),
  q('Website features', 'What features or website content do you need help with?', 'For example: bookings, a catalogue, copy or product pages. Mention only what is missing from the assets you shared. Feasibility and scope will be confirmed.', undefined, website),
  q('Video purpose', 'What is the video for?', 'Choose the closest purpose; your overall goal is already saved.', ['Introduce a business or product', 'Explain how something works', 'Promote an offer', 'Share a story or testimonial', unsure], video),
  q('Content channels', 'Where will people see this content?', 'For example: Instagram, LinkedIn, YouTube, your website or paid ads. Say “I need guidance” if you are unsure.', undefined, a => video(a) || content(a) || (launch(a) && (strategy(a) || hasService(a, 'Campaigns')))),
  q('Video message', 'What is the main thing viewers should remember?', 'A short message is enough, or ask for help developing it.', undefined, video),
  q('Video production', 'What video material can we work with?', 'We will review the assets you listed and confirm what production is feasible.', ['Existing footage to edit', 'A mix of existing and new material', 'Production needed from scratch', unsure], video),
  q('Content support', 'What content support would be useful?', 'For example: planning posts, writing, visuals or ongoing social support. We will agree channels and responsibilities.', undefined, content),
  q('Materials needed', 'Which marketing materials do you need?', 'For example: a brochure, presentation, packaging artwork or signage. Describe intended use and any known sizes.', undefined, a => hasService(a, 'Marketing materials')),
  q('Campaign needs', 'What would you like the campaign to promote?', 'Share the offer and any channel preferences not already covered. Budget and timing come next.', undefined, a => hasService(a, 'Campaigns')),
  q('Budget direction', 'Do you have a budget in mind?', 'This helps shape a suitable scope. There are no automatic prices.', ['I have a budget in mind', unsure, 'I prefer to discuss this']),
  q('Budget details', 'What budget should we plan around?', 'Include currency and whether this is a one-off or monthly budget. Optional.', undefined, a => a['Budget direction'] === 'I have a budget in mind'),
  q('Timing', 'When would you like to begin?', 'Dates and availability will be agreed before work starts.', ['Exploring / not sure yet', 'As soon as practical', 'Within 1–3 months', 'Later / planning ahead', 'I have a specific date']),
  q('Timing details', 'What date should we keep in mind?', 'Tell us whether it is fixed or flexible. This is not a confirmed delivery date.', undefined, a => a.Timing === 'I have a specific date'),
  q('Constraints and questions', 'Is there anything else we should discuss?', 'Optional: approvals needed, limits, unanswered questions or assumptions. Your brief records what you tell us; we will confirm important details together.'),
  { ...q('name', 'What is your name?', 'So we know who to reply to.', undefined, undefined, true), type: 'text', autocomplete: 'name' },
  { ...q('email', 'Where should we send our response?', 'We use this email to respond to your enquiry.', undefined, undefined, true), type: 'email', autocomplete: 'email' },
  { ...q('Phone', 'Would you like to share a phone number?', 'Optional. You can leave this blank.', undefined), type: 'tel', autocomplete: 'tel' }
];
export function activeQuestions(answers) { return questions.filter(question => question.when(answers)); }
