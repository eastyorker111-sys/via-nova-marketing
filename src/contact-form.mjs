export const contactForm = `<form id="enquiry-form" action="https://formspree.io/f/xqpaqedp" method="POST" aria-describedby="enquiry-help">
<h2 class="brief-heading">Tell us about your project</h2>
<p id="enquiry-help" class="brief-intro">Send your enquiry directly to Via Nova. Name, email and message are required.</p>
<div class="field-pair"><label>Your name<input name="name" autocomplete="name" required maxlength="120"></label><label>Your email<input type="email" name="email" autocomplete="email" required maxlength="254"></label></div>
<label>Business <span>(optional)</span><input name="business" autocomplete="organization" maxlength="160"></label>
<label>What would you like help with? <span>(optional)</span><select name="service"><option value="Not specified">Select a service</option><option>Brand strategy</option><option>Brand identity</option><option>Web &amp; digital</option><option>Content &amp; campaigns</option><option>I’m still exploring</option></select></label>
<label>Your message<textarea name="message" required rows="5" maxlength="5000" placeholder="Tell us what you need and what you would like to achieve."></textarea></label>
<div hidden><label>Leave this field empty<input name="_gotcha" tabindex="-1" autocomplete="off"></label></div>
<input type="hidden" name="_subject" value="Via Nova Marketing — website enquiry">
<p class="brief-intro">By sending, you ask us to respond to your enquiry. Formspree processes your submission and may ask you to complete a spam check. Please don’t include passwords or payment details. <a href="privacy.html">Privacy information</a>.</p>
<button class="button" type="submit">Send enquiry <span aria-hidden="true">↗</span></button>
<p class="form-status">After sending, you’ll see a confirmation page. If sending fails, return here or email <a href="mailto:east_yorker@outlook.com">east_yorker@outlook.com</a>.</p>
</form>`;
