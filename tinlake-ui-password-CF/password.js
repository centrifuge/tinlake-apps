// This script is deployed as a Cloudflare Worker under the Centrifuge account.
// It handles password-based authentication for protected resources, setting a secure cookie upon successful authentication.

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
  })
  
  async function handleRequest(request) {
    const AUTH_PASS = 'Centrifuge'; // Define the password here
  
    // Check for authentication cookie
    const cookie = request.headers.get('Cookie');
    if (cookie && cookie.includes('auth=valid')) {
      return fetch(request);
    }
  
    const url = new URL(request.url);
    const params = new URLSearchParams(url.search);
    const password = params.get('password');
  
    if (password === AUTH_PASS) {
      const originalResponse = await fetch(request);
      const newHeaders = new Headers(originalResponse.headers);
      newHeaders.append('Set-Cookie', `auth=valid; Max-Age=86400; Path=/; HttpOnly; Secure; SameSite=Strict`);
      return new Response(originalResponse.body, {
        status: originalResponse.status,
        statusText: originalResponse.statusText,
        headers: newHeaders
      });
    } else if (password) {
      return new Response('Invalid password', { status: 403 });
    }
  
    // Serve the styled HTML form for password input
    return new Response(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; }
            form { background: #f1f1f1; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            input, button { padding: 10px; margin-top: 10px; width: 100%; box-sizing: border-box; }
            button { background: #007BFF; color: white; border: none; }
          </style>
        </head>
        <body>
          <form action="" method="GET">
            <input type="password" name="password" placeholder="Enter Password" required>
            <button type="submit">Submit</button>
          </form>
        </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html',
      },
      status: 401
    });
  }