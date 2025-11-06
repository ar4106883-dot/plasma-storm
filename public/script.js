
const submitBtn = document.getElementById('submitBtn');
const promptInput = document.getElementById('prompt');
const providerSelect = document.getElementById('provider');
const responseDiv = document.getElementById('response');

submitBtn.addEventListener('click', async () => {
    const prompt = promptInput.value;
    const provider = providerSelect.value;

    if (!prompt) return;

    responseDiv.textContent = 'Thinking...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('/functions/gateway', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                provider: provider // The gateway uses this to route the request
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        // Display the response and which provider handled it
        responseDiv.textContent = `--- Response from ${data.provider} ---\n\n${data.content}`;

    } catch (error) {
        responseDiv.textContent = `Error: ${error.message}`;
        console.error('Fetch error:', error);
    } finally {
        submitBtn.disabled = false;
    }
});
