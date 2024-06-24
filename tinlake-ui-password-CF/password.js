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

  if (request.method === "POST") {
    const formData = await request.clone().formData();
    const password = formData.get('password');

    if (password === AUTH_PASS) {
      const redirectUrl = new URL(request.url);
      const newHeaders = new Headers({
        'Set-Cookie': `auth=valid; Max-Age=86400; Path=/; HttpOnly; Secure; SameSite=Strict`,
        'Location': redirectUrl.toString() // Redirect to the same URL or to a specific path
      });
      return new Response(null, {
        status: 302,
        headers: newHeaders
      });
    } else {
      return new Response('Invalid password', { status: 403 });
    }
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
        <form action="" method="POST" accept-charset="UTF-8">
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