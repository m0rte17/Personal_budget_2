async function fetchEnvelopes() {
    const response = await fetch('https://personal-budget-2-8k83.onrender.com/envelopes');
    if (!response.ok) {
        console.error('Error in receiving envelopes:', response.statusText);
        return;
    }
    const envelopes = await response.json();
    const envelopesList = document.getElementById('envelopes-list');

    envelopes.forEach(envelope => {
        const div = document.createElement('div');
        div.textContent = `Envelope: ${envelope.title}, Budget: ${envelope.budget}`;
        envelopesList.appendChild(div);
    });
}

fetchEnvelopes();
