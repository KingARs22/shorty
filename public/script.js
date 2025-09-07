// public/script.js
document.getElementById('shortenForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const longUrl = document.getElementById('longUrl').value.trim();
  const customAlias = document.getElementById('customAlias').value.trim() || undefined;
  const expiryDaysRaw = document.getElementById('expiryDays').value.trim();
  const expiryDays = expiryDaysRaw ? Number(expiryDaysRaw) : undefined;
  const payload = { longUrl };
  if (customAlias) payload.customAlias = customAlias;
  if (expiryDays) payload.expiryDays = expiryDays;

  const res = await fetch('/api/shorten', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  const out = document.getElementById('result');
  if (!res.ok) {
    out.innerHTML = `<div class="err">Error: ${data.error || JSON.stringify(data)}</div>`;
    return;
  }
  out.innerHTML = `<div class="ok">Short URL: <a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a><br/>Short code: <strong>${data.shortCode}</strong></div>`;
});

document.getElementById('statsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = document.getElementById('statsCode').value.trim();
  if (!code) return;
  const res = await fetch(`/api/stats/${encodeURIComponent(code)}`);
  const data = await res.json();
  const box = document.getElementById('statsResult');
  if (!res.ok) {
    box.textContent = 'Error: ' + (data.error || JSON.stringify(data));
    return;
  }
  box.textContent = JSON.stringify(data, null, 2);
});
