// FAQ answers reveal independently; original service routes remain the next step.
document.querySelectorAll('.faq-action').forEach(button=>button.addEventListener('click',()=>{
 const original=document.querySelectorAll('.question-card')[Number(button.dataset.originalCard)];
 if(original)original.click();
}));
document.querySelectorAll('.faq-card').forEach(card=>card.addEventListener('toggle',()=>{
 if(!card.open)return;
 document.querySelectorAll('.faq-card').forEach(other=>{if(other!==card)other.open=false});
}));

