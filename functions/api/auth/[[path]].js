const USER_AGENT = "Eaglercraft2/1.0 (+https://github.com/CkWebGamingStudios/Eaglercraft2)";

// Existing code... 

// Inside exchangeToken function
fetch(url, {
    method: 'POST',
    headers: {
        'User-Agent': USER_AGENT,
        // other headers...
    },
});

// Inside fetchProviderIdentity function
fetch(url, {
    method: 'GET',
    headers: {
        'User-Agent': USER_AGENT,
        // other headers...
    },
});