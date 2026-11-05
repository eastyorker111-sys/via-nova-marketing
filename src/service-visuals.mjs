// Service routes, not portfolio examples or promised business results.
const routes=[
 ['Planning','Understand the problem','Choose the priorities','Agree the work'],
 ['Branding','Explain the offer','Create the identity','Apply it consistently'],
 ['Websites','Answer their questions','Show what you offer','Make contact easy'],
 ['Content','Know the audience','Create the story','Connect the next step']
];
export const serviceVisual=index=>{const [label,...steps]=routes[index];return `<div class="service-route" aria-hidden="true"><span class="route-label">${label}</span><div class="service-route-track">${steps.map(step=>`<div class="service-route-step"><span class="route-point"></span><strong>${step}</strong></div>`).join('')}</div><div class="route-light"></div></div>`;};
