javascript
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
        // This is the WEB ADDRESS for your function, created by Netlify.
        const response = await fetch('/api/gateway', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                provider: provider
            })
        });

        if (!response.ok) {
            // Get more detail from the server's error response
            const errorData = await response.json().catch(() => ({ message: 'Server returned an invalid response.' }));
            throw new Error(`HTTP error! Status: ${response.status} - ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        
        responseDiv.textContent = `--- Response from ${data.provider} ---\n\n${data.content}`;

    } catch (error) {
        responseDiv.textContent = `Error: ${error.message}`;
        console.error('Fetch error:', error);
    } finally {
        submitBtn.disabled = false;
    }
});
